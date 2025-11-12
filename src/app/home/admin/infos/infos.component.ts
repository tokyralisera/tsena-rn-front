// src/app/home/admin/infos/infos-admin.component.ts

import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { InfoPublication, InfoPublicationResponse, InfoPublicationService } from '../../../shared/services/info-pub.service';
import { ToastService } from '../../../shared/services/toast.service';


// Interface étendue pour ajouter des propriétés UI
interface InfoPublicationUI extends InfoPublication {
  isExpanded?: boolean;
  showMenu?: boolean;
}

@Component({
  selector: 'app-infos-admin',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './infos.component.html',
  styleUrls: ['./infos.component.scss'],
})
export class InfosCreationComponent implements OnInit, OnDestroy {
  publications: InfoPublicationUI[] = [];
  isLoading: boolean = false;
  error: string | null = null;

  // Pagination
  currentPage: number = 1;
  pageSize: number = 10;
  totalPages: number = 0;
  totalPublications: number = 0;

  // Modal galerie d'images
  isGalleryModalOpen: boolean = false;
  selectedImages: string[] = [];
  currentImageIndex: number = 0;

  // Modal création/modification
  isFormModalOpen: boolean = false;
  isEditMode: boolean = false;
  currentPublication: InfoPublicationUI | null = null;
  publicationForm!: FormGroup;
  selectedFiles: File[] = [];
  previewUrls: string[] = [];
  isSubmitting: boolean = false;

  // Modal suppression
  isDeleteModalOpen: boolean = false;
  publicationToDelete: InfoPublicationUI | null = null;
  isDeleting: boolean = false;

  // Pour le unsubscribe
  private destroy$ = new Subject<void>();

  constructor(
    private infoPublicationService: InfoPublicationService,
    private toastService: ToastService,
    private fb: FormBuilder
  ) {
    this.initForm();
  }

  ngOnInit(): void {
    this.loadPublications();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Initialiser le formulaire
   */
  initForm(): void {
    this.publicationForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(200)]],
      content: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(5000)]],
    });
  }

  /**
   * Charger les publications
   */
  loadPublications(): void {
    this.isLoading = true;
    this.error = null;

    this.infoPublicationService
      .getAllInfoPublications(this.currentPage, this.pageSize)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: InfoPublicationResponse) => {
          this.publications = response.publications.map((pub) => ({
            ...pub,
            isExpanded: false,
            showMenu: false,
          }));
          this.totalPages = response.pagination.totalPages;
          this.totalPublications = response.pagination.total;
          this.currentPage = response.pagination.page;
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Erreur lors du chargement des publications:', error);
          this.error = 'Impossible de charger les publications';
          this.isLoading = false;
        },
      });
  }

  /**
   * Liker/Unliker une publication
   */
  toggleLike(publication: InfoPublicationUI): void {
    this.infoPublicationService
      .toggleLike(publication.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          publication.isLikedByUser = response.liked;
          publication.likeCount = response.likeCount;
          publication.likesCount = response.likeCount;
        },
        error: (error) => {
          console.error('Erreur lors du like:', error);
        },
      });
  }

  // ===== MODAL GALERIE =====

  openImageGallery(images: string[], startIndex: number = 0): void {
    this.selectedImages = images;
    this.currentImageIndex = startIndex;
    this.isGalleryModalOpen = true;
    document.body.style.overflow = 'hidden';
  }

  closeImageGallery(): void {
    this.isGalleryModalOpen = false;
    this.selectedImages = [];
    this.currentImageIndex = 0;
    document.body.style.overflow = 'auto';
  }

  nextImage(): void {
    if (this.currentImageIndex < this.selectedImages.length - 1) {
      this.currentImageIndex++;
    }
  }

  previousImage(): void {
    if (this.currentImageIndex > 0) {
      this.currentImageIndex--;
    }
  }

  goToImage(index: number): void {
    this.currentImageIndex = index;
  }

  getCurrentImage(): string {
    return this.selectedImages[this.currentImageIndex] || '';
  }

  // ===== MODAL CRÉATION/MODIFICATION =====

  /**
   * Ouvrir le modal de création
   */
  openCreateModal(): void {
    this.isEditMode = false;
    this.currentPublication = null;
    this.publicationForm.reset();
    this.selectedFiles = [];
    this.previewUrls = [];
    this.isFormModalOpen = true;
    document.body.style.overflow = 'hidden';
  }

  /**
   * Ouvrir le modal de modification
   */
  openEditModal(publication: InfoPublicationUI): void {
    this.isEditMode = true;
    this.currentPublication = publication;
    this.publicationForm.patchValue({
      title: publication.title,
      content: publication.content,
    });
    this.selectedFiles = [];
    this.previewUrls = [...publication.images]; // Afficher les images existantes
    this.isFormModalOpen = true;
    publication.showMenu = false;
    document.body.style.overflow = 'hidden';
  }

  /**
   * Fermer le modal de formulaire
   */
  closeFormModal(): void {
    this.isFormModalOpen = false;
    this.isEditMode = false;
    this.currentPublication = null;
    this.publicationForm.reset();
    this.selectedFiles = [];
    this.previewUrls = [];
    document.body.style.overflow = 'auto';
  }

  /**
   * Gérer la sélection de fichiers
   */
  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const files = Array.from(input.files);
      
      // Limiter à 10 images
      if (files.length > 5) {
        this.toastService.warning('Vous ne pouvez sélectionner que 10 images maximum');
        return;
      }

      // Vérifier la taille et le type de chaque fichier
      const validFiles: File[] = [];
      for (const file of files) {
        if (!file.type.startsWith('image/')) {
          this.toastService.warning(`Le fichier ${file.name} n'est pas une image`);
          continue;
        }
        if (file.size > 5 * 1024 * 1024) {
          this.toastService.warning(`Le fichier ${file.name} dépasse 5MB`);
          continue;
        }
        validFiles.push(file);
      }

      this.selectedFiles = validFiles;
      this.generatePreviews();
    }
  }

  /**
   * Générer les aperçus des images
   */
  generatePreviews(): void {
    this.previewUrls = [];
    this.selectedFiles.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.previewUrls.push(e.target.result);
      };
      reader.readAsDataURL(file);
    });
  }

  /**
   * Supprimer une image de la sélection
   */
  removeImage(index: number): void {
    this.selectedFiles.splice(index, 1);
    this.previewUrls.splice(index, 1);
  }

  /**
   * Soumettre le formulaire
   */
  onSubmit(): void {
    if (this.publicationForm.invalid) {
      Object.keys(this.publicationForm.controls).forEach((key) => {
        this.publicationForm.controls[key].markAsTouched();
      });
      return;
    }

    // En mode création, au moins une image est obligatoire
    if (!this.isEditMode && this.selectedFiles.length === 0) {
      this.toastService.info('Veuillez sélectionner au moins une image');
      return;
    }

    this.isSubmitting = true;

    const formData = new FormData();
    formData.append('title', this.publicationForm.get('title')?.value);
    formData.append('content', this.publicationForm.get('content')?.value);

    // Ajouter les fichiers s'il y en a
    this.selectedFiles.forEach((file) => {
      formData.append('images', file);
    });

    if (this.isEditMode && this.currentPublication) {
      // Modification
      this.infoPublicationService
        .updateInfoPublication(this.currentPublication.id, formData)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.isSubmitting = false;
            this.closeFormModal();
            this.loadPublications();
            this.toastService.success('Publication modifiée avec succès');
          },
          error: (error) => {
            console.error('Erreur lors de la modification:', error);
            this.isSubmitting = false;
            this.toastService.error('Erreur lors de la modification de la publication');
          },
        });
    } else {
      // Création
      this.infoPublicationService
        .createInfoPublication(formData)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.isSubmitting = false;
            this.closeFormModal();
            this.loadPublications();
            this.toastService.success('Publication créée avec succès');
          },
          error: (error) => {
            console.error('Erreur lors de la création:', error);
            this.isSubmitting = false;
            this.toastService.error('Erreur lors de la création de la publication');
          },
        });
    }
  }

  // ===== MODAL SUPPRESSION =====

  /**
   * Ouvrir le modal de confirmation de suppression
   */
  openDeleteModal(publication: InfoPublicationUI): void {
    this.publicationToDelete = publication;
    this.isDeleteModalOpen = true;
    publication.showMenu = false;
    document.body.style.overflow = 'hidden';
  }

  /**
   * Fermer le modal de suppression
   */
  closeDeleteModal(): void {
    this.isDeleteModalOpen = false;
    this.publicationToDelete = null;
    document.body.style.overflow = 'auto';
  }

  /**
   * Confirmer la suppression
   */
  confirmDelete(): void {
    if (!this.publicationToDelete) return;

    this.isDeleting = true;

    this.infoPublicationService
      .deleteInfoPublication(this.publicationToDelete.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.isDeleting = false;
          this.closeDeleteModal();
          this.loadPublications();
          this.toastService.success('Publication supprimée avec succès');
        },
        error: (error) => {
          console.error('Erreur lors de la suppression:', error);
          this.isDeleting = false;
          this.toastService.error('Erreur lors de la suppression de la publication');
        },
      });
  }

  // ===== MENU ACTIONS =====

  /**
   * Toggle le menu d'actions
   */
  toggleMenu(publication: InfoPublicationUI, event: Event): void {
    event.stopPropagation();
    this.publications.forEach((pub) => {
      if (pub.id !== publication.id) {
        pub.showMenu = false;
      }
    });
    publication.showMenu = !publication.showMenu;
  }

  /**
   * Fermer tous les menus
   */
  closeAllMenus(): void {
    this.publications.forEach((pub) => (pub.showMenu = false));
  }

  // ===== PAGINATION =====

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.loadPublications();
      this.scrollToTop();
    }
  }

  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.loadPublications();
      this.scrollToTop();
    }
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.loadPublications();
      this.scrollToTop();
    }
  }

  getPaginationPages(): number[] {
    const pages: number[] = [];
    const maxPagesToShow = 5;
    let startPage = Math.max(1, this.currentPage - Math.floor(maxPagesToShow / 2));
    let endPage = Math.min(this.totalPages, startPage + maxPagesToShow - 1);

    if (endPage - startPage < maxPagesToShow - 1) {
      startPage = Math.max(1, endPage - maxPagesToShow + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return pages;
  }

  private scrollToTop(): void {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // ===== UTILITAIRES =====

  getRelativeTime(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInSeconds = Math.floor(diffInMs / 1000);
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInSeconds < 60) {
      return "À l'instant";
    } else if (diffInMinutes < 60) {
      return `Il y a ${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''}`;
    } else if (diffInHours < 24) {
      return `Il y a ${diffInHours} heure${diffInHours > 1 ? 's' : ''}`;
    } else if (diffInDays < 7) {
      return `Il y a ${diffInDays} jour${diffInDays > 1 ? 's' : ''}`;
    } else {
      return date.toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
    }
  }

  getAuthorInitials(author: {
    nomUtilisateur: string;
    prenomUtilisateur: string;
  }): string {
    const firstInitial = author.prenomUtilisateur?.charAt(0)?.toUpperCase() || '';
    const lastInitial = author.nomUtilisateur?.charAt(0)?.toUpperCase() || '';
    return `${firstInitial}${lastInitial}`;
  }

  getAvatarColor(authorId: number): string {
    const colors = [
      'bg-blue-500',
      'bg-green-500',
      'bg-yellow-500',
      'bg-red-500',
      'bg-purple-500',
      'bg-pink-500',
      'bg-indigo-500',
      'bg-teal-500',
    ];
    return colors[authorId % colors.length];
  }

  shouldTruncateContent(content: string, maxLength: number = 300): boolean {
    return content.length > maxLength;
  }

  toggleContentExpansion(publication: InfoPublicationUI): void {
    publication.isExpanded = !publication.isExpanded;
  }

  /**
   * Obtenir les erreurs de validation
   */
  getFieldError(fieldName: string): string {
    const field = this.publicationForm.get(fieldName);
    if (field?.hasError('required')) {
      return 'Ce champ est obligatoire';
    }
    if (field?.hasError('minlength')) {
      const minLength = field.errors?.['minlength'].requiredLength;
      return `Minimum ${minLength} caractères`;
    }
    if (field?.hasError('maxlength')) {
      const maxLength = field.errors?.['maxlength'].requiredLength;
      return `Maximum ${maxLength} caractères`;
    }
    return '';
  }

  /**
   * Vérifier si un champ est invalide
   */
  isFieldInvalid(fieldName: string): boolean {
    const field = this.publicationForm.get(fieldName);
    return !!(field?.invalid && field?.touched);
  }
}