import { Component, OnInit } from '@angular/core';
import { Utilisateur } from '../../interfaces/utilisateur.interface';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import {
  faBarChart,
  faBox,
  faChartLine,
  faCheckCircle,
  faChevronLeft,
  faInfoCircle,
  faLocation,
  faLocationDot,
  faQuestionCircle,
  faSignOut,
  faSignOutAlt,
  faTruck,
  faUser,
  faUsers,
} from '@fortawesome/free-solid-svg-icons';
import { AuthStateService } from '../../../auth/auth-state.service';
import { AuthService } from '../../../auth/auth.service';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

export interface MenuItem {
  label: string;
  icon: any;
  route?: string;
  action?: () => void;
  roles: Array<'USER' | 'ADMIN' | 'SUPERADMIN'>;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [FontAwesomeModule, CommonModule, RouterModule],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss',
})
export class SidebarComponent implements OnInit {
  currentUser: Utilisateur | null = null;

  // Icônes Font Awesome
  faBox = faBox;
  faQuestionCircle = faQuestionCircle;
  faInfoCircle = faInfoCircle;
  faTruck = faTruck;
  faCheckCircle = faCheckCircle;
  faUsers = faUsers;
  faChartLine = faChartLine;
  faUser = faUser;
  faSignOutAlt = faSignOutAlt;
  faChevronLeft = faChevronLeft;
  faSignOut = faSignOut;

  //!Ne pas mettre le / dans la variable route des menu items

  mainMenuItems: MenuItem[] = [
    {
      label: 'Offres',
      icon: faBox,
      route: 'offres',
      roles: ['USER', 'ADMIN'],
    },
    {
      label: 'Demandes',
      icon: faQuestionCircle,
      route: 'demandes',
      roles: ['USER', 'ADMIN'],
    },
    {
      label: 'Informations/Actualités',
      icon: faInfoCircle,
      route: 'infos',
      roles: ['USER'],
    },
    {
      label: 'Informations/Actualités',
      icon: faInfoCircle,
      route: 'infos-creation',
      roles: ['ADMIN', 'SUPERADMIN'],
    },
    {
      label: 'Approbations Offres',
      icon: faCheckCircle,
      route: 'approbations-offres',
      roles: ['ADMIN', 'SUPERADMIN'],
    },
        {
      label: 'Approbations Demandes',
      icon: faCheckCircle,
      route: 'approbations-demandes',
      roles: ['ADMIN', 'SUPERADMIN'],
    },
    {
      label: 'Categories',
      icon: faBarChart,
      route: 'category',
      roles: ['ADMIN', 'SUPERADMIN'],
    },
      {
      label: 'Pays',
      icon: faLocation,
      route: 'pays',
      roles: ['ADMIN', 'SUPERADMIN'],
    },
          {
      label: 'Villes',
      icon: faLocationDot,
      route: 'villes',
      roles: ['ADMIN', 'SUPERADMIN'],
    },
    {
      label: 'Utilisateurs',
      icon: faUsers,
      route: '/utilisateurs',
      roles: ['SUPERADMIN'],
    },
    {
      label: 'Dashboard',
      icon: faChartLine,
      route: '/dashboard',
      roles: ['ADMIN', 'SUPERADMIN'],
    },
  ];

  bottomMenuItems: MenuItem[] = [
    {
      label: 'Mon Compte',
      icon: faUser,
      route: '', // sera défini dynamiquement
      roles: ['USER', 'ADMIN', 'SUPERADMIN'],
    },
    {
      label: 'Déconnexion',
      icon: faSignOut,
      action: () => this.logout(),
      roles: ['USER', 'ADMIN', 'SUPERADMIN'],
    },
  ];

  constructor(
    private authStateService: AuthStateService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    // Initialiser le currentUser depuis le localStorage
    const userData = localStorage.getItem('user_data');
    if (userData) {
      this.currentUser = JSON.parse(userData);
    }

    // S'abonner aux changements
    this.authStateService.currentUser.subscribe((user) => {
      this.currentUser = user;
      console.log('Current user in sidebar:', user);
      if (user) {
        // Route dynamique selon le rôle
        this.bottomMenuItems[0].route = `/home/${user.role.toLowerCase()}/profile`;
      }
    });
  }

  logout(): void {
    this.authService.logout();
    window.location.href = '/login';
  }

  filterMenuByRole(menuItems: MenuItem[]): MenuItem[] {
    const userRole = this.currentUser?.role;
    if (!userRole) {
      return [];
    }
    return menuItems.filter((item) => item.roles.includes(userRole));
  }
}
