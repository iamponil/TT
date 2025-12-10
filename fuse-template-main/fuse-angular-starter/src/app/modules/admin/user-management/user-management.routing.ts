import { Route } from '@angular/router';
import { UserManagementComponent } from './user-management.component';

export const userManagementRoutes: Route[] = [
    {
        path     : '',
        component: UserManagementComponent
    }
];
