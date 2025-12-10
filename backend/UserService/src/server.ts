import express, { Application } from 'express';
import http from 'http';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import mongoose from 'mongoose';
import routes from './routes';
import { createRedisClient } from './services/RedisService';

class UserService {
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
    this.app.use(helmet());
    this.app.use(express.json());
    this.app.use(cookieParser());
    this.app.use(
      cors({
        origin,
        credentials: true,
      })
    );
  }

  private configureRoutes() {
    this.app.use('/', routes);
  }

  public async start() {
    // Connect Mongo
    const mongoUri = process.env.MONGO_URI!;
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    // Connect Redis
    await createRedisClient();
    console.log('Connected to Redis');

    const PORT = process.env.USER_SERVICE_PORT || 4000;
    this.httpServer.listen(PORT, () => {
      console.log(`User Service running on http://localhost:${PORT}`);
    });
  }
}

export default new UserService();
