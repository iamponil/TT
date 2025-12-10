import { Application, Request, Response } from 'express';
import express from 'express';
import proxy from 'express-http-proxy';

class Routes {
  constructor(private app: Application) {}

  private apiRoutes() {
    // 1️⃣ Root test route
    this.app.get('/', (req: Request, res: Response) => {
      res.send({ message: 'API Gateway is running' });
    });

    // 2️⃣ Log all incoming requests
    this.app.use((req: Request, res: Response, next) => {
      next();
    });

    // 3️⃣ Parse JSON for proxy requests
    this.app.use(
      ['/auth', '/users', '/articles'],
      express.json({ type: '*/*' })
    );

    // 4️⃣ Proxy /auth/* to UsersService
    this.app.use(
      '/auth',
      proxy('http://localhost:4000', {
        proxyReqPathResolver: (req) => {
          // Strip '/auth' prefix because UsersService routes don't have it
          return req.originalUrl.replace(/^\/auth/, '');
        },
      })
    );

    // 5️⃣ Proxy /users/* to UsersService
    this.app.use(
      '/users',
      proxy('http://localhost:4000', {
        proxyReqPathResolver: (req) => {
          return req.originalUrl.replace(/^\/users/, '');
        },
      })
    );

    // 6️⃣ Proxy /articles/* to ArticleService
    this.app.use(
      '/articles',
      proxy('http://localhost:7000', {
        proxyReqPathResolver: (req) => {
          // ArticleService routes are prefixed with /api/articles
          // So if user hits Gateway /articles/123 -> matches /articles
          // We want to forward to ArticleService /api/articles/123
          // If we replace /articles with /api/articles, we get /api/articles/123
          return req.originalUrl.replace(/^\/articles/, '/api/articles');
        },
      })
    );
  }

  public init() {
    this.apiRoutes();
  }
}

export default Routes;
