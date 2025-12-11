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
      console.log(`${req.method} ${req.originalUrl}`);
      next();
    });

    // 4️⃣ Proxy /auth/* to UsersService
    this.app.use(
      '/auth',
      proxy('http://localhost:4000', {
        proxyReqPathResolver: (req) => {
          // Strip '/auth' prefix because UsersService routes don't have it
          const path = req.originalUrl.replace(/^\/auth/, '');
          console.log(`Proxying to UserService: ${path}`);
          return path;
        },
        // Preserve cookies and headers
        preserveHostHdr: true,
        parseReqBody: true,
        proxyReqOptDecorator: (proxyReqOpts, srcReq) => {
          // Forward cookies from the original request
          if (srcReq.headers.cookie) {
            proxyReqOpts.headers = proxyReqOpts.headers || {};
            proxyReqOpts.headers['cookie'] = srcReq.headers.cookie;
          }
          return proxyReqOpts;
        },
        userResDecorator: (proxyRes, proxyResData, userReq, userRes) => {
          // Forward Set-Cookie headers from backend to client
          const setCookieHeaders = proxyRes.headers['set-cookie'];
          if (setCookieHeaders) {
            userRes.setHeader('Set-Cookie', setCookieHeaders);
          }
          return proxyResData;
        },
      })
    );

    // 5️⃣ Proxy /api/v1/users/* to UsersService (Dashboard statistics)
    this.app.use(
      '/api/v1/users',
      proxy('http://localhost:4000', {
        proxyReqPathResolver: (req) => {
          // Forward as-is to UserService which expects /api/v1/users/*
          const path = req.originalUrl;
          console.log(`Proxying to UserService (stats): ${path}`);
          return path;
        },
        preserveHostHdr: true,
        parseReqBody: true,
        proxyReqOptDecorator: (proxyReqOpts, srcReq) => {
          proxyReqOpts.headers = proxyReqOpts.headers || {};
          // Forward cookies
          if (srcReq.headers.cookie) {
            proxyReqOpts.headers['cookie'] = srcReq.headers.cookie;
          }
          // Forward Authorization header (JWT token)
          if (srcReq.headers.authorization) {
            proxyReqOpts.headers['authorization'] =
              srcReq.headers.authorization;
          }
          return proxyReqOpts;
        },
      })
    );
    // 7.5️⃣ Proxy /articles/uploads/* to ArticleService (Static Images)
    // MUST be before the generic /articles route
    this.app.use(
      '/articles/uploads',
      proxy('http://localhost:7000', {
        proxyReqPathResolver: (req) => {
          // Input: /articles/uploads/image.jpg
          // Goal: /uploads/image.jpg (Standard Express static path)

          // Remove '/articles' from the start
          const path = req.originalUrl.replace(/^\/articles/, '');
          console.log(`Proxying static image: ${path}`);
          return path;
        },
        preserveHostHdr: true,
      })
    );

    // 6️⃣ Proxy /users/* to UsersService (Basic user routes)
    this.app.use(
      '/users',
      proxy('http://localhost:4000', {
        proxyReqPathResolver: (req) => {
          const path = req.originalUrl.replace(/^\/users/, '');
          console.log(`Proxying to UserService: ${path}`);
          return path;
        },
        preserveHostHdr: true,
        parseReqBody: true,
        proxyReqOptDecorator: (proxyReqOpts, srcReq) => {
          proxyReqOpts.headers = proxyReqOpts.headers || {};
          // Forward cookies
          if (srcReq.headers.cookie) {
            proxyReqOpts.headers['cookie'] = srcReq.headers.cookie;
          }
          // Forward Authorization header (JWT token)
          if (srcReq.headers.authorization) {
            proxyReqOpts.headers['authorization'] =
              srcReq.headers.authorization;
          }
          return proxyReqOpts;
        },
      })
    );

    // 7️⃣ Proxy /api/v1/articles/* to ArticleService (Dashboard statistics)
    this.app.use(
      '/api/v1/articles',
      proxy('http://localhost:7000', {
        proxyReqPathResolver: (req) => {
          // Forward as-is to ArticleService which expects /api/v1/articles/*
          const path = req.originalUrl;
          console.log(`Proxying to ArticleService (stats): ${path}`);
          return path;
        },
        preserveHostHdr: true,
        parseReqBody: true,
        proxyReqOptDecorator: (proxyReqOpts, srcReq) => {
          proxyReqOpts.headers = proxyReqOpts.headers || {};
          // Forward cookies
          if (srcReq.headers.cookie) {
            proxyReqOpts.headers['cookie'] = srcReq.headers.cookie;
          }
          // Forward Authorization header (JWT token)
          if (srcReq.headers.authorization) {
            proxyReqOpts.headers['authorization'] =
              srcReq.headers.authorization;
          }
          return proxyReqOpts;
        },
      })
    );

    // 8️⃣ Proxy /articles/* to ArticleService (CRUD operations)
    this.app.use(
      '/articles',
      proxy('http://localhost:7000', {
        proxyReqPathResolver: (req) => {
          // ArticleService CRUD routes are at /api/articles
          const path = req.originalUrl.replace(/^\/articles/, '/api/articles');
          console.log(`Proxying to ArticleService: ${path}`);
          return path;
        },
        preserveHostHdr: true,
        parseReqBody: true,
        proxyReqOptDecorator: (proxyReqOpts, srcReq) => {
          proxyReqOpts.headers = proxyReqOpts.headers || {};
          // Forward cookies
          if (srcReq.headers.cookie) {
            proxyReqOpts.headers['cookie'] = srcReq.headers.cookie;
          }
          // Forward Authorization header (JWT token)
          if (srcReq.headers.authorization) {
            proxyReqOpts.headers['authorization'] =
              srcReq.headers.authorization;
          }
          return proxyReqOpts;
        },
      })
    );
  }

  public init() {
    this.apiRoutes();
  }
}

export default Routes;
