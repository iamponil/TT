import { Request, Response } from 'express';
import Comment from '../models/Comment';
import Article from '../models/Article';
import { getRedisClient } from '../services/RedisService';

class CommentController {
  // POST /api/articles/:articleId/comments
  public async create(req: any, res: Response) {
    try {
      const articleId = req.params.articleId;
      const authorId = req.user.id;
      const { content, parentComment } = req.body;

      // 1. Verify Article exists
      const article = await Article.findById(articleId);
      if (!article) return res.status(404).json({ message: 'Article not found' });

      // 2. Create Comment
      const comment = await Comment.create({
        content,
        article: articleId,
        author: authorId,
        authorName: req.user.name || 'Unknown',
        parentComment: parentComment || null,
      });

      // 3. No need to populate author if we store name, but keep it if needed for ID
      // await comment.populate('author', 'name email'); 

      // 4. Trigger Real-time Notification (via Redis Pub/Sub)
      // We publish an event that NotificationService is listening to
      const redis = getRedisClient();
      const eventData = {
        type: 'new_comment',
        payload: {
          comment,
          articleTitle: article.title,
          articleAuthorId: article.author.toString(), // To notify the author
        },
      };
      await redis.publish('notifications', JSON.stringify(eventData));

      return res.status(201).json(comment);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: 'Server error' });
    }
  }

  // GET /api/articles/:articleId/comments
  public async list(req: Request, res: Response) {
    try {
      const articleId = req.params.articleId;
      // Fetch top-level comments (no parent) and populate replies
      // Note: Deep nesting population can be expensive. 
      // For this MVP, we fetch top-level and 1 level of replies or just all and reconstruct on frontend.
      // Let's fetch all for this article and let frontend build the tree, OR fetch top-level.
      // Simple strategy: Fetch all for article, sorted by CreatedAt.
      
      const comments = await Comment.find({ article: articleId })
        .populate('author', 'name')
        .sort({ createdAt: 1 }); // Oldest first (chronological)

      return res.json(comments);
    } catch (err) {
      return res.status(500).json({ message: 'Server error' });
    }
  }
}

export default new CommentController();
