import { Application, Request, Response } from 'express';
import ArticleController from './controllers/ArticleController';
import CommentController from './controllers/CommentController';
import { authenticate } from './middlewares/auth';
import multer from 'multer';
import path from 'path';
import fs from 'fs-extra';
import {
  canEditArticle,
  requireAdminForDelete,
  canCreateArticle,
} from './middlewares/authorize';
import { writeLimiter } from './middlewares/rateLimit';

const uploadDir = path.join(__dirname, '../public/uploads'); // Adjust path if needed
fs.ensureDirSync(uploadDir);

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, 'article-' + uniqueSuffix + ext);
  },
});

const upload = multer({ storage: storage });
class ArticleRoutes {
  constructor(private app: Application) {}

  private routes() {
    this.app.get('/', (req: Request, res: Response) => {
      res.send({ message: 'Article Service is running' });
    });
    const uploadDir = path.join(__dirname, '../public/uploads'); // Adjust path if needed
    fs.ensureDirSync(uploadDir);

    const storage = multer.diskStorage({
      destination: (req, file, cb) => {
        cb(null, uploadDir);
      },
      filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        const ext = path.extname(file.originalname);
        cb(null, 'article-' + uniqueSuffix + ext);
      },
    });

    const upload = multer({ storage: storage });

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
    this.app.post(
      `${base}/upload`,
      // authenticate, // Optional: verify user is logged in to upload
      upload.single('image'), // Middleware processes the file
      ArticleController.upload.bind(ArticleController) // Controller returns JSON
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

    // Dashboard/Statistics endpoints
    const statsBase = '/api/v1/articles';

    this.app.get(
      `${statsBase}/summary`,
      authenticate,
      ArticleController.getSummary.bind(ArticleController)
    );

    this.app.get(
      `${statsBase}/count-by-day`,
      authenticate,
      ArticleController.getCountByDay.bind(ArticleController)
    );

    this.app.get(
      `${statsBase}/count-by-author`,
      authenticate,
      ArticleController.getCountByAuthor.bind(ArticleController)
    );

    this.app.get(
      `${statsBase}/top-by-comments`,
      authenticate,
      ArticleController.getTopByComments.bind(ArticleController)
    );

    this.app.get(
      `${statsBase}/status-distribution`,
      authenticate,
      ArticleController.getStatusDistribution.bind(ArticleController)
    );
  }

  public init() {
    this.routes();
  }
}

export default ArticleRoutes;
