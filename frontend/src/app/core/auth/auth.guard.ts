import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from './auth.service';

export const authGuard: CanActivateFn = (route, state) => {
    const router = inject(Router);
    const authService = inject(AuthService);

    // Use signal method directly if authenticated check exists. 
    // For safety against initial load latency we usually check the token in localStorage primarily to redirect quickly.
    if (authService.getToken()) {

        // Check roles if defined in route data
        const expectedRoles: string[] = route.data['roles'];
        if (expectedRoles) {
            if (!authService.hasRole(expectedRoles)) {
                router.navigate(['/unauthorized']);
                return false;
            }
        }

        return true;
    }

    router.navigate(['/login']);
    return false;
};
