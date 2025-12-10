import { Component, OnInit, OnDestroy, ViewEncapsulation } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ArticleService, Article } from 'app/core/article/article.service';
import { UserService } from 'app/core/user/user.service';
import { SocketService } from 'app/core/socket/socket.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
    selector: 'article-detail',
    templateUrl: './article-detail.component.html',
    styleUrls: ['./article-detail.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class ArticleDetailComponent implements OnInit, OnDestroy
{
    article: Article;
    comments: any[] = [];
    loading = true;
    loadingComments = false;
    currentUser: any;
    commentForm: FormGroup;
    private _unsubscribeAll: Subject<any> = new Subject<any>();

    constructor(
        private _route: ActivatedRoute,
        private _router: Router,
        private _articleService: ArticleService,
        private _userService: UserService,
        private _socketService: SocketService,
        private _formBuilder: FormBuilder
    )
    {
    }

    ngOnInit(): void
    {
        // Get current user
        this._userService.user$.pipe(takeUntil(this._unsubscribeAll)).subscribe((user) => {
            this.currentUser = user;
            // Join user room for notifications
            if (user && user.id) {
                this._socketService.joinUser(user.id);
            }
        });

        // Initialize comment form
        this.commentForm = this._formBuilder.group({
            content: ['', Validators.required]
        });

        // Get article ID from route
        const articleId = this._route.snapshot.paramMap.get('id');
        if (articleId) {
            this.loadArticle(articleId);
            this.loadComments(articleId);

            // Connect to Socket.IO and join article room
            this._socketService.connect();
            this._socketService.joinArticle(articleId);

            // Listen for new comments
            this._socketService.commentAdded$
                .pipe(takeUntil(this._unsubscribeAll))
                .subscribe((comment) => {
                    console.log('New comment received:', comment);
                    this.comments.unshift(comment);
                });

            // Listen for notifications
            this._socketService.notification$
                .pipe(takeUntil(this._unsubscribeAll))
                .subscribe((notification) => {
                    console.log('Notification received:', notification);
                    // You can show a toast/snackbar here
                    alert(`${notification.title}: ${notification.message}`);
                });
        }
    }

    ngOnDestroy(): void
    {
        this._unsubscribeAll.next(null);
        this._unsubscribeAll.complete();
    }

    loadArticle(id: string): void
    {
        this.loading = true;
        this._articleService.getArticle(id).subscribe({
            next: (response: any) => {
                this.article = response.article || response;
                this.loading = false;
            },
            error: (error) => {
                console.error('Error loading article:', error);
                this.loading = false;
                this._router.navigate(['/articles']);
            }
        });
    }

    loadComments(articleId: string): void
    {
        this.loadingComments = true;
        this._articleService.getComments(articleId).subscribe({
            next: (comments: any[]) => {
                this.comments = comments || [];
                this.loadingComments = false;
            },
            error: (error) => {
                console.error('Error loading comments:', error);
                this.loadingComments = false;
            }
        });
    }

    submitComment(): void
    {
        if (this.commentForm.invalid || !this.article) {
            return;
        }

        const commentData = {
            content: this.commentForm.value.content
        };

        this.commentForm.disable();

        this._articleService.createComment(this.article._id, commentData).subscribe({
            next: (response) => {
                this.commentForm.reset();
                this.commentForm.enable();
                // Comment will be added via Socket.IO event automatically
            },
            error: (error) => {
                console.error('Error posting comment:', error);
                alert('Failed to post comment. Please try again.');
                this.commentForm.enable();
            }
        });
    }

    goBack(): void
    {
        this._router.navigate(['/articles']);
    }
}
