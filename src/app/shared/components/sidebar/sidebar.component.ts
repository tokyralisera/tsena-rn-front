import { Component, OnInit } from '@angular/core';
import { Utilisateur } from '../../interfaces/utilisateur.interface';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import {
  faBox,
  faChartLine,
  faCheckCircle,
  faChevronLeft,
  faInfoCircle,
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

  mainMenuItems: MenuItem[] = [
    {
      label: 'Offres',
      icon: faBox,
      route: '/offres',
      roles: ['USER', 'ADMIN']
    },
    {
      label: 'Demandes',
      icon: faQuestionCircle,
      route: '/demandes',
      roles: ['USER', 'ADMIN']
    },
    {
      label: 'Infos Utiles',
      icon: faInfoCircle,
      route: '/infos',
      roles: ['USER', 'ADMIN', 'SUPERADMIN']
    },
    {
      label: 'Logistiques',
      icon: faTruck,
      route: '/logistiques',
      roles: ['USER', 'ADMIN']
    },
    {
      label: 'Approbations',
      icon: faCheckCircle,
      route: '/approbations',
      roles: ['ADMIN', 'SUPERADMIN']
    },
    {
      label: 'Utilisateurs',
      icon: faUsers,
      route: '/utilisateurs',
      roles: ['SUPERADMIN']
    },
    {
      label: 'Dashboard',
      icon: faChartLine,
      route: '/dashboard',
      roles: ['ADMIN', 'SUPERADMIN']
    }
  ];

  bottomMenuItems: MenuItem[] = [
    {
      label: 'Mon Compte',
      icon: faUser,
      route: '/profile',
      roles: ['USER', 'ADMIN', 'SUPERADMIN']
    },
    {
      label: 'Déconnexion',
      icon: faSignOut,
      action: () => this.logout(), 
      roles: ['USER', 'ADMIN', 'SUPERADMIN']
    }
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
    this.authStateService.currentUser.subscribe(user => {
      this.currentUser = user;
      console.log('Current user in sidebar:', user);
    });
  }

  logout(): void {
    this.authService.logout();
    window.location.href = '/login';
  }

  filterMenuByRole(menuItems: MenuItem[]): MenuItem[] {
    const userRole = this.currentUser?.role;
    if (!userRole) {
      console.log('No user role found');
      return [];
    }
    console.log('Filtering for role:', userRole);
    return menuItems.filter(item => item.roles.includes(userRole));
  }
}