import { Application, Request, Response } from 'express';
import ArticleController from './controllers/ArticleController';
import CommentController from './controllers/CommentController';
import { authenticate } from './middlewares/auth';
import { canEditArticle, requireAdminForDelete, canCreateArticle } from './middlewares/authorize';
import { writeLimiter } from './middlewares/rateLimit';

class ArticleRoutes {
  constructor(private app: Application) {}

  private routes() {
    this.app.get('/', (req: Request, res: Response) => {
      res.send({ message: 'Article Service is running' });
    });

    // Article endpoints
    const base = '/api/articles';

    // list & create
    this.app.get(
      base,
      authenticate,
      ArticleController.list.bind(ArticleController)
    );
    this.app.post(
      base,
      authenticate,
      writeLimiter,
      canCreateArticle,
      ArticleController.validators.create,
      ArticleController.create.bind(ArticleController)
    );

    // Comment Routes (Nested)
    // POST /api/articles/:articleId/comments
    this.app.post(
      `${base}/:articleId/comments`,
      authenticate,
      writeLimiter,
      CommentController.create.bind(CommentController)
    );

    // GET /api/articles/:articleId/comments
    this.app.get(
      `${base}/:articleId/comments`,
      CommentController.list.bind(CommentController)
    );

    // single resource
    this.app.get(
      `${base}/:id`,
      authenticate,
      ArticleController.getById.bind(ArticleController)
    );
    this.app.patch(
      `${base}/:id`,
      authenticate,
      writeLimiter,
      ArticleController.validators.update,
      canEditArticle,
      ArticleController.update.bind(ArticleController)
    );

    this.app.delete(
      `${base}/:id`,
      authenticate,
      writeLimiter,
      requireAdminForDelete,
      ArticleController.delete.bind(ArticleController)
    );


    
  }

  public init() {
    this.routes();
  }
}

export default ArticleRoutes;
