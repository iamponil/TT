import { HttpErrorResponse, HttpEvent, HttpHandlerFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from 'app/core/auth/auth.service';
import { AuthUtils } from 'app/core/auth/auth.utils';
import { catchError, Observable, switchMap, throwError } from 'rxjs';

/**
 * Intercept
 *
 * @param req
 * @param next
 */
export const authInterceptor = (req: HttpRequest<unknown>, next: HttpHandlerFn): Observable<HttpEvent<unknown>> =>
{
    const authService = inject(AuthService);

    // Clone the request object
    let newReq = req.clone();

    // Request
    //
    // If the access token didn't expire, add the Authorization header.
    // We won't add the Authorization header if the access token expired.
    // This will force the server to return a "401 Unauthorized" response
    // for the protected API routes which our response interceptor will
    // catch and attempt to refresh the token.
    if ( authService.accessToken && !AuthUtils.isTokenExpired(authService.accessToken) )
    {
        newReq = req.clone({
            headers: req.headers.set('Authorization', 'Bearer ' + authService.accessToken),
        });
    }

    // Response
    return next(newReq).pipe(
        catchError((error) =>
        {
            // Catch "401 Unauthorized" responses
            if ( error instanceof HttpErrorResponse && error.status === 401 )
            {
                // Don't try to refresh if the request was to the auth endpoints
                if (req.url.includes('/auth/login') || 
                    req.url.includes('/auth/register') || 
                    req.url.includes('/auth/refresh'))
                {
                    return throwError(error);
                }

                // Try to refresh the token
                return authService.refreshToken().pipe(
                    switchMap(() =>
                    {
                        // Retry the original request with the new token
                        const retryReq = req.clone({
                            headers: req.headers.set('Authorization', 'Bearer ' + authService.accessToken),
                        });
                        return next(retryReq);
                    }),
                    catchError((refreshError) =>
                    {
                        // If refresh fails, sign out and reload
                        authService.signOut().subscribe();
                        location.reload();
                        return throwError(() => refreshError);
                    })
                );
            }

            return throwError(error);
        }),
    );
};
