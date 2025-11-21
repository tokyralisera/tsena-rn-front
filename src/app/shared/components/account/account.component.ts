import { UpdateProfileRequest } from './../../interfaces/profil.interface';
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';

import { Utilisateur } from '../../interfaces/utilisateur.interface';
import { UsersService } from '../../services/users.service';
import { AuthStateService } from '../../../auth/auth-state.service';
import { ToastService } from '../../services/toast.service';
import { ToastComponent } from '../../components/toast/toast.component';

interface SexeOption {
  label: string;
  value: string;
}

interface LangueOption {
  label: string;
  value: string;
}

@Component({
  selector: 'app-account',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, ToastComponent],
  templateUrl: './account.component.html',
  styleUrl: './account.component.scss',
})
export class AccountComponent implements OnInit {
  accountForm: FormGroup;
  currentUser: Utilisateur | null = null;
  isLoading = false;
  isEditing = false;

  sexeOptions: SexeOption[] = [
    { label: 'Homme', value: 'HOMME' },
    { label: 'Femme', value: 'FEMME' },
  ];

  langueOptions: LangueOption[] = [
    { label: 'Malagasy', value: 'MALAGASY' },
    { label: 'Français', value: 'FRANCAIS' },
    { label: 'English', value: 'ENGLISH' },
  ];

  constructor(
    private fb: FormBuilder,
    private usersService: UsersService,
    private authStateService: AuthStateService,
    private toastService: ToastService
  ) {
    this.accountForm = this.fb.group({
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
      sexe: ['', Validators.required], // CORRIGÉ: 'sexe' au lieu de 'genre'
      langue: ['', Validators.required],
      NIF: ['', [Validators.required, Validators.pattern(/^[0-9]{9,13}$/)]],
      STAT: [''],
    });
  }

  ngOnInit(): void {
    this.loadUserProfile();
  }

  loadUserProfile(): void {
    this.isLoading = true;
    this.usersService.getProfile().subscribe({
      next: (response) => {
        this.currentUser = response.data;
        this.populateForm(this.currentUser);
        this.isLoading = false;
      },
      error: (error) => {
        this.isLoading = false;
        this.toastService.error('Erreur lors du chargement du profil');
      },
    });
  }

  populateForm(user: Utilisateur | null): void {
    if (!user) return;

    this.accountForm.patchValue({
      nomUtilisateur: user.nomUtilisateur,
      prenomUtilisateur: user.prenomUtilisateur,
      sexe: user.sexe, // CORRIGÉ
      langue: user.langue,
      NIF: user.NIF,
      STAT: user.STAT || '',
    });
  }

  toggleEdit(): void {
    this.isEditing = !this.isEditing;
    if (!this.isEditing) {
      this.populateForm(this.currentUser);
    }
  }

  onSubmit(): void {
    if (this.accountForm.valid) {
      this.isLoading = true;

      const formData: UpdateProfileRequest = {
        ...this.accountForm.value,
        STAT: this.accountForm.value.STAT || undefined,
      };

      this.usersService.updateProfile(formData).subscribe({
        next: (response) => {
          this.isLoading = false;
          if (response.data) {
            this.currentUser = response.data;
            if (this.currentUser) {
              this.authStateService.setCurrentUser(this.currentUser);
              this.isEditing = false;
              this.toastService.success('Profil mis à jour avec succès');
            }
          }
        },
        error: (error) => {
          this.isLoading = false;
          this.toastService.error(
            error.error?.message || 'Erreur lors de la mise à jour'
          );
        },
      });
    } else {
      this.markFormGroupTouched();
      this.toastService.warning(
        'Veuillez corriger les erreurs dans le formulaire'
      );
    }
  }

  cancelEdit(): void {
    this.isEditing = false;
    if (this.currentUser) {
      this.populateForm(this.currentUser);
    }
    this.accountForm.markAsUntouched();
  }

  private markFormGroupTouched() {
    Object.keys(this.accountForm.controls).forEach((key) => {
      this.accountForm.get(key)?.markAsTouched();
    });
  }
}