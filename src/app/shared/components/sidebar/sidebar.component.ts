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

export interface MenuItem {
  label: string;
  icon: any;
  route: string;
  role: Array<'USER' | 'ADMIN' | 'SUPERADMIN'>;
}
@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss',
})
export class SidebarComponent implements OnInit {
  currentUser: Utilisateur | null = null;
  isExpanded = true;

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

  mainMenuItems: MenuItem[] = [
    {
      label: 'Offres',
      icon: faBox,
      route: '/offres',
      role: ['USER', 'ADMIN'],
    },
    {
      label: 'Demandes',
      icon: faQuestionCircle,
      route: '/demandes',
      role: ['USER', 'ADMIN'],
    },
    {
      label: 'Infos Utiles',
      icon: faInfoCircle,
      route: '/infos',
      role: ['USER', 'ADMIN'],
    },
    {
      label: 'Logistiques',
      icon: faTruck,
      route: '/logistiques',
      role: ['USER', 'ADMIN'],
    },
    {
      label: 'Utilisateurs',
      icon: faUsers,
      route: '/utilisateurs',
      role: ['ADMIN', 'SUPERADMIN'],
    },
    {
      label: 'Dashboard',
      icon: faChartLine,
      route: '/offres',
      role: ['ADMIN', 'SUPERADMIN'],
    },
  ];

  bottomMenuItems: MenuItem[] = [
    {
      label: 'Mon Compte',
      icon: faUser,
      route: '/profile',
      role: ['USER', 'ADMIN', 'SUPERADMIN'],
    },
        {
      label: 'Déconnexion',
      icon: faSignOut,
      route: '/logout',
      role: ['USER', 'ADMIN', 'SUPERADMIN'],
    },
  ];

  constructor(private authStateService: AuthStateService, private authService: AuthService){}

  ngOnInit(): void {
    this.authStateService.currentUser.subscribe(user => {
      this.currentUser = user;
    })
  }

  logout(): void {
    this.authService.logout();
    window.location.href = '/login'
  }

  filterMenuByRole(menuItems: MenuItem[]): MenuItem[] {
    if (!this.currentUser) return [];
    return menuItems.filter(item => item.role.includes(this.currentUser!.role));
  }

  isMenuItemVisible(menuItem: MenuItem): boolean {
    if (!this.currentUser) return false;
    return menuItem.role.includes(this.currentUser.role);
  }
}
