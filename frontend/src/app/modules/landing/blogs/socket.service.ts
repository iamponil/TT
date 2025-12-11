import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { Observable, Subject } from 'rxjs';
import { environment } from 'environments/environment';

@Injectable({
    providedIn: 'root',
})
export class SocketService {
    leaveArticle(articleId: string): void {
        if (this.socket) {
            this.socket.emit('leaveArticle', articleId);
            console.log(`[Socket] Left article: ${articleId}`);
        }
    }
    private socket: Socket;
    private connected = false;

    // Observables for real-time events
    private _commentAdded$ = new Subject<any>();
    private _notification$ = new Subject<any>();

    constructor() {}

    /**
     * Connect to Socket.IO server
     */
    connect(): void {
        if (this.connected) {
            return;
        }

        // Connect to NotificationService on port 2000
        const socketUrl = environment.socketUrl || 'http://localhost:2000';

        this.socket = io(socketUrl, {
            path: '/socket.io',
            transports: ['websocket', 'polling'],
            withCredentials: true,
        });

        this.socket.on('connect', () => {
            console.log('[Socket] Connected:', this.socket.id);
            this.connected = true;
        });

        this.socket.on('disconnect', () => {
            console.log('[Socket] Disconnected');
            this.connected = false;
        });

        // Listen for comment_added events
        this.socket.on('comment_added', (comment: any) => {
            console.log('[Socket] Comment added:', comment);
            this._commentAdded$.next(comment);
        });

        // Listen for notification events
        this.socket.on('notification', (notification: any) => {
            console.log('[Socket] Notification:', notification);
            this._notification$.next(notification);
        });
    }

    /**
     * Disconnect from Socket.IO server
     */
    disconnect(): void {
        if (this.socket) {
            this.socket.disconnect();
            this.connected = false;
        }
    }

    /**
     * Join article room for real-time comments
     */
    joinArticle(articleId: string): void {
        if (this.socket && this.connected) {
            this.socket.emit('join_article', articleId);
            console.log('[Socket] Joined article:', articleId);
        }
    }

    /**
     * Join user room for personal notifications
     */
    joinUser(userId: string): void {
        if (this.socket && this.connected) {
            this.socket.emit('join_user', userId);
            console.log('[Socket] Joined user:', userId);
        }
    }

    /**
     * Observable for new comments
     */
    get commentAdded$(): Observable<any> {
        return this._commentAdded$.asObservable();
    }

    /**
     * Observable for notifications
     */
    get notification$(): Observable<any> {
        return this._notification$.asObservable();
    }
}
