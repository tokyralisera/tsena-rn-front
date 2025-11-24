import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ToastService } from '../../../shared/services/toast.service';
import { ToastComponent } from '../../../shared/components/toast/toast.component';
import { 
  Utilisateur, 
  ROLE_LABELS, 
  ROLE_COLORS, 
  SEXE_LABELS, 
  LANGUE_LABELS 
} from '../../../shared/interfaces/utilisateur.interface';
import { 
  UpdateUserRoleRequest, 
  UsersService 
} from '../../../shared/services/users.service';

@Component({
  selector: 'app-utilisateurs',
  standalone: true,
  imports: [CommonModule, FormsModule, ToastComponent],
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.scss']
})
export class UsersComponent implements OnInit {
  users: Utilisateur[] = [];
  loading = false;
  
  // Pagination
  currentPage = 1;
  totalPages = 1;
  totalItems = 0;
  itemsPerPage = 10;
  
  // Filtres
  searchTerm = '';
  selectedRoleFilter: string = '';
  
  // Modales
  showRoleModal = false;
  showDeleteModal = false;
  showDetailsModal = false;
  
  // Sélection
  selectedUser: Utilisateur | null = null;
  newRole: 'USER' | 'ADMIN' | 'SUPERADMIN' = 'USER';
  
  // Statistiques
  stats = {
    totalUsers: 0,
    activeUsers: 0,
    usersByRole: [] as { role: string; count: number }[]
  };

  // Labels et couleurs
  roleLabels = ROLE_LABELS;
  roleColors = ROLE_COLORS;
  sexeLabels = SEXE_LABELS;
  langueLabels = LANGUE_LABELS;
  
  constructor(
    private usersService: UsersService,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.loadUsers();
    this.loadStats();
  }

  // ==========================================
  // CHARGEMENT DES DONNÉES
  // ==========================================

  loadUsers(): void {
    this.loading = true;
    this.usersService.getAllUsers(
      this.currentPage, 
      this.itemsPerPage, 
      this.searchTerm,
      this.selectedRoleFilter
    ).subscribe({
      next: (response) => {
        this.users = response.data;
        this.totalItems = response.total;
        this.totalPages = Math.ceil(response.total / this.itemsPerPage);
        this.loading = false;
      },
      error: (error) => {
        console.error('Erreur lors du chargement des utilisateurs:', error);
        this.toastService.error('Erreur lors du chargement des utilisateurs');
        this.loading = false;
      }
    });
  }

  loadStats(): void {
    this.usersService.getUsersStats().subscribe({
      next: (response) => {
        this.stats = response.data;
      },
      error: (error) => {
        console.error('Erreur lors du chargement des statistiques:', error);
        this.toastService.error('Erreur lors du chargement des statistiques');
      }
    });
  }

  // ==========================================
  // RECHERCHE ET FILTRES
  // ==========================================

  onSearch(): void {
    this.currentPage = 1;
    this.loadUsers();
  }

  onFilterByRole(): void {
    this.currentPage = 1;
    this.loadUsers();
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.selectedRoleFilter = '';
    this.currentPage = 1;
    this.loadUsers();
  }

  // ==========================================
  // MODALS - RÔLE
  // ==========================================

  openRoleModal(user: Utilisateur): void {
    this.selectedUser = user;
    this.newRole = user.role;
    this.showRoleModal = true;
  }

  closeRoleModal(): void {
    this.showRoleModal = false;
    this.selectedUser = null;
  }

  confirmRoleChange(): void {
    if (!this.selectedUser) return;

    if (this.newRole === this.selectedUser.role) {
      this.toastService.warning('Aucune modification détectée');
      return;
    }

    this.loading = true;
    const roleData: UpdateUserRoleRequest = { role: this.newRole };
    
    this.usersService.updateUserRole(this.selectedUser.id, roleData).subscribe({
      next: (response) => {
        this.toastService.success(response.message || 'Rôle modifié avec succès');
        this.closeRoleModal();
        this.loadUsers();
        this.loadStats();
        this.loading = false;
      },
      error: (error) => {
        console.error('Erreur lors de la modification du rôle:', error);
        this.toastService.error(error.error?.message || 'Erreur lors de la modification du rôle');
        this.loading = false;
      }
    });
  }

  // ==========================================
  // MODALS - SUPPRESSION
  // ==========================================

  openDeleteModal(user: Utilisateur): void {
    this.selectedUser = user;
    this.showDeleteModal = true;
  }

  closeDeleteModal(): void {
    this.showDeleteModal = false;
    this.selectedUser = null;
  }

  confirmDelete(): void {
    if (!this.selectedUser) return;

    this.loading = true;
    this.usersService.deleteUser(this.selectedUser.id).subscribe({
      next: (response) => {
        this.toastService.success(response.message || 'Utilisateur supprimé avec succès');
        this.closeDeleteModal();
        this.loadUsers();
        this.loadStats();
        this.loading = false;
      },
      error: (error) => {
        console.error('Erreur lors de la suppression:', error);
        this.toastService.error(error.error?.message || 'Erreur lors de la suppression');
        this.loading = false;
      }
    });
  }

  // ==========================================
  // MODALS - DÉTAILS
  // ==========================================

  openDetailsModal(user: Utilisateur): void {
    this.selectedUser = user;
    this.showDetailsModal = true;
  }

  closeDetailsModal(): void {
    this.showDetailsModal = false;
    this.selectedUser = null;
  }

  // ==========================================
  // PAGINATION
  // ==========================================

  changePage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.loadUsers();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  getPageNumbers(): number[] {
    const pages: number[] = [];
    const maxVisible = 5;
    let start = Math.max(1, this.currentPage - Math.floor(maxVisible / 2));
    let end = Math.min(this.totalPages, start + maxVisible - 1);

    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  }

  // ==========================================
  // HELPERS
  // ==========================================

  getRoleBadgeClass(role: string): string {
    const colorMap: { [key: string]: string } = {
      'USER': 'user',
      'ADMIN': 'admin',
      'SUPERADMIN': 'superadmin'
    };
    return colorMap[role] || 'user';
  }

  getSexeIcon(sexe: string): string {
    return sexe === 'HOMME' ? '♂' : '♀';
  }

  getLangueFlag(langue: string): string {
    const flags: { [key: string]: string } = {
      'MALAGASY': '🇲🇬',
      'FRANCAIS': '🇫🇷',
      'ENGLISH': '🇬🇧',
      'MG': '🇲🇬',
      'FR': '🇫🇷',
      'EN': '🇬🇧'
    };
    return flags[langue] || '🌐';
  }

  getUserInitials(user: Utilisateur): string {
    const firstLetter = user.nomUtilisateur?.charAt(0)?.toUpperCase() || '';
    const secondLetter = user.prenomUtilisateur?.charAt(0)?.toUpperCase() || '';
    return `${firstLetter}${secondLetter}`;
  }

  get filteredUsers(): Utilisateur[] {
    return this.users;
  }
}