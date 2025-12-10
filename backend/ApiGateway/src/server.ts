import express, { Application } from 'express';
import http from 'http';
import cors from 'cors';
import Routes from './routes';

class ServerClass {
  private app: Application;
  private httpServer: http.Server;

  constructor() {
    this.app = express();
    this.httpServer = http.createServer(this.app);

    this.configureMiddleware();
  }

  private configureMiddleware() {
    const origin = process.env.FRONTEND_ORIGIN || 'http://localhost:4200';
    this.app.use(cors({ origin, credentials: true }));

    // Parse JSON bodies for all requests
    this.app.use(express.json());
  }

  private configureRoutes() {
    new Routes(this.app).init();
  }

  public start() {
    this.configureRoutes();
    const PORT = process.env.API_GATEWAY_PORT || 8000;
    this.httpServer.listen(PORT, () =>
      console.log(`API Gateway running on http://localhost:${PORT}`)
    );
  }
}

export default new ServerClass();
