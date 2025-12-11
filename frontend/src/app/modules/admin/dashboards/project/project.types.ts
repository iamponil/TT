// Article Service Interfaces
export interface ArticleSummary {
    total: number;
    published: number;
    drafts: number;
    averageReadTimeMinutes: number;
}

export interface ArticleCountByDay {
    days: string[];
    counts: number[];
}

export interface ArticleByAuthor {
    authorId: string;
    authorName: string;
    count: number;
}

export interface TopArticleByComments {
    articleId: string;
    title: string;
    comments: number;
    views: number;
}

export interface ArticleStatusDistribution {
    status: string;
    count: number;
}

// User Service Interfaces
export interface UserSummary {
    total: number;
    activeLast30Days: number;
    newLast30Days: number;
}

export interface SignupsByDay {
    days: string[];
    counts: number[];
}

export interface UsersByRole {
    role: string;
    count: number;
}

export interface ActivePerHour {
    hours: string[];
    counts: number[];
}

export interface TopContributor {
    userId: string;
    name: string;
    articles: number;
    comments: number;
}

// Dashboard Data Interface
export interface DashboardData {
    articles: {
        summary: ArticleSummary;
        countByDay: ArticleCountByDay;
        countByAuthor: ArticleByAuthor[];
        topByComments: TopArticleByComments[];
        statusDistribution: ArticleStatusDistribution[];
    };
    users: {
        summary: UserSummary;
        signupsByDay: SignupsByDay;
        byRole: UsersByRole[];
        activePerHour: ActivePerHour;
        topContributors: TopContributor[];
    };
}
