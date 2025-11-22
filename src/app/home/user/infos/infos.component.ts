import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';
import { InfoPublication, InfoPublicationResponse, InfoPublicationService } from '../../../shared/services/info-pub.service';
import { ToastComponent } from "../../../shared/components/toast/toast.component";


// Interface étendue pour ajouter des propriétés UI
interface InfoPublicationUI extends InfoPublication {
  isExpanded?: boolean;
}

@Component({
  selector: 'app-infos',
  standalone: true,
  imports: [CommonModule, ToastComponent],
  templateUrl: './infos.component.html',
  styleUrls: ['./infos.component.scss'],
})
export class InfosComponent implements OnInit, OnDestroy {
  publications: InfoPublicationUI[] = [];
  isLoading: boolean = false;
  error: string | null = null;

  // Pagination
  currentPage: number = 1;
  pageSize: number = 10;
  totalPages: number = 0;
  totalPublications: number = 0;

  // Modal pour galerie d'images
  isModalOpen: boolean = false;
  selectedImages: string[] = [];
  currentImageIndex: number = 0;

  // Pour le unsubscribe
  private destroy$ = new Subject<void>();

  constructor(private infoPublicationService: InfoPublicationService) {}

  ngOnInit(): void {
    this.loadPublications();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
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
          // Ajouter la propriété isExpanded à chaque publication
          this.publications = response.publications.map(pub => ({
            ...pub,
            isExpanded: false,
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

  /**
   * Ouvrir la galerie d'images dans un modal
   */
  openImageGallery(images: string[], startIndex: number = 0): void {
    this.selectedImages = images;
    this.currentImageIndex = startIndex;
    this.isModalOpen = true;
    document.body.style.overflow = 'hidden';
  }

  /**
   * Fermer le modal de galerie
   */
  closeImageGallery(): void {
    this.isModalOpen = false;
    this.selectedImages = [];
    this.currentImageIndex = 0;
    document.body.style.overflow = 'auto';
  }

  /**
   * Image suivante dans la galerie
   */
  nextImage(): void {
    if (this.currentImageIndex < this.selectedImages.length - 1) {
      this.currentImageIndex++;
    }
  }

  /**
   * Image précédente dans la galerie
   */
  previousImage(): void {
    if (this.currentImageIndex > 0) {
      this.currentImageIndex--;
    }
  }

  /**
   * Aller à une image spécifique
   */
  goToImage(index: number): void {
    this.currentImageIndex = index;
  }

  /**
   * Obtenir l'image courante
   */
  getCurrentImage(): string {
    return this.selectedImages[this.currentImageIndex] || '';
  }

  /**
   * Pagination - Page suivante
   */
  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.loadPublications();
      this.scrollToTop();
    }
  }

  /**
   * Pagination - Page précédente
   */
  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.loadPublications();
      this.scrollToTop();
    }
  }

  /**
   * Pagination - Aller à une page spécifique
   */
  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.loadPublications();
      this.scrollToTop();
    }
  }

  /**
   * Obtenir le nombre de pages à afficher dans la pagination
   */
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

  /**
   * Scroller en haut de la page
   */
  private scrollToTop(): void {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  /**
   * Formater la date de publication (relative)
   */
  getRelativeTime(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInSeconds = Math.floor(diffInMs / 1000);
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInSeconds < 60) {
      return 'À l\'instant';
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

  /**
   * Obtenir les initiales de l'auteur pour l'avatar
   */
  getAuthorInitials(author: { nomUtilisateur: string; prenomUtilisateur: string }): string {
    const firstInitial = author.prenomUtilisateur?.charAt(0)?.toUpperCase() || '';
    const lastInitial = author.nomUtilisateur?.charAt(0)?.toUpperCase() || '';
    return `${firstInitial}${lastInitial}`;
  }

  /**
   * Obtenir une couleur d'avatar basée sur l'ID de l'auteur
   */
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

  /**
   * Vérifier si le contenu doit être tronqué
   */
  shouldTruncateContent(content: string, maxLength: number = 300): boolean {
    return content.length > maxLength;
  }

  /**
   * Toggle l'affichage complet du contenu
   */
  toggleContentExpansion(publication: InfoPublicationUI): void {
    publication.isExpanded = !publication.isExpanded;
  }
}