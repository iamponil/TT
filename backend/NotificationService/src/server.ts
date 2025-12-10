import express from 'express';
import type { Application } from 'express';
import http from 'http';
import Routes from './routes';
import cors from 'cors';

import { SocketService } from './services/SocketService';

class NotificationService {
  private app: Application;
  private httpServer: http.Server;
  private socketService: SocketService;

  constructor() {
    this.app = express();
    this.httpServer = http.createServer(this.app);
    
    // Initialize Socket Service
    this.socketService = new SocketService(this.httpServer);

    this.configureMiddleware();
  }

  private configureMiddleware() {
    this.app.use(cors());
    this.app.use(express.json());
  }

  private configureRoutes() {
    new Routes(this.app).init();
  }

  public start() {
    this.configureRoutes();

    const PORT = process.env.NODE_SERVER_POST || '2000';

    this.httpServer.listen(PORT, () => {
      console.log(`Notification Service running on http://localhost:${PORT}`);
    });
  }
}

export default new NotificationService();
