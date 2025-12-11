import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, ReplaySubject } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { environment } from 'environments/environment';
import { User } from 'app/core/user/user.types';

@Injectable({
    providedIn: 'root',
})
export class UserService {
    private _user: ReplaySubject<User> = new ReplaySubject<User>(1);

    /**
     * Constructor
     */
    constructor(private _httpClient: HttpClient) {}

    // -----------------------------------------------------------------------------------------------------
    // @ Accessors
    // -----------------------------------------------------------------------------------------------------

    /**
     * Setter & getter for user
     *
     * @param value
     */
    set user(value: User) {
        // Store the value
        this._user.next(value);
    }

    get user$(): Observable<User> {
        return this._user.asObservable();
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Get the current logged in user data
     */
    get(): Observable<User> {
        return this._httpClient
            .get<{ user: User }>(environment.apiUrl + '/users/me')
            .pipe(
                map((response) => response.user),
                tap((user) => {
                    this._user.next(user);
                })
            );
    }

    /**
     * Get all users
     */
    getAll(): Observable<User[]> {
        return this._httpClient.get<User[]>(environment.apiUrl + '/users');
    }

    /**
     * Update the user
     *
     * @param user
     */
    update(user: User): Observable<any> {
        return this._httpClient
            .patch<User>(environment.apiUrl + '/users/me', user)
            .pipe(
                map((response) => {
                    this._user.next(user);
                    return response;
                })
            );
    }

    /**
     * Update user role
     *
     * @param id
     * @param role
     */
    updateRole(id: string, role: string): Observable<any> {
        return this._httpClient.patch(
            environment.apiUrl + '/users/' + id + '/role',
            { role }
        );
    }
}
