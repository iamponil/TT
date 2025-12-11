import { Application, Request, Response } from 'express';

class NotificationRoutes {
  constructor(private app: Application) {}

  private routes() {
    this.app.get('/', (req: Request, res: Response) => {
      res.send({ message: 'Notification Service is running' });
    });

    // Future:
    // this.app.post('/notify', ...)
    // this.app.get('/notifications/:userId', ...)
  }

  public init() {
    this.routes();
  }
}

export default NotificationRoutes;
