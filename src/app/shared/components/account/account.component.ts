import { UpdateProfileRequest } from './../../interfaces/profil.interface';
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';

import { Utilisateur } from '../../interfaces/utilisateur.interface';
import { UsersService } from '../../services/users.service';
import { AuthStateService } from '../../../auth/auth-state.service';
import { NotificationService } from '../../services/notification.service';

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
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
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
    private notificationService : NotificationService
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
      genre: ['', Validators.required],
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
        this.notificationService.error('Erreur lors du chargement du profil')
      },
    });
  }

  populateForm(user: Utilisateur | null): void {
    if (!user) return;

    this.accountForm.patchValue({
      nomUtilisateur: user.nomUtilisateur,
      prenomUtilisateur: user.prenomUtilisateur,
      sexe: user.sexe,
      langue: user.langue,
      NIF: user.NIF,
      STAT: user.STAT || '',
    });
  }

  toggleEdit(): void {
    this.isEditing = !this.isEditing;
    if (!this.isEditing) {
      this.populateForm(this.currentUser!);
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
              this.notificationService.success('Profil mis a jour avec succes');
            }
          }
        },
        error: (error) => {
          this.isLoading = false;
          this.notificationService.error(
            error.error?.message || 'Erreur lors de la mise a jour'
          );
        },
      });
    } else {
      this.markFromGroupTouched();
      this.notificationService.warning(
        'Veuillez corriger les erreurs dans le formulaire'
      );
    }
  }

  cancelEdit(): void {
    this.isEditing = false;
    if (this.currentUser) {
      this.populateForm(this.currentUser);
    }
  }

  private markFromGroupTouched() {
    Object.keys(this.accountForm.controls).forEach((key) => {
      this.accountForm.get(key)?.markAsTouched();
    });
  }

  
}
