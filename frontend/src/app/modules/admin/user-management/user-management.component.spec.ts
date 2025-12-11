import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { UserService } from 'app/core/user/user.service';
import { User } from 'app/core/user/user.types';
import { Observable } from 'rxjs';
import { MatIconModule } from "@angular/material/icon";

@Component({
    selector     : 'user-management',
    templateUrl  : './user-management.component.html',
    encapsulation: ViewEncapsulation.None,
    standalone   : true,
    imports: [MatIconModule]
})
export class UserManagementComponent implements OnInit
{
    users$: Observable<User[]>;
    roles = ['Admin', 'Éditeur', 'Rédacteur', 'Lecteur'];

    /**
     * Constructor
     */
    constructor(private _userService: UserService)
    {
    }

    /**
     * On init
     */
    ngOnInit(): void
    {
        this.users$ = this._userService.getAll();
    }

    /**
     * Update role
     * @param userId
     * @param role
     */
    updateRole(userId: string, role: string): void
    {
        this._userService.updateRole(userId, role).subscribe(() => {
            // Reload users or just show notification?
            // Reload simple
            this.users$ = this._userService.getAll();
        }, (err) => {
            console.error('Failed to update role', err);
        });
    }

    trackByFn(index: number, item: any): any
    {
        return item.id || index;
    }
}