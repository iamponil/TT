import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { ArticleService } from 'app/core/article/article.service';
import { ApexOptions } from 'ng-apexcharts';

@Component({
    selector     : 'dashboard',
    templateUrl  : './dashboard.component.html',
    encapsulation: ViewEncapsulation.None
})
export class DashboardComponent implements OnInit
{
    chartOptions: ApexOptions = {};
    totalArticles: number = 0;
    loading = true;

    constructor(private _articleService: ArticleService)
    {
    }

    ngOnInit(): void
    {
        this.fetchData();
    }

    fetchData(): void
    {
        this.loading = true;
        // Fetch last 100 articles to generate stats
        this._articleService.getArticles({ limit: 100 }).subscribe((response: any) => {
            const articles = response.articles || [];
            this.totalArticles = response.total ? response.total : articles.length;

            this.generateChartData(articles);
            this.loading = false;
        });
    }

    generateChartData(articles: any[]): void
    {
        const tagCounts: { [key: string]: number } = {};

        articles.forEach((article) => {
            if (article.tags && Array.isArray(article.tags)) {
                article.tags.forEach((tag) => {
                    tagCounts[tag] = (tagCounts[tag] || 0) + 1;
                });
            }
        });

        const categories = Object.keys(tagCounts);
        const data = Object.values(tagCounts);

        this.chartOptions = {
            series: [{
                name: 'Articles',
                data: data
            }],
            chart: {
                height: 350,
                type: 'bar',
                toolbar: { show: false }
            },
            plotOptions: {
                bar: {
                    columnWidth: '45%',
                    distributed: true
                }
            },
            dataLabels: { enabled: false },
            xaxis: {
                categories: categories,
                labels: {
                    style: {
                        fontSize: '12px'
                    }
                }
            },
            yaxis: {
                title: { text: 'Count' }
            },
            title: {
                text: 'Articles by Tag',
                align: 'center'
            }
        };
    }
}
