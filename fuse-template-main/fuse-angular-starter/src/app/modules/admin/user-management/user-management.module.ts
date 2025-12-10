import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { UserManagementComponent } from './user-management.component';
import { userManagementRoutes } from './user-management.routing';

@NgModule({
    declarations: [
        UserManagementComponent
    ],
    imports     : [
        RouterModule.forChild(userManagementRoutes),
        CommonModule,
        MatButtonModule,
        MatIconModule,
        MatSelectModule,
        MatFormFieldModule
    ]
})
export class UserManagementModule
{
}
