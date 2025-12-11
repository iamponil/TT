import { CurrencyPipe, NgClass, NgFor, NgIf } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatRippleModule } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatTableModule } from '@angular/material/table';
import { MatTabsModule } from '@angular/material/tabs';
import { Router } from '@angular/router';
import { TranslocoModule } from '@ngneat/transloco';
import { ProjectService } from 'app/modules/admin/dashboards/project/project.service';
import { ApexOptions, NgApexchartsModule } from 'ng-apexcharts';
import { Subject, takeUntil } from 'rxjs';

@Component({
    selector       : 'project',
    templateUrl    : './project.component.html',
    encapsulation  : ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone     : true,
    imports        : [TranslocoModule, MatIconModule, MatButtonModule, MatRippleModule, MatMenuModule, MatTabsModule, MatButtonToggleModule, NgApexchartsModule, NgFor, NgIf, MatTableModule, NgClass, CurrencyPipe],
})
export class ProjectComponent implements OnInit, OnDestroy
{
    chartArticleActivity: ApexOptions = {};
    chartArticleStatusDistribution: ApexOptions = {};
    chartBudgetDistribution: ApexOptions = {};
    chartWeeklyExpenses: ApexOptions = {};
    chartMonthlyExpenses: ApexOptions = {};
    chartYearlyExpenses: ApexOptions = {};
    data: any;
    selectedProject: string = 'Content Management Dashboard';
    private _unsubscribeAll: Subject<any> = new Subject<any>();

    /**
     * Constructor
     */
    constructor(
        private _projectService: ProjectService,
        private _router: Router,
        private _changeDetectorRef: ChangeDetectorRef,
    )
    {
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Lifecycle hooks
    // -----------------------------------------------------------------------------------------------------

    /**
     * On init
     */
    ngOnInit(): void
    {
        // Check authentication status
        const accessToken = localStorage.getItem('accessToken');
        const userId = localStorage.getItem('userId');
        console.log('🔐 Authentication Status:', {
            hasAccessToken: !!accessToken,
            tokenLength: accessToken?.length || 0,
            hasUserId: !!userId,
            userId: userId
        });

        // Load dashboard data
        this.loadDashboardData();

        // Attach SVG fill fixer to all ApexCharts
        window['Apex'] = {
            chart: {
                events: {
                    mounted: (chart: any, options?: any): void =>
                    {
                        this._fixSvgFill(chart.el);
                    },
                    updated: (chart: any, options?: any): void =>
                    {
                        this._fixSvgFill(chart.el);
                    },
                },
            },
        };
    }

    /**
     * On destroy
     */
    ngOnDestroy(): void
    {
        // Unsubscribe from all subscriptions
        this._unsubscribeAll.next(null);
        this._unsubscribeAll.complete();
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Track by function for ngFor loops
     *
     * @param index
     * @param item
     */
    trackByFn(index: number, item: any): any
    {
        return item.id || index;
    }

    /**
     * Load dashboard data from backend
     */
    loadDashboardData(): void
    {
        console.log('🔄 Loading dashboard data...');
        
        // Try to get real data from backend, fall back to mock data
        this._projectService.getDashboardData()
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe({
                next: (data) =>
                {
                    console.log('✅ Successfully loaded dashboard data:', data);
                    
                    // Store the data
                    this.data = data;

                    // Prepare the chart data
                    this._prepareChartData();
                    
                    // Mark for check since we're using OnPush
                    this._changeDetectorRef.markForCheck();
                    
                    console.log('✅ Dashboard data set and charts prepared. Data:', this.data);
                },
                error: (err) =>
                {
                    console.error('❌ Failed to load real dashboard data:', err);
                    console.error('Error details:', {
                        status: err.status,
                        statusText: err.statusText,
                        message: err.message,
                        url: err.url
                    });
                    
                    // Fallback to mock data
                    this._projectService.getData()
                        .pipe(takeUntil(this._unsubscribeAll))
                        .subscribe({
                            next: (data) =>
                            {
                                console.log('✅ Loaded mock data as fallback:', data);
                                this.data = data;
                                this._prepareChartData();
                                this._changeDetectorRef.markForCheck();
                            },
                            error: (mockErr) =>
                            {
                                console.error('❌ Failed to load mock data as well:', mockErr);
                                // Set default empty data to prevent crashes
                                this.data = this._getDefaultEmptyData();
                                this._prepareChartData();
                                this._changeDetectorRef.markForCheck();
                                console.log('⚠️ Using default empty data');
                            }
                        });
                },
            });
    }

    /**
     * Refresh dashboard data
     */
    refreshData(): void
    {
        console.log('Refreshing dashboard data...');
        this.loadDashboardData();
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Private methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Get default empty data structure to prevent crashes
     * @private
     */
    private _getDefaultEmptyData(): any
    {
        return {
            articleActivity: {
                labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                series: {
                    'this-week': [
                        { name: 'Articles Created', type: 'line', data: [0, 0, 0, 0, 0, 0, 0] },
                        { name: 'Daily Count', type: 'column', data: [0, 0, 0, 0, 0, 0, 0] }
                    ],
                    'last-week': [
                        { name: 'Articles Created', type: 'line', data: [0, 0, 0, 0, 0, 0, 0] },
                        { name: 'Daily Count', type: 'column', data: [0, 0, 0, 0, 0, 0, 0] }
                    ]
                },
                overview: {
                    'this-week': { 'total-articles': 0, 'published': 0, 'drafts': 0, 'new-users': 0 },
                    'last-week': { 'total-articles': 0, 'published': 0, 'drafts': 0, 'new-users': 0 }
                }
            },
            articleStatusDistribution: {
                labels: ['Draft', 'Published'],
                series: {
                    'this-week': [0, 0],
                    'last-week': [0, 0]
                },
                overview: {
                    'this-week': { 'drafts': 0, 'published': 0 },
                    'last-week': { 'drafts': 0, 'published': 0 }
                }
            },
            topArticles: {
                top5: [],
                next5: []
            },
            rawData: {
                articles: {
                    summary: { total: 0, published: 0, drafts: 0, averageReadTimeMinutes: 0 },
                    countByDay: { days: [], counts: [] },
                    countByAuthor: [],
                    topByComments: [],
                    statusDistribution: []
                },
                users: {
                    summary: { total: 0, activeLast30Days: 0, newLast30Days: 0 },
                    signupsByDay: { days: [], counts: [] },
                    byRole: [],
                    activePerHour: { hours: [], counts: [] },
                    topContributors: []
                }
            }
        };
    }

    /**
     * Fix the SVG fill references. This fix must be applied to all ApexCharts
     * charts in order to fix 'black color on gradient fills on certain browsers'
     * issue caused by the '<base>' tag.
     *
     * Fix based on https://gist.github.com/Kamshak/c84cdc175209d1a30f711abd6a81d472
     *
     * @param element
     * @private
     */
    private _fixSvgFill(element: Element): void
    {
        // Current URL
        const currentURL = this._router.url;

        // 1. Find all elements with 'fill' attribute within the element
        // 2. Filter out the ones that doesn't have cross reference so we only left with the ones that use the 'url(#id)' syntax
        // 3. Insert the 'currentURL' at the front of the 'fill' attribute value
        Array.from(element.querySelectorAll('*[fill]'))
            .filter(el => el.getAttribute('fill').indexOf('url(') !== -1)
            .forEach((el) =>
            {
                const attrVal = el.getAttribute('fill');
                el.setAttribute('fill', `url(${currentURL}${attrVal.slice(attrVal.indexOf('#'))}`);
            });
    }

    /**
     * Prepare the chart data from the data
     *
     * @private
     */
    private _prepareChartData(): void
    {
        // Check if data is available
        if (!this.data) {
            console.warn('No data available for charts');
            return;
        }

        // Ensure series data exists before creating charts
        if (!this.data.articleActivity?.series) {
            console.warn('Article activity series data is missing');
            this.data.articleActivity = this.data.articleActivity || {};
            this.data.articleActivity.series = {
                'this-week': [],
                'last-week': []
            };
        }

        if (!this.data.articleStatusDistribution?.series) {
            console.warn('Article status distribution series data is missing');
            this.data.articleStatusDistribution = this.data.articleStatusDistribution || {};
            this.data.articleStatusDistribution.series = {
                'this-week': [],
                'last-week': []
            };
        }

        // Article activity chart
        this.chartArticleActivity = {
            chart      : {
                fontFamily: 'inherit',
                foreColor : 'inherit',
                height    : '100%',
                type      : 'line',
                toolbar   : {
                    show: false,
                },
                zoom      : {
                    enabled: false,
                },
            },
            colors     : ['#3B82F6', '#93C5FD'],
            dataLabels : {
                enabled        : true,
                enabledOnSeries: [0],
                background     : {
                    borderWidth: 0,
                },
            },
            grid       : {
                borderColor: 'var(--fuse-border)',
            },
            labels     : this.data.articleActivity?.labels || [],
            legend     : {
                show: false,
            },
            plotOptions: {
                bar: {
                    columnWidth: '50%',
                },
            },
            series     : this.data.articleActivity?.series || {},
            states     : {
                hover: {
                    filter: {
                        type : 'darken',
                        value: 0.75,
                    },
                },
            },
            stroke     : {
                width: [3, 0],
            },
            tooltip    : {
                followCursor: true,
                theme       : 'dark',
            },
            xaxis      : {
                axisBorder: {
                    show: false,
                },
                axisTicks : {
                    color: 'var(--fuse-border)',
                },
                labels    : {
                    style: {
                        colors: 'var(--fuse-text-secondary)',
                    },
                },
                tooltip   : {
                    enabled: false,
                },
            },
            yaxis      : {
                labels: {
                    offsetX: -16,
                    style  : {
                        colors: 'var(--fuse-text-secondary)',
                    },
                },
            },
        };

        // Article status distribution
        console.log('Setting up Article Status Distribution chart');
        console.log('Data structure:', this.data);
        console.log('articleStatusDistribution:', this.data?.articleStatusDistribution);
        console.log('labels:', this.data?.articleStatusDistribution?.labels);
        console.log('series:', this.data?.articleStatusDistribution?.series);
        console.log('series this-week:', this.data?.articleStatusDistribution?.series?.['this-week']);
        console.log('series last-week:', this.data?.articleStatusDistribution?.series?.['last-week']);
        
        this.chartArticleStatusDistribution = {
            chart      : {
                fontFamily: 'inherit',
                foreColor : 'inherit',
                height    : '100%',
                type      : 'polarArea',
                toolbar   : {
                    show: false,
                },
                zoom      : {
                    enabled: false,
                },
            },
            colors     : ['#3B82F6', '#F59E0B', '#6B7280'], // Blue for published, Amber for draft, Gray for archived
            dataLabels : {
                enabled: true,
                formatter: (val): string => {
                    if (typeof val === 'number') {
                        return Math.round(val).toString();
                    }
                    return val?.toString() || '0';
                },
            },
            fill       : {
                opacity: 0.85,
                colors: ['#3B82F6', '#F59E0B', '#6B7280'],
            },
            labels     : this.data?.articleStatusDistribution?.labels || [],
            legend     : {
                position: 'bottom',
            },
            plotOptions: {
                polarArea: {
                    spokes: {
                        connectorColors: 'var(--fuse-border)',
                    },
                    rings : {
                        strokeColor: 'var(--fuse-border)',
                    },
                },
            },
            series     : this.data?.articleStatusDistribution?.series || { 'this-week': [], 'last-week': [] },
            states     : {
                hover: {
                    filter: {
                        type : 'darken',
                        value: 0.75,
                    },
                },
            },
            stroke     : {
                width: 2,
            },
            tooltip    : {
                followCursor: true,
                theme       : 'dark',
                y: {
                    formatter: (val): string => val ? val.toFixed(0) : '0',
                },
            },
            yaxis      : {
                show: true,
                labels: {
                    show: true,
                    formatter: (val): string => val ? Math.round(val).toString() : '0',
                    style: {
                        colors: 'var(--fuse-text-secondary)',
                    },
                },
            },
        };
        
        console.log('Chart config series:', this.chartArticleStatusDistribution.series);

        // Budget distribution
        this.chartBudgetDistribution = {
            chart      : {
                fontFamily: 'inherit',
                foreColor : 'inherit',
                height    : '100%',
                type      : 'radar',
                sparkline : {
                    enabled: true,
                },
            },
            colors     : ['#818CF8'],
            dataLabels : {
                enabled   : true,
                formatter : (val: number): string | number => `${val}%`,
                textAnchor: 'start',
                style     : {
                    fontSize  : '13px',
                    fontWeight: 500,
                },
                background: {
                    borderWidth: 0,
                    padding    : 4,
                },
                offsetY   : -15,
            },
            markers    : {
                strokeColors: '#818CF8',
                strokeWidth : 4,
            },
            plotOptions: {
                radar: {
                    polygons: {
                        strokeColors   : 'var(--fuse-border)',
                        connectorColors: 'var(--fuse-border)',
                    },
                },
            },
            series     : this.data.budgetDistribution?.series || [],
            stroke     : {
                width: 2,
            },
            tooltip    : {
                theme: 'dark',
                y    : {
                    formatter: (val: number): string => `${val}%`,
                },
            },
            xaxis      : {
                labels    : {
                    show : true,
                    style: {
                        fontSize  : '12px',
                        fontWeight: '500',
                    },
                },
                categories: this.data.budgetDistribution?.categories || [],
            },
            yaxis      : {
                max       : (max: number): number => parseInt((max + 10).toFixed(0), 10),
                tickAmount: 7,
            },
        };

        // Weekly expenses
        this.chartWeeklyExpenses = {
            chart  : {
                animations: {
                    enabled: false,
                },
                fontFamily: 'inherit',
                foreColor : 'inherit',
                height    : '100%',
                type      : 'line',
                sparkline : {
                    enabled: true,
                },
            },
            colors : ['#22D3EE'],
            series : this.data.weeklyExpenses?.series || [],
            stroke : {
                curve: 'smooth',
            },
            tooltip: {
                theme: 'dark',
            },
            xaxis  : {
                type      : 'category',
                categories: this.data.weeklyExpenses?.labels || [],
            },
            yaxis  : {
                labels: {
                    formatter: (val): string => `$${val}`,
                },
            },
        };

        // Monthly expenses
        this.chartMonthlyExpenses = {
            chart  : {
                animations: {
                    enabled: false,
                },
                fontFamily: 'inherit',
                foreColor : 'inherit',
                height    : '100%',
                type      : 'line',
                sparkline : {
                    enabled: true,
                },
            },
            colors : ['#4ADE80'],
            series : this.data.monthlyExpenses?.series || [],
            stroke : {
                curve: 'smooth',
            },
            tooltip: {
                theme: 'dark',
            },
            xaxis  : {
                type      : 'category',
                categories: this.data.monthlyExpenses?.labels || [],
            },
            yaxis  : {
                labels: {
                    formatter: (val): string => `$${val}`,
                },
            },
        };

        // Yearly expenses
        this.chartYearlyExpenses = {
            chart  : {
                animations: {
                    enabled: false,
                },
                fontFamily: 'inherit',
                foreColor : 'inherit',
                height    : '100%',
                type      : 'line',
                sparkline : {
                    enabled: true,
                },
            },
            colors : ['#FB7185'],
            series : this.data.yearlyExpenses?.series || [],
            stroke : {
                curve: 'smooth',
            },
            tooltip: {
                theme: 'dark',
            },
            xaxis  : {
                type      : 'category',
                categories: this.data.yearlyExpenses?.labels || [],
            },
            yaxis  : {
                labels: {
                    formatter: (val): string => `$${val}`,
                },
            },
        };
    }
}
