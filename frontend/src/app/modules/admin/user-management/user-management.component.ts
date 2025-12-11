import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { UserService } from 'app/core/user/user.service';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';
import { User } from 'app/core/user/user.types';
import { Observable } from 'rxjs';
import { AsyncPipe, NgForOf, NgIf } from '@angular/common';

@Component({
    selector: 'user-management',
    templateUrl: './user-management.component.html',
    encapsulation: ViewEncapsulation.None,
    standalone: true,
    imports: [
        MatIconModule,
        AsyncPipe,
        NgForOf,
        NgIf,
        MatFormFieldModule,
        MatSelectModule,
        MatOptionModule,
    ],
})
export class UserManagementComponent implements OnInit {
    users$: Observable<User[]>;
    roles = ['Admin', 'Éditeur', 'Rédacteur', 'Lecteur'];

    constructor(private _userService: UserService) {}

    ngOnInit(): void {
        this.users$ = this._userService.getAll();
    }

    updateRole(userId: string, role: string): void {
        this._userService.updateRole(userId, role).subscribe(() => {
            this.users$ = this._userService.getAll();
        });
    }

    trackByFn(index: number, item: any): any {
        return item.id || index;
    }
}
