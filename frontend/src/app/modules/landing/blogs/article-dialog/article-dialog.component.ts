import { Component, Inject, OnInit } from '@angular/core';
import {
    FormBuilder,
    FormGroup,
    ReactiveFormsModule,
    Validators,
} from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ArticleService } from '../blogs.service';
import { HttpClient } from '@angular/common/http';
import { environment } from 'environments/environment';

@Component({
    selector: 'app-article-dialog',
    standalone: true,
    templateUrl: './article-dialog.component.html',
    imports: [
        CommonModule,
        ReactiveFormsModule,
        MatFormFieldModule,
        MatInputModule,
        MatButtonModule,
        MatIconModule,
        MatProgressSpinnerModule,
    ],
})
export class ArticleDialogComponent implements OnInit {
    articleForm: FormGroup;
    loading = false;
    mode: 'create' | 'edit' = 'create';

    selectedImageFile: File | null = null;
    uploadedImageUrl: string | null = null;

    constructor(
        @Inject(MAT_DIALOG_DATA) public data: any,
        private _fb: FormBuilder,
        private _dialogRef: MatDialogRef<ArticleDialogComponent>,
        private _articleService: ArticleService,
        private _http: HttpClient
    ) {}

    ngOnInit(): void {
        this.mode = this.data?.mode || 'create';

        this.articleForm = this._fb.group({
            title: [this.data?.article?.title || '', Validators.required],
            content: [this.data?.article?.content || '', Validators.required],
            image: [this.data?.article?.image || ''], // final URL or filename
            tags: [this.data?.article?.tags?.join(', ') || ''],
        });
    }

    /** When file input changes */
    onFileSelected(event: any) {
        const file = event.target.files[0];
        if (file) this.selectedImageFile = file;
    }

    /** Upload image first, then save article */
    async save() {
        if (this.articleForm.invalid) return;

        this.loading = true;

        try {
            let imageFinal = this.articleForm.value.image;

            // ---- 1) Upload image if user selected one ----
            if (this.selectedImageFile) {
                const formData = new FormData();
                formData.append('image', this.selectedImageFile);

                const uploadRes: any = await this._http
                    .post(environment.apiUrl + '/articles/upload', formData)
                    .toPromise();

                imageFinal = uploadRes.filename; // returned by backend
            }

            // ---- 2) Prepare article data ----
            const payload = {
                ...this.articleForm.value,
                image: imageFinal,
                tags: this.articleForm.value.tags
                    ? this.articleForm.value.tags
                          .split(',')
                          .map((t) => t.trim())
                    : [],
            };

            // ---- 3) Create or update ----
            let result;
            if (this.mode === 'create') {
                result = await this._articleService
                    .createArticle(payload)
                    .toPromise();
            } else {
                result = await this._articleService
                    .updateArticle(this.data.article.id, payload)
                    .toPromise();
            }

            this._dialogRef.close(result);
        } catch (err) {
            console.error('Saving failed:', err);
        }

        this.loading = false;
    }

    cancel() {
        this._dialogRef.close();
    }
}
