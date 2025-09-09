import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../auth.service';

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './signup.component.html',
  styleUrl: './signup.component.scss',
})
export class SignupComponent {
  signupForm: FormGroup;
  isLoading = false;
  errorMessage = '';

  sexe = [
    {
      value: 'HOMME',
      label: 'Homme',
    },
    {
      value: 'FEMME',
      label: 'Femme',
    },
  ];

  role = [
    { value: 'USER', label: 'Utilisateur simple' },
    { value: 'ADMIN', label: 'Administrateur' },
  ];

  langue = [
    { value: 'MALAGASY', label: 'Malagasy' },
    { value: 'FRANCAIS', label: 'Francais' },
    { value: 'ENGLISH', label: 'English' },
  ];

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.signupForm = this.fb.group(
      {
        nomUtilisateur: [
          '',
          [
            Validators.required,
            Validators.minLength(2),
            Validators.maxLength(50),
          ],
        ],
        prenomUtilisateur: [
          '',
          [
            Validators.required,
            Validators.minLength(2),
            Validators.maxLength(50),
          ],
        ],
        sexe: ['', Validators.required],
        role: ['USER', Validators.required],
        NIF: ['', [Validators.required, Validators.pattern(/^[0-9]{9,13}$/)]],
        STAT: [''],
        telephone: [
          '',
          [Validators.required, Validators.pattern(/^[0-9]{10,15}$/)],
        ],
        password: ['', [Validators.required, Validators.minLength(6)]],
        confirmPassword: ['', Validators.required],
        langue: ['MALAGASY', Validators.required],
      },
      { validators: this.passwordMatchValidator }
    );
  }

  passwordMatchValidator(form: FormGroup) {
    const password = form.get('password');
    const confirmPassword = form.get('confirmedPassword');

    if (password && confirmPassword && password.value !== confirmPassword) {
      confirmPassword.setErrors({
        passwordMismatch: true,
      });
    } else {
      confirmPassword?.setErrors(null);
    }

    return null;
  }

  onSubmit(): void {
    if (this.signupForm.valid) {
      this.isLoading = true;
      this.errorMessage = '';

      const signupData = {
        ...this.signupForm.value,
        STAT: this.signupForm.value.STAT || undefined,
      };

      this.authService.signup(signupData).subscribe({
        next: (response) => {
          this.isLoading = false;
          this.router.navigate(['/login'], {
            queryParams: {
              message:
                'Compte cree avec succes, vous pouvez a present vous connecter',
            },
          });
        },
        error: (error) => {
          this.isLoading = false;
          this.errorMessage =
            error.error?.message || 'Erreur lors de la creation de compte';
        },
      });
    } else {
      this.errorMessage =
        'Veuillez corriger les informations sur le formulaire';
      Object.keys(this.signupForm.controls).forEach((key) => {
        this.signupForm.get(key)?.markAsTouched();
      });
    }
  }
}
