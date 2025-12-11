import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'environments/environment';

export interface Article {
    _id: string;
    title: string;
    content: string;
    image?: string;
    tags?: string[];
    author: string;
    createdAt: string;
    updatedAt: string;
}

@Injectable({
    providedIn: 'root',
})
export class ArticleService {
    /**
     * Constructor
     */
    constructor(private _httpClient: HttpClient) {}

    /**
     * Get articles
     *
     * @param params
     */
    getArticles(params: any = {}): Observable<any> {
        return this._httpClient.get(environment.apiUrl + '/articles', {
            params,
            withCredentials: true,
        });
    }

    /**
     * Get article by ID
     */
    getArticle(id: string): Observable<any> {
        return this._httpClient.get(`${environment.apiUrl}/articles/${id}`, {
            withCredentials: true,
        });
    }

    /**
     * Create article
     */
    createArticle(article: Partial<Article>): Observable<any> {
        return this._httpClient.post(
            environment.apiUrl + '/articles',
            article,
            { withCredentials: true }
        );
    }

    /**
     * Update article
     */
    updateArticle(id: string, article: Partial<Article>): Observable<any> {
        return this._httpClient.patch(
            `${environment.apiUrl}/articles/${id}`,
            article,
            { withCredentials: true }
        );
    }

    /**
     * Delete article
     */
    deleteArticle(id: string): Observable<any> {
        return this._httpClient.delete(`${environment.apiUrl}/articles/${id}`, {
            withCredentials: true,
        });
    }

    /**
     * Get comments for article
     */
    getComments(articleId: string): Observable<any> {
        return this._httpClient.get(
            `${environment.apiUrl}/articles/${articleId}/comments`
        );
    }

    /**
     * Create comment on article
     */
    createComment(
        articleId: string,
        comment: { content: string; parentComment?: string }
    ): Observable<any> {
        return this._httpClient.post(
            `${environment.apiUrl}/articles/${articleId}/comments`,
            comment,
            { withCredentials: true }
        );
    }
}
