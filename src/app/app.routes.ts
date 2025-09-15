import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './auth/login/login.component';
import { NgModule } from '@angular/core';
import { SignupComponent } from './auth/signup/signup.component';
import { LandingComponent } from './landing/landing.component';
import { UserComponent } from './home/user/user.component';
import { authGuard } from './auth/auth.guard';
import { ErrorComponent } from './home/error/error.component';
import { AdminComponent } from './home/admin/admin.component';
import { SuperadminComponent } from './home/superadmin/superadmin.component';
import { roleGuard } from './auth/role.guard';

export const routes: Routes = [
  { path: '', component: LandingComponent },
  {
    path: 'login',
    component: LoginComponent,
  },
  { path: 'signup', component: SignupComponent },

  // Routes protégées avec gestion des rôles
  {
    path: 'home/user',
    component: UserComponent,
    canActivate: [authGuard, roleGuard],
    data: { expectedRoles: ['USER'] },
  },
  {
    path: 'home/admin',
    component: AdminComponent,
    canActivate: [authGuard, roleGuard],
    data: { expectedRoles: ['ADMIN'] },
  },
  {
    path: 'home/superadmin',
    component: SuperadminComponent,
    canActivate: [authGuard, roleGuard],
    data: { expectedRoles: ['SUPERADMIN'] },
  },

  // Redirection par défaut après login
  {
    path: 'home',
    canActivate: [authGuard],
    component: UserComponent,
  },

  //Gestion Erreur route et 404
  { path: 'error', component: ErrorComponent },
  { path: '**', redirectTo: 'error' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
