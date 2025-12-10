import { Injectable } from '@angular/core';
import { HttpErrorResponse, HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { AuthService } from 'app/core/auth/auth.service';
import { AuthUtils } from 'app/core/auth/auth.utils';

@Injectable()
export class AuthInterceptor implements HttpInterceptor
{
    /**
     * Constructor
     */
    constructor(private _authService: AuthService)
    {
    }

    /**
     * Intercept
     *
     * @param req
     * @param next
     */
    intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>>
    {
        // Clone the request object
        let newReq = req.clone();

        // Request
        //
        // If the access token didn't expire, add the Authorization header.
        // We won't add the Authorization header if the access token expired.
        // This will force the server to return a "401 Unauthorized" response
        // for the protected API routes which our response interceptor will
        // catch and delete the access token from the local storage while logging
        // the user out from the app.
        if ( this._authService.accessToken )
        {
             const isExpired = AuthUtils.isTokenExpired(this._authService.accessToken);
             console.log('[AuthInterceptor] Token present. Expired:', isExpired);

             if ( !isExpired )
             {
                newReq = req.clone({
                    headers: req.headers.set('Authorization', 'Bearer ' + this._authService.accessToken)
                });
             } else {
                 console.log('[AuthInterceptor] Token expired, sending request without header to trigger 401');
             }
        } else {
            console.log('[AuthInterceptor] No access token present');
        }

        // Response
        return next.handle(newReq).pipe(
            catchError((error) => {

                // Catch "401 Unauthorized" responses
                if ( error instanceof HttpErrorResponse && error.status === 401 )
                {
                    return this._authService.refreshToken().pipe(
                        switchMap(() => {
                            // Reload the access token
                            newReq = req.clone({
                                headers: req.headers.set('Authorization', 'Bearer ' + this._authService.accessToken)
                            });

                            return next.handle(newReq);
                        }),
                        catchError((refreshError) => {
                            // Sign out
                            this._authService.signOut();

                            // Reload the app
                            location.reload();

                            return throwError(refreshError);
                        })
                    );
                }

                return throwError(error);
            })
        );
    }
}
