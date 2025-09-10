import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './auth/login/login.component';
import { NgModule } from '@angular/core';
import { SignupComponent } from './auth/signup/signup.component';
import { LandingComponent } from './landing/landing.component';
import { HeaderComponent } from './shared/components/header/header.component';
import { SidebarComponent } from './shared/components/sidebar/sidebar.component';

export const routes: Routes = [
  {
    path: 'login',
    component: LoginComponent,
  },
  { path: 'signup', component: SignupComponent },
  { path: '', component: LandingComponent },
  { path: 'header', component: HeaderComponent },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
