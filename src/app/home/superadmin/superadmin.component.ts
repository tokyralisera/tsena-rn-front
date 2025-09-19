import { Component } from '@angular/core';
import { HeaderComponent } from "../../shared/components/header/header.component";
import { SidebarComponent } from "../../shared/components/sidebar/sidebar.component";
import { AdvertisementComponent } from "../../shared/components/advertisement/advertisement.component";

@Component({
  selector: 'app-superadmin',
  standalone: true,
  imports: [HeaderComponent, SidebarComponent, AdvertisementComponent],
  templateUrl: './superadmin.component.html',
  styleUrl: './superadmin.component.scss'
})
export class SuperadminComponent {

}
