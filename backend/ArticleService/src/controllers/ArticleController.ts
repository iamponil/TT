import { Request, Response } from 'express';
import { validationResult, body, param, query } from 'express-validator';
import ArticleService from '../services/ArticleService';

class ArticleController {
  public validators = {
    create: [
      body('title').isString().notEmpty(),
      body('content').isString().notEmpty(),
      body('image').optional().isString(),
      body('tags').optional().isArray(),
    ],
    update: [
      param('id').isString().notEmpty(),
      body('title').optional().isString(),
      body('content').optional().isString(),
      body('image').optional().isString(),
      body('tags').optional().isArray(),
    ],
    list: [
      query('page').optional().isInt({ min: 1 }),
      query('limit').optional().isInt({ min: 1, max: 100 }),
    ],
    idParam: [param('id').isString().notEmpty()],
  };

  // POST /api/articles
  public async create(req: any, res: Response) {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(400).json({ errors: errors.array() });

    try {
      const payload = {
        title: req.body.title,
        content: req.body.content,
        image: req.body.image,
        tags: req.body.tags || [],
        author: req.user.id,
      };
      const article = await ArticleService.createArticle(payload);
      return res.status(201).json({ article });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: 'Server error' });
    }
  }

  // GET /api/articles
  public async list(req: Request, res: Response) {
    try {
      const opts = {
        page: req.query.page ? Number(req.query.page) : 1,
        limit: req.query.limit ? Number(req.query.limit) : 20,
        tags: req.query.tags
          ? Array.isArray(req.query.tags)
            ? (req.query.tags as string[])
            : (req.query.tags as string).split(',')
          : undefined,
        author: req.query.author as string | undefined,
        search: req.query.search as string | undefined,
      };
      const result = await ArticleService.listArticles(opts);
      return res.json(result);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: 'Server error' });
    }
  }

  // GET /api/articles/:id
  public async getById(req: Request, res: Response) {
    try {
      const article = await ArticleService.getArticleById(req.params.id);
      if (!article)
        return res.status(404).json({ message: 'Article not found' });
      return res.json({ article });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: 'Server error' });
    }
  }

  // PATCH /api/articles/:id
  public async update(req: any, res: Response) {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(400).json({ errors: errors.array() });

    try {
      const updates: any = {};
      if (req.body.title !== undefined) updates.title = req.body.title;
      if (req.body.content !== undefined) updates.content = req.body.content;
      if (req.body.image !== undefined) updates.image = req.body.image;
      if (req.body.tags !== undefined) updates.tags = req.body.tags;

      const updated = await ArticleService.updateArticle(
        req.params.id,
        updates
      );
      if (!updated)
        return res.status(404).json({ message: 'Article not found' });
      return res.json({ message: 'Article updated', article: updated });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: 'Server error' });
    }
  }

  // DELETE /api/articles/:id
  public async delete(req: Request, res: Response) {
    try {
      const deleted = await ArticleService.deleteArticle(req.params.id);
      if (!deleted)
        return res.status(404).json({ message: 'Article not found' });
      return res.json({ message: 'Article deleted' });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: 'Server error' });
    }
  }
}

export default new ArticleController();
