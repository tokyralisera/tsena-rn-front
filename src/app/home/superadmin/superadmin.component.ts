import { Component } from '@angular/core';
import { SidebarComponent } from "../../shared/components/sidebar/sidebar.component";
import { AdvertisementComponent } from "../../shared/components/advertisement/advertisement.component";
import { RouterModule } from "@angular/router";

@Component({
  selector: 'app-superadmin',
  standalone: true,
  imports: [ SidebarComponent, AdvertisementComponent, RouterModule],
  templateUrl: './superadmin.component.html',
  styleUrl: './superadmin.component.scss'
})
export class SuperadminComponent {

}
