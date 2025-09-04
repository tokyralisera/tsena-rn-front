import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../auth.service';
import { Router, RouterModule } from '@angular/router';
import { LoginRequest } from './interfaces/login.request';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent {
  loginForm: FormGroup;
  isLoading = false;
  errorMessage = '';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.loginForm = this.fb.group({
      telephone: [
        '',
        [Validators.required, Validators.pattern(/^[0-9]{10,15}$/)],
      ],
      password: ['', [Validators.required, Validators.minLength(6)]],
      rememberMe: [false],
    });
  }

  onSubmit(): void {
    if (this.loginForm.valid) {
      this.isLoading = true;
      this.errorMessage = '';

      const credentials: LoginRequest = {
        telephone: this.loginForm.value.telephone,
        password: this.loginForm.value.password,
      };
      this.authService.login(credentials).subscribe({
        next: (response) => {
          this.isLoading = false;
          this.router.navigate(['/landing']);
        },
        error: (error) => {
          this.isLoading = false;
          this.errorMessage = error.error?.message || 'Erreur de connexion';
        },
      });
    }
  }
}
