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
import { DemandeUserComponent } from './home/user/demande/demande.component';
import { ApprobationsDemandesComponent } from './home/admin/demande/demande.component';
import { InfosComponent } from './home/user/infos/infos.component';
import { InfosCreationComponent } from './home/admin/infos/infos.component';
import { DashboardComponent } from './home/superadmin/dashboard/dashboard.component';
import { UsersComponent } from './home/superadmin/users/users.component';


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
          { path: 'demandes', component: DemandeUserComponent },
          { path: 'infos', component: InfosComponent },
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
          { path: 'approbations-demandes', component: ApprobationsDemandesComponent },
          { path: 'infos-creation', component: InfosCreationComponent },
          
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
          { path: 'approbations-demandes', component: ApprobationsDemandesComponent },
          { path: 'infos-creation', component: InfosCreationComponent },
          { path: 'dashboard', component: DashboardComponent },
          { path: 'utilisateurs', component: UsersComponent },
        ],
      },
    ],
  },

  { path: 'error', component: ErrorComponent },
  { path: '**', redirectTo: '/error' },
];
