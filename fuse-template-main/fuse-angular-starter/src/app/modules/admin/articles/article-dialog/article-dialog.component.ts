import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ArticleService, Article } from 'app/core/article/article.service';

@Component({
    selector: 'article-dialog',
    templateUrl: './article-dialog.component.html',
    styleUrls: ['./article-dialog.component.scss']
})
export class ArticleDialogComponent implements OnInit
{
    articleForm: FormGroup;
    mode: 'create' | 'edit';
    loading = false;

    constructor(
        private _formBuilder: FormBuilder,
        private _articleService: ArticleService,
        public dialogRef: MatDialogRef<ArticleDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public data: { article?: Article; mode: 'create' | 'edit' }
    )
    {
        this.mode = data.mode;
    }

    ngOnInit(): void
    {
        // Initialize form
        this.articleForm = this._formBuilder.group({
            title: [this.data.article?.title || '', Validators.required],
            content: [this.data.article?.content || '', Validators.required],
            image: [this.data.article?.image || ''],
            tags: [this.data.article?.tags?.join(', ') || '']
        });
    }

    save(): void
    {
        if (this.articleForm.invalid) {
            return;
        }

        this.loading = true;
        const formValue = this.articleForm.value;
        
        // Convert tags string to array
        const tags = formValue.tags
            ? formValue.tags.split(',').map((tag: string) => tag.trim()).filter((tag: string) => tag)
            : [];

        const articleData = {
            title: formValue.title,
            content: formValue.content,
            image: formValue.image || undefined,
            tags
        };

        const request = this.mode === 'create'
            ? this._articleService.createArticle(articleData)
            : this._articleService.updateArticle(this.data.article._id, articleData);

        request.subscribe({
            next: () => {
                this.loading = false;
                this.dialogRef.close(true);
            },
            error: (error) => {
                console.error('Error saving article:', error);
                this.loading = false;
                alert('Failed to save article. Please try again.');
            }
        });
    }

    cancel(): void
    {
        this.dialogRef.close(false);
    }
}
