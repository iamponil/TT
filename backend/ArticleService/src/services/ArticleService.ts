import Article, { IArticle } from '../models/Article';
import mongoose from 'mongoose';
import '../models/User'; // Register User model for populate
import { getRedisClient } from './RedisService';

export interface ListOptions {
  page?: number;
  limit?: number;
  tags?: string[];
  author?: string;
  search?: string;
}

class ArticleService {
  private static CACHE_TTL = 3600; // 1 hour

  private async invalidateCache(id?: string) {
    try {
      const client = getRedisClient();
      const keys = await client.keys('articles:list:*');
      if (keys.length) await client.del(keys);
      if (id) await client.del(`articles:${id}`);
    } catch (err) {
      console.error('Redis invalidation error:', err);
    }
  }

  async createArticle(data: Partial<IArticle>) {
    const article = await Article.create(data);
    await this.invalidateCache();
    return article.toObject();
  }

  async getArticleById(id: string) {
    if (!mongoose.Types.ObjectId.isValid(id)) return null;

    const cacheKey = `articles:${id}`;
    try {
      const client = getRedisClient();
      const cached = await client.get(cacheKey);
      if (cached) return JSON.parse(cached);
    } catch (err) {
      console.error('Redis get error:', err);
    }

    const article = await Article.findById(id)
      .select('-__v')
      .populate('author', 'name email')
      .lean()
      .exec();

    if (article) {
      try {
        const client = getRedisClient();
        await client.setEx(
          cacheKey,
          ArticleService.CACHE_TTL,
          JSON.stringify(article)
        );
      } catch (err) {
        console.error('Redis set error:', err);
      }
    }

    return article;
  }

  async listArticles(opts: ListOptions = {}) {
    // Generate cache key based on options
    const cacheKey = `articles:list:${JSON.stringify(opts)}`;

    try {
      const client = getRedisClient();
      const cached = await client.get(cacheKey);
      if (cached) return JSON.parse(cached);
    } catch (err) {
      console.error('Redis list get error:', err);
    }

    const page = Math.max(1, opts.page || 1);
    const limit = Math.min(100, opts.limit || 20);
    const skip = (page - 1) * limit;

    const filter: any = {};
    if (opts.tags && opts.tags.length) filter.tags = { $in: opts.tags };
    if (opts.author) filter.author = opts.author;
    if (opts.search) filter.$text = { $search: opts.search };

    const query = Article.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select('title tags image author createdAt updatedAt');

    const [docs, total] = await Promise.all([
      query.lean().exec(),
      Article.countDocuments(filter),
    ]);

    const result = { docs, total, page, limit };

    try {
      const client = getRedisClient();
      await client.setEx(
        cacheKey,
        ArticleService.CACHE_TTL,
        JSON.stringify(result)
      );
    } catch (err) {
      console.error('Redis list set error:', err);
    }

    return result;
  }

  async updateArticle(id: string, updates: Partial<IArticle>) {
    if (!mongoose.Types.ObjectId.isValid(id)) return null;
    const updated = await Article.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
      select: '-__v',
    })
      .populate('author', 'name email')
      .lean()
      .exec();

    if (updated) await this.invalidateCache(id);
    return updated;
  }

  async deleteArticle(id: string) {
    if (!mongoose.Types.ObjectId.isValid(id)) return null;
    const deleted = await Article.findByIdAndDelete(id).lean().exec();
    if (deleted) await this.invalidateCache(id);
    return deleted;
  }

  async getAuthorId(id: string): Promise<string | null> {
    if (!mongoose.Types.ObjectId.isValid(id)) return null;
    // Try cache first if possible, but for auth check maybe safer to hit DB or very short cache.
    // Given it's permission check, security > perf, but let's check DB.
    // If we cached the article, we could use that.
    const cacheKey = `articles:${id}`;
    try {
      const client = getRedisClient();
      const cached = await client.get(cacheKey);
      if (cached) {
        const article = JSON.parse(cached);
        // Author might be populated object or id
        return article.author._id || article.author;
      }
    } catch (e) {}

    const doc = await Article.findById(id).select('author').lean().exec();
    return doc?.author?.toString() ?? null;
  }

  // Dashboard statistics methods
  async getSummary() {
    const [total, published, drafts] = await Promise.all([
      Article.countDocuments(),
      Article.countDocuments({ status: 'published' }).catch(() => 0),
      Article.countDocuments({ status: 'draft' }).catch(() => 0),
    ]);

    // Calculate average read time (assuming 200 words per minute)
    const articles = await Article.find().select('content').lean().limit(100);
    const totalWords = articles.reduce((sum, article) => {
      return sum + (article.content?.split(/\s+/).length || 0);
    }, 0);
    const averageReadTimeMinutes =
      articles.length > 0
        ? Math.round((totalWords / articles.length / 200) * 10) / 10
        : 0;

    return {
      total,
      published: published || total,
      drafts: drafts || 0,
      averageReadTimeMinutes,
    };
  }

  async getCountByDay(days: number = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const results = await Article.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Fill in missing days with 0 counts
    const daysArray: string[] = [];
    const countsArray: number[] = [];
    const resultMap = new Map(results.map((r) => [r._id, r.count]));

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      daysArray.push(dateStr);
      countsArray.push(resultMap.get(dateStr) || 0);
    }

    return { days: daysArray, counts: countsArray };
  }

  async getCountByAuthor() {
    const results = await Article.aggregate([
      {
        $group: {
          _id: '$author',
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 20 },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'authorInfo',
        },
      },
      { $unwind: { path: '$authorInfo', preserveNullAndEmptyArrays: true } },
    ]);

    return results.map((r) => ({
      authorId: r._id.toString(),
      authorName: r.authorInfo?.name || 'Unknown',
      count: r.count,
    }));
  }

  async getTopByComments(limit: number = 10) {
    const Comment = mongoose.model('Comment');

    const results = await Comment.aggregate([
      {
        $group: {
          _id: '$article',
          comments: { $sum: 1 },
        },
      },
      { $sort: { comments: -1 } },
      { $limit: limit },
      {
        $lookup: {
          from: 'articles',
          localField: '_id',
          foreignField: '_id',
          as: 'articleInfo',
        },
      },
      { $unwind: '$articleInfo' },
    ]);

    return results.map((r) => ({
      articleId: r._id.toString(),
      title: r.articleInfo.title,
      comments: r.comments,
      views: Math.floor(Math.random() * 10000), // Mock views for now
    }));
  }

  async getStatusDistribution() {
    // Query actual status counts from the database
    const results = await Article.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]);

    // Convert to expected format and ensure all statuses are represented
    const statusMap: Record<string, number> = {
      published: 0,
      draft: 0,
      archived: 0,
    };

    // Fill in actual counts
    results.forEach((item) => {
      const status = item._id?.toLowerCase() || 'draft';
      if (status in statusMap) {
        statusMap[status] = item.count;
      }
    });

    return [
      { status: 'published', count: statusMap.published },
      { status: 'draft', count: statusMap.draft },
      { status: 'archived', count: statusMap.archived },
    ];
  }
}

export default new ArticleService();
