import { Component } from '@angular/core';
import { SidebarComponent } from "../../shared/components/sidebar/sidebar.component";
import { AdvertisementComponent } from "../../shared/components/advertisement/advertisement.component";
import { RouterModule, RouterOutlet } from "@angular/router";

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [ SidebarComponent, AdvertisementComponent, RouterModule],
  templateUrl: './admin.component.html',
  styleUrl: './admin.component.scss'
})
export class AdminComponent {

}
