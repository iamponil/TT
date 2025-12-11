import { Routes } from '@angular/router';

export const blogRoutes: Routes = [
    {
        path: '',
        loadComponent: () =>
            import('./blogs.component').then((c) => c.ArticleListComponent),
    },
    {
        path: ':id',
        loadComponent: () =>
            import('./article-details/article-details.component').then(
                (c) => c.ArticleDetailsComponent
            ),
    },
];
