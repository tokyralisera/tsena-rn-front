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
import { AccountComponent } from './shared/components/account/account.component';
import { CategoriesComponent } from './home/admin/categories/categories.component';
import { PaysComponent } from './home/admin/pays/pays.component';
import { VilleComponent } from './home/admin/ville/ville.component';
import { ApprobationOffreComponent } from './home/admin/offre/offre.component';
import { OffresUserComponent } from './home/user/offre/offre.component';

export const routes: Routes = [
  { path: '', component: LandingComponent },
  { path: 'login', component: LoginComponent },
  { path: 'signup', component: SignupComponent },

  {
    path: 'home',
    children: [
      {
        path: 'user',
        component: UserComponent,
        canActivate: [authGuard, roleGuard],
        data: { expectedRoles: ['USER'] },
        children: [{ path: 'profile', component: AccountComponent },
          { path: 'offres', component: OffresUserComponent },
        ],
      },
      {
        path: 'admin',
        component: AdminComponent,
        canActivate: [authGuard, roleGuard],
        data: { expectedRoles: ['ADMIN'] },
        children: [
          { path: 'profile', component: AccountComponent },
          { path: 'category', component: CategoriesComponent },
          { path: 'pays', component: PaysComponent },
          { path: 'villes', component: VilleComponent },
          { path: 'approbations-offres', component: ApprobationOffreComponent },
        ],
      },
      {
        path: 'superadmin',
        component: SuperadminComponent,
        canActivate: [authGuard, roleGuard],
        data: { expectedRoles: ['SUPERADMIN'] },
        children: [
          { path: 'profile', component: AccountComponent },
          { path: 'category', component: CategoriesComponent },
          { path: 'pays', component: PaysComponent },
          { path: 'villes', component: VilleComponent },
          { path: 'approbations-offres', component: ApprobationOffreComponent },
        ],
      },
    ],
  },

  { path: 'error', component: ErrorComponent },
  { path: '**', redirectTo: '/error' },
];
