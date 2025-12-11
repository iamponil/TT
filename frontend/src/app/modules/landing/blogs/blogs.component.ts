import { Component, OnInit, inject } from '@angular/core';
import { AsyncPipe, NgForOf, NgIf, DatePipe } from '@angular/common';
import { MatDialog } from '@angular/material/dialog';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms'; // <--- 1. Import this
import { MatChipsModule } from '@angular/material/chips';
import { MatInputModule } from '@angular/material/input';
import { UserService } from 'app/core/user/user.service';

import {
    ArticleService,
    Article,
} from 'app/modules/landing/blogs/blogs.service';
import { ArticleDetailsComponent } from './article-details/article-details.component';
import { ArticleDialogComponent } from './article-dialog/article-dialog.component';

@Component({
    selector: 'blogs',
    standalone: true,
    templateUrl: './blogs.component.html',
    imports: [
        NgIf,
        NgForOf,
        AsyncPipe,
        DatePipe, // <--- 2. Add this here
        MatCardModule,
        FormsModule,
        MatFormFieldModule,
        MatInputModule,
        MatSelectModule,
        MatIconModule,
        MatChipsModule,
    ],
})
export class ArticleListComponent implements OnInit {
    private articleService = inject(ArticleService);
    private dialog = inject(MatDialog);
    private userService = inject(UserService);

    articles: Article[] = [];
    filteredArticles: Article[] = [];

    searchQuery = '';
    selectedTags: string[] = [];
    allTags: string[] = [];
    currentUser: any;
    loading = true;

    ngOnInit(): void {
        this.userService.get().subscribe({
            next: (user) => {
                this.currentUser = user;
                console.log('Current user:', user);
            },
            error: (err) => {
                console.error('Failed to load user', err);
            },
        });
        this.articleService.getArticles().subscribe((res) => {
            this.articles = res.docs;
            this.filteredArticles = [...this.articles];

            this.allTags = [
                ...new Set(this.articles.flatMap((a) => a.tags || [])),
            ];

            this.loading = false;
        });
    }

    filterArticles(): void {
        this.filteredArticles = this.articles.filter((article) => {
            const matchesSearch =
                !this.searchQuery ||
                article.title
                    .toLowerCase()
                    .includes(this.searchQuery.toLowerCase()) ||
                article.content
                    .toLowerCase()
                    .includes(this.searchQuery.toLowerCase());

            const matchesTags =
                this.selectedTags.length === 0 ||
                (article.tags &&
                    this.selectedTags.some((tag) =>
                        article.tags.includes(tag)
                    ));

            return matchesSearch && matchesTags;
        });
    }

    viewArticle(article: Article) {
        this.dialog.open(ArticleDetailsComponent, {
            width: '90vw', // 90% of screen width
            maxWidth: '1000px', // But don't get too crazy on huge screens
            height: '90vh', // 90% of screen height
            data: { articleId: article._id },
            autoFocus: false,
            panelClass: 'custom-dialog-container', // Optional for extra CSS
        });
    }

    getExcerpt(content: string, maxLength: number = 150): string {
        if (!content) {
            return '';
        }
        return content.length > maxLength
            ? content.substring(0, maxLength) + '...'
            : content;
    }
    openCreateDialog(): void {
        const dialogRef = this.dialog.open(ArticleDialogComponent, {
            width: '800px',
            data: { mode: 'create' },
        });

        dialogRef.afterClosed().subscribe((result) => {
            if (result) {
                this.loadArticles();
            }
        });
    }
    loadArticles(): void {
        this.loading = true;
        this.articleService.getArticles({ limit: 100 }).subscribe({
            next: (response: any) => {
                // Backend returns 'docs' for paginated results
                this.articles = response.docs || response.articles || [];
                this.filteredArticles = [...this.articles];
                this.extractTags();
                this.loading = false;
            },
            error: (error) => {
                console.error('Error loading articles:', error);
                this.loading = false;
            },
        });
    }
    canEdit(article: Article): boolean {
        // 1. If not logged in, nobody can edit
        if (!this.currentUser) return false;
        const userRole = this.currentUser.role; // e.g., "Rédacteur" or "admin"

        // 2. Admins can edit everything
        if (userRole === 'admin' || userRole === 'Admin') {
            return true;
        }

        // 3. If article has NO author (is null), only Admin can edit (already returned above)
        if (!article.author) {
            return false;
        }
        console.log(userRole === 'writer' || userRole == 'Rédacteur', userRole);
        // 4. Rédacteur (Writer) Logic
        if (userRole === 'writer' || userRole == 'Rédacteur') {
            console.log('first');
            // Get the User's ID safely
            const currentUserId = this.currentUser._id || this.currentUser.id;

            // Get the Article's Author ID safely
            let articleAuthorId = article.author;
            console.log(currentUserId, articleAuthorId);
            // If author is an object (and not null), extract the _id
            if (typeof article.author === 'object' && article.author !== null) {
                articleAuthorId =
                    (article.author as any)._id || (article.author as any).id;
            }

            // 5. Compare as Strings (to avoid ObjectId vs String issues)
            return String(articleAuthorId) === String(currentUserId);
        }

        return false;
    }
    canDelete(article: Article): boolean {
        if (!this.currentUser) return false;

        // Allow Admin OR the author (if you want authors to delete their own)
        const role = this.currentUser.role;
        return role === 'admin' || role === 'Admin';
    }

    deleteArticle(article: Article): void {
        if (!confirm(`Are you sure you want to delete "${article.title}"?`)) {
            return;
        }

        this.articleService.deleteArticle(article._id).subscribe({
            next: () => {
                this.loadArticles();
            },
            error: (error) => {
                console.error('Error deleting article:', error);
                alert('Failed to delete article. Please try again.');
            },
        });
    }
    openEditDialog(article: Article): void {
        const dialogRef = this.dialog.open(ArticleDialogComponent, {
            width: '800px',
            data: { article, mode: 'edit' },
        });

        dialogRef.afterClosed().subscribe((result) => {
            if (result) {
                this.loadArticles();
            }
        });
    }
    extractTags(): void {
        const tagsSet = new Set<string>();
        this.articles.forEach((article) => {
            if (article.tags && Array.isArray(article.tags)) {
                article.tags.forEach((tag) => tagsSet.add(tag));
            }
        });
        this.allTags = Array.from(tagsSet);
    }
}
