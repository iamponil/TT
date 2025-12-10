import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { ArticleService, Article } from 'app/core/article/article.service';
import { UserService } from 'app/core/user/user.service';
import { ArticleDialogComponent } from './article-dialog/article-dialog.component';

@Component({
    selector: 'articles',
    templateUrl: './articles.component.html',
    styleUrls: ['./articles.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class ArticlesComponent implements OnInit
{
    articles: Article[] = [];
    filteredArticles: Article[] = [];
    loading = true;
    searchQuery = '';
    selectedTags: string[] = [];
    allTags: string[] = [];
    currentUser: any;

    constructor(
        private _articleService: ArticleService,
        private _userService: UserService,
        private _dialog: MatDialog,
        private _router: Router
    )
    {
    }

    ngOnInit(): void
    {
        // Get current user
        this._userService.user$.subscribe((user) => {
            this.currentUser = user;
        });

        this.loadArticles();
    }

    loadArticles(): void
    {
        this.loading = true;
        this._articleService.getArticles({ limit: 100 }).subscribe({
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
            }
        });
    }

    extractTags(): void
    {
        const tagsSet = new Set<string>();
        this.articles.forEach((article) => {
            if (article.tags && Array.isArray(article.tags)) {
                article.tags.forEach(tag => tagsSet.add(tag));
            }
        });
        this.allTags = Array.from(tagsSet);
    }

    filterArticles(): void
    {
        this.filteredArticles = this.articles.filter((article) => {
            const matchesSearch = !this.searchQuery ||
                article.title.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
                article.content.toLowerCase().includes(this.searchQuery.toLowerCase());

            const matchesTags = this.selectedTags.length === 0 ||
                (article.tags && this.selectedTags.some(tag => article.tags.includes(tag)));

            return matchesSearch && matchesTags;
        });
    }

    canEdit(article: Article): boolean
    {
        if (!this.currentUser) {return false;}

        // Admin and Éditeur can edit all articles
        if (this.currentUser.role === 'admin' || this.currentUser.role === 'editor') {
            return true;
        }

        // Rédacteur can only edit their own articles
        if (this.currentUser.role === 'writer') {
            return article.author === this.currentUser.id;
        }

        return false;
    }

    canDelete(article: Article): boolean
    {
        // Only admin can delete
        return this.currentUser && this.currentUser.role === 'admin';
    }

    openEditDialog(article: Article): void
    {
        const dialogRef = this._dialog.open(ArticleDialogComponent, {
            width: '800px',
            data: { article, mode: 'edit' }
        });

        dialogRef.afterClosed().subscribe((result) => {
            if (result) {
                this.loadArticles();
            }
        });
    }

    openCreateDialog(): void
    {
        const dialogRef = this._dialog.open(ArticleDialogComponent, {
            width: '800px',
            data: { mode: 'create' }
        });

        dialogRef.afterClosed().subscribe((result) => {
            if (result) {
                this.loadArticles();
            }
        });
    }

    deleteArticle(article: Article): void
    {
        if (!confirm(`Are you sure you want to delete "${article.title}"?`)) {
            return;
        }

        this._articleService.deleteArticle(article._id).subscribe({
            next: () => {
                this.loadArticles();
            },
            error: (error) => {
                console.error('Error deleting article:', error);
                alert('Failed to delete article. Please try again.');
            }
        });
    }

    getExcerpt(content: string, maxLength: number = 150): string
    {
        if (!content) {return '';}
        return content.length > maxLength
            ? content.substring(0, maxLength) + '...'
            : content;
    }
}
