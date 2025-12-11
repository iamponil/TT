import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, tap, forkJoin, map, catchError, of } from 'rxjs';
import { environment } from 'environments/environment';
import {
    DashboardData,
    ArticleSummary,
    ArticleCountByDay,
    ArticleByAuthor,
    TopArticleByComments,
    ArticleStatusDistribution,
    UserSummary,
    SignupsByDay,
    UsersByRole,
    ActivePerHour,
    TopContributor,
} from './project.types';

@Injectable({ providedIn: 'root' })
export class ProjectService {
    private _data: BehaviorSubject<any> = new BehaviorSubject(null);
    
    // API Gateway base URL - all requests go through the gateway
    private readonly apiGatewayBase = environment.apiUrl;
    private readonly articleApiBase = `${this.apiGatewayBase}/api/v1/articles`;
    private readonly userApiBase = `${this.apiGatewayBase}/api/v1/users`;

    /**
     * Constructor
     */
    constructor(private _httpClient: HttpClient) {}

    // -----------------------------------------------------------------------------------------------------
    // @ Accessors
    // -----------------------------------------------------------------------------------------------------

    /**
     * Getter for data
     */
    get data$(): Observable<any> {
        return this._data.asObservable();
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Get data - fetches from mock API (fallback)
     */
    getData(): Observable<any> {
        return this._httpClient.get('api/dashboards/project').pipe(
            tap((response: any) => {
                this._data.next(response);
            })
        );
    }

    /**
     * Get real dashboard data from backend APIs
     */
    getDashboardData(): Observable<DashboardData>
    {
        console.log('📡 Starting dashboard data fetch from:', {
            apiGatewayBase: this.apiGatewayBase,
            articleApiBase: this.articleApiBase,
            userApiBase: this.userApiBase
        });

        // Helper to provide default on error
        const withDefault = <T>(obs: Observable<T>, defaultValue: T, apiName: string) => 
            obs.pipe(
                tap(data => console.log(`✅ ${apiName} Success:`, data)),
                catchError(err => {
                    console.error(`❌ ${apiName} Error:`, {
                        status: err.status,
                        statusText: err.statusText,
                        message: err.message,
                        url: err.url,
                        error: err.error
                    });
                    return of(defaultValue);
                })
            );

        return forkJoin({
            // Article Service APIs with defaults
            articleSummary: withDefault(
                this._httpClient.get<ArticleSummary>(`${this.articleApiBase}/summary`),
                { total: 0, published: 0, drafts: 0, averageReadTimeMinutes: 0 },
                'Article Summary'
            ),
            articleCountByDay: withDefault(
                this._httpClient.get<ArticleCountByDay>(`${this.articleApiBase}/count-by-day?days=30`),
                { days: [], counts: [] },
                'Article Count By Day'
            ),
            articleCountByAuthor: withDefault(
                this._httpClient.get<ArticleByAuthor[]>(`${this.articleApiBase}/count-by-author`),
                [],
                'Article Count By Author'
            ),
            articleTopByComments: withDefault(
                this._httpClient.get<TopArticleByComments[]>(`${this.articleApiBase}/top-by-comments?limit=10`),
                [],
                'Top Articles By Comments'
            ),
            articleStatusDistribution: withDefault(
                this._httpClient.get<ArticleStatusDistribution[]>(`${this.articleApiBase}/status-distribution`),
                [],
                'Article Status Distribution'
            ),
            
            // User Service APIs with defaults
            userSummary: withDefault(
                this._httpClient.get<UserSummary>(`${this.userApiBase}/summary`),
                { total: 0, activeLast30Days: 0, newLast30Days: 0 },
                'User Summary'
            ),
            userSignupsByDay: withDefault(
                this._httpClient.get<SignupsByDay>(`${this.userApiBase}/signups-by-day?days=30`),
                { days: [], counts: [] },
                'User Signups By Day'
            ),
            usersByRole: withDefault(
                this._httpClient.get<UsersByRole[]>(`${this.userApiBase}/by-role`),
                [],
                'Users By Role'
            ),
            userActivePerHour: withDefault(
                this._httpClient.get<ActivePerHour>(`${this.userApiBase}/active-per-hour?hours=24`),
                { hours: [], counts: [] },
                'User Active Per Hour'
            ),
            userTopContributors: withDefault(
                this._httpClient.get<TopContributor[]>(`${this.userApiBase}/top-contributors?limit=10`),
                [],
                'Top Contributors'
            ),
        }).pipe(
            map((response) => {
                console.log('Raw API Response:', response);
                return {
                    articles: {
                        summary: response.articleSummary,
                        countByDay: response.articleCountByDay,
                        countByAuthor: response.articleCountByAuthor,
                        topByComments: response.articleTopByComments,
                        statusDistribution: response.articleStatusDistribution,
                    },
                    users: {
                        summary: response.userSummary,
                        signupsByDay: response.userSignupsByDay,
                        byRole: response.usersByRole,
                        activePerHour: response.userActivePerHour,
                        topContributors: response.userTopContributors,
                    },
                };
            }),
            map((dashboardData: DashboardData) =>
            {
                console.log('Raw Dashboard Data (before transform):', dashboardData);
                const chartData = this._transformToChartData(dashboardData);
                console.log('Chart Data (after transform):', chartData);
                console.log('Chart Data - articleActivity.series:', chartData.articleActivity?.series);
                console.log('Chart Data - articleStatusDistribution.series:', chartData.articleStatusDistribution?.series);
                this._data.next(chartData);
                // Return the chart data so the component receives it
                return chartData;
            }),
        );
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Private methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Transform API data to chart-compatible format
     */
    private _transformToChartData(data: DashboardData): any
    {
        // Safe array access with defaults
        const articleCounts = data?.articles?.countByDay?.counts || [];
        const articleDays = data?.articles?.countByDay?.days || [];
        const userSignupCounts = data?.users?.signupsByDay?.counts || [];
        const statusDistribution = data?.articles?.statusDistribution || [];
        
        console.log('🔍 Transforming status distribution:', statusDistribution);
        console.log('🔍 Status distribution structure:', JSON.stringify(statusDistribution, null, 2));
        const topArticles = data?.articles?.topByComments || [];
        
        // Calculate article statistics for overview
        const thisWeekTotal = articleCounts.slice(-7).reduce((a, b) => a + b, 0);
        const lastWeekTotal = articleCounts.slice(-14, -7).reduce((a, b) => a + b, 0);
        
        // Calculate user signups for overview
        const thisWeekSignups = userSignupCounts.slice(-7).reduce((a, b) => a + b, 0);
        const lastWeekSignups = userSignupCounts.slice(-14, -7).reduce((a, b) => a + b, 0);

        // Ensure we have at least 7 days of data for the week view
        const thisWeekCounts = articleCounts.length >= 7 
            ? articleCounts.slice(-7) 
            : [...Array(7 - articleCounts.length).fill(0), ...articleCounts];
        
        const lastWeekCounts = articleCounts.length >= 14
            ? articleCounts.slice(-14, -7)
            : [...Array(7).fill(0)];

        const thisWeekLabels = articleDays.length >= 7
            ? articleDays.slice(-7)
            : [...Array(7 - articleDays.length).fill(''), ...articleDays];

        return {
            // Articles by day chart
            articleActivity: {
                labels: thisWeekLabels,
                series: {
                    'this-week': [
                        {
                            name: 'Articles Created',
                            type: 'line',
                            data: thisWeekCounts,
                        },
                        {
                            name: 'Daily Count',
                            type: 'column',
                            data: thisWeekCounts,
                        },
                    ],
                    'last-week': [
                        {
                            name: 'Articles Created',
                            type: 'line',
                            data: lastWeekCounts,
                        },
                        {
                            name: 'Daily Count',
                            type: 'column',
                            data: lastWeekCounts,
                        },
                    ],
                },
                overview: {
                    'this-week': {
                        'total-articles': thisWeekTotal,
                        'published': data?.articles?.summary?.published || 0,
                        'drafts': data?.articles?.summary?.drafts || 0,
                        'new-users': thisWeekSignups,
                    },
                    'last-week': {
                        'total-articles': lastWeekTotal,
                        'published': Math.floor((data?.articles?.summary?.published || 0) * 0.9),
                        'drafts': Math.floor((data?.articles?.summary?.drafts || 0) * 0.9),
                        'new-users': lastWeekSignups,
                    },
                },
            },
            // Article status distribution (polar area chart)
            articleStatusDistribution: {
                labels: statusDistribution.map(s => {
                    console.log('Mapping label:', s.status, 'count:', s.count);
                    return s.status;
                }),
                series: {
                    'this-week': statusDistribution.map(s => {
                        const count = parseInt(s.count?.toString() || '0') || 0;
                        console.log('Mapping this-week count for', s.status, ':', s.count, '-> parsed:', count);
                        return count;
                    }),
                    'last-week': statusDistribution.map(s => {
                        const count = Math.floor((parseInt(s.count?.toString() || '0') || 0) * 0.9);
                        console.log('Mapping last-week count for', s.status, ':', s.count, '-> calculated:', count);
                        return count;
                    }),
                },
                overview: {
                    'this-week': {
                        'drafts': data?.articles?.summary?.drafts || 0,
                        'published': data?.articles?.summary?.published || 0,
                    },
                    'last-week': {
                        'drafts': Math.floor((data?.articles?.summary?.drafts || 0) * 0.9),
                        'published': Math.floor((data?.articles?.summary?.published || 0) * 0.9),
                    },
                },
            },
            // Top articles by engagement
            topArticles: {
                top5: topArticles.slice(0, 5).map((article) => ({
                    id: article.articleId,
                    title: article.title || 'Untitled',
                    comments: article.comments || 0,
                    views: article.views || 0,
                    engagement: `${article.comments || 0} comments · ${article.views || 0} views`,
                })),
                next5: topArticles.slice(5, 10).map((article) => ({
                    id: article.articleId,
                    title: article.title || 'Untitled',
                    comments: article.comments || 0,
                    views: article.views || 0,
                    engagement: `${article.comments || 0} comments · ${article.views || 0} views`,
                })),
            },
            // Authors and contributors
            contributors: {
                topAuthors: (data?.articles?.countByAuthor || []).slice(0, 10),
                topContributors: data?.users?.topContributors || [],
            },
            // User activity
            userActivity: {
                signupsByDay: data?.users?.signupsByDay || { days: [], counts: [] },
                byRole: data?.users?.byRole || [],
                activePerHour: data?.users?.activePerHour || { hours: [], counts: [] },
            },
            // Raw data for custom components
            rawData: data,
        };
    }
}

