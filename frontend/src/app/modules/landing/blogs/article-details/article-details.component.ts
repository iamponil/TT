import {
    Component,
    Inject,
    OnInit,
    OnDestroy,
    inject,
    ViewChild,
    ElementRef,
    AfterViewChecked,
} from '@angular/core';
import {
    MAT_DIALOG_DATA,
    MatDialogModule,
    MatDialogRef,
} from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { ArticleService } from '../blogs.service';
import { SocketService } from '../socket.service';

@Component({
    selector: 'article-details',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        MatDialogModule,
        MatButtonModule,
        MatIconModule,
        MatInputModule,
        MatFormFieldModule,
        MatChipsModule,
        MatDividerModule,
    ],
    templateUrl: './article-details.component.html',
    styles: [
        `
            :host {
                display: flex;
                flex-direction: column;
                height: 100%;
            }
            .custom-scroll::-webkit-scrollbar {
                width: 6px;
            }
            .custom-scroll::-webkit-scrollbar-thumb {
                background-color: #cbd5e1;
                border-radius: 4px;
            }
        `,
    ],
})
export class ArticleDetailsComponent
    implements OnInit, OnDestroy, AfterViewChecked
{
    private articleService = inject(ArticleService);
    private socketService = inject(SocketService);
    public dialogRef = inject(MatDialogRef<ArticleDetailsComponent>);

    // Access the scrollable container to auto-scroll
    @ViewChild('scrollContainer') private scrollContainer!: ElementRef;

    article: any;
    comments: any[] = [];
    newComment = '';

    // Flag to trigger scroll after view update
    private shouldScrollToBottom = false;

    constructor(@Inject(MAT_DIALOG_DATA) public data: { articleId: string }) {}

    ngOnInit(): void {
        this.socketService.connect();
        this.socketService.joinArticle(this.data.articleId);

        // 1. Fetch Article Data
        this.articleService
            .getArticle(this.data.articleId)
            .subscribe((res: any) => {
                this.article = res.article || res.data;
            });

        // 2. Fetch Existing Comments
        this.articleService
            .getComments(this.data.articleId)
            .subscribe((res: any) => {
                this.comments = res.data || [];
                this.scrollToBottom(); // Scroll to bottom on load
            });

        // 3. THE REAL-TIME MAGIC
        // This listener runs for EVERYONE (You and Others)
        this.socketService.commentAdded$.subscribe((newComment) => {
            if (newComment && newComment.article === this.data.articleId) {
                // Safety check: Prevent duplicates if backend sends multiple times
                const exists = this.comments.some(
                    (c) => c._id === newComment._id
                );
                if (!exists) {
                    this.comments.push(newComment);
                    this.scrollToBottom(); // Auto-scroll to show the new comment
                }
            }
        });
    }

    ngAfterViewChecked() {
        if (this.shouldScrollToBottom) {
            this.scrollToBottomHelper();
            this.shouldScrollToBottom = false;
        }
    }

    ngOnDestroy(): void {
        this.socketService.leaveArticle(this.data.articleId);
    }

    sendComment() {
        if (!this.newComment.trim()) return;

        const content = this.newComment;

        // 1. Send to Backend
        this.articleService
            .createComment(this.data.articleId, { content })
            .subscribe({
                next: () => {
                    // 2. Clear Input immediately
                    this.newComment = '';

                    // 3. DO NOT PUSH MANUALLY.
                    // We wait for the socket event to fire (Step 3 in ngOnInit)
                    // This proves the socket is working!
                },
                error: (err) => console.error('Failed to send', err),
            });
    }

    // --- Helper Methods ---

    scrollToBottom(): void {
        this.shouldScrollToBottom = true;
    }

    private scrollToBottomHelper(): void {
        try {
            if (this.scrollContainer) {
                this.scrollContainer.nativeElement.scrollTop =
                    this.scrollContainer.nativeElement.scrollHeight;
            }
        } catch (err) {}
    }

    getImageUrl(imagePath: string): string {
        if (!imagePath) return '';
        if (imagePath.startsWith('http')) return imagePath;
        return `http://localhost:8000/articles/uploads/${imagePath}`;
    }

    close() {
        this.dialogRef.close();
    }
}
