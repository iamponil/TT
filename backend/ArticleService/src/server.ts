import express, { Application } from 'express';
import http from 'http';
import cors from 'cors';
import helmet from 'helmet';
import mongoose from 'mongoose';
import Routes from './routes';
import path from 'path';
import { createRedisClient } from './services/RedisService';

class ArticleServiceServer {
  public app: Application;
  private httpServer: http.Server;

  constructor() {
    this.app = express();
    this.httpServer = http.createServer(this.app);
    this.configureMiddleware();
    this.configureRoutes();
  }

  private configureMiddleware() {
    const origin = process.env.FRONTEND_ORIGIN || 'http://localhost:4200';
    this.app.use(
      helmet({
        crossOriginResourcePolicy: { policy: 'cross-origin' },
      })
    );
    this.app.use(express.json());
    this.app.use(cors({ origin, credentials: true }));
    this.app.use(
      '/uploads',
      express.static(path.join(__dirname, '../public/uploads'))
    );
  }

  private configureRoutes() {
    new Routes(this.app).init();
  }

  public async start() {
    // Connect Mongo
    const mongoUri =
      process.env.MONGO_URI || 'mongodb://localhost:27017/article-service';
    try {
      await mongoose.connect(mongoUri);
      console.log('Connected to MongoDB');
    } catch (err) {
      console.error('MongoDB connection error:', err);
      process.exit(1);
    }

    // Connect Redis
    try {
      await createRedisClient();
      console.log('Connected to Redis');
    } catch (err) {
      console.error('Redis connection error:', err);
      // Decide if we want to crash or continue without cache.
      // For now, let's continue but cache specific calls will fail gracefully (caught in Service)
    }

    const PORT = process.env.ARTICLE_SERVICE_PORT || 7000;
    this.httpServer.listen(PORT, () => {
      console.log(`Article Service running on http://localhost:${PORT}`);
    });
  }
}

export default new ArticleServiceServer();
