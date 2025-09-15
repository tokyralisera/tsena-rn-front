import { inject } from "@angular/core";
import { CanActivateFn, Router } from "@angular/router";
import { AuthService } from "./auth.service";

export const roleGuard : CanActivateFn = (route) => {
    const authService = inject(AuthService)
    const router = inject(Router)

    const expectedRoles = route.data['expectedRoles'] || [];
    const userRole = authService.getUserRole()

    if(expectedRoles.length === 0 || expectedRoles.includes(userRole)) {
        return true;
    } else {
        router.navigate(['error'])
        return false;
    }
}