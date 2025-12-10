import { Server as SocketIOServer } from 'socket.io';
import { createClient } from 'redis';
import http from 'http';

export class SocketService {
  private io: SocketIOServer;
  private redisSubscriber: any;

  constructor(httpServer: http.Server) {
    const origin = process.env.FRONTEND_ORIGIN || 'http://localhost:4200';
    
    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: origin,
        methods: ['GET', 'POST'],
        credentials: true
      },
      path: '/socket.io'
    });

    this.initRedis();
    this.initSocket();
  }

  private async initRedis() {
    const host = process.env.REDIS_HOST || '127.0.0.1';
    const port = parseInt(process.env.REDIS_PORT || '6379', 10);
    const password = process.env.REDIS_PASSWORD || undefined;

    this.redisSubscriber = createClient({
      socket: { host, port },
      password: password,
    });

    await this.redisSubscriber.connect();
    console.log('NotificationService: Redis Subscriber Connected');

    // Subscribe to channel
    await this.redisSubscriber.subscribe('notifications', (message: string) => {
      try {
        const event = JSON.parse(message);
        this.handleEvent(event);
      } catch (err) {
        console.error('Error parsing redis message', err);
      }
    });
  }

  private handleEvent(event: any) {
    console.log('Received Event:', event.type);
    
    if (event.type === 'new_comment') {
      const { comment, articleTitle, articleAuthorId } = event.payload;
      
      // 1. Notify everyone viewing the article (Real-time updates)
      // Client should join room: "article:{articleId}"
      this.io.to(`article:${comment.article}`).emit('comment_added', comment);

      // 2. Notify the Author (if they are online)
      // Client should join room: "user:{userId}"
      // Don't notify if author commented on own post (optional check)
      // Safety check: comment.author might be an ID string or an object depending on population
      const commentAuthorId = typeof comment.author === 'object' && comment.author ? comment.author._id : comment.author;

      if (commentAuthorId && commentAuthorId.toString() !== articleAuthorId) {
        this.io.to(`user:${articleAuthorId}`).emit('notification', {
          title: 'New Comment',
          message: `Someone commented on your article "${articleTitle}"`,
          data: comment
        });
        
        // Bonus: Trigger Push Notification here
        // In a real app, we'd look up the user's PushSubscription from DB
        // const subscription = await UserSubscriptionModel.findOne({ userId: articleAuthorId });
        // if (subscription) sendPushNotification(subscription, { title: 'New Comment', body: '...' });
      }
    }
  }

  private initSocket() {
    this.io.on('connection', (socket) => {
      console.log('Socket Connected:', socket.id);

      // Join Article Room (for real-time comments)
      socket.on('join_article', (articleId: string) => {
        socket.join(`article:${articleId}`);
        console.log(`Socket ${socket.id} joined article:${articleId}`);
      });

      // Join User Room (for personal notifications)
      socket.on('join_user', (userId: string) => {
        socket.join(`user:${userId}`);
        console.log(`Socket ${socket.id} joined user:${userId}`);
      });

      socket.on('disconnect', () => {
        console.log('Socket Disconnected:', socket.id);
      });
    });
  }
}
