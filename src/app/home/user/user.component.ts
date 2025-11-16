import { Component } from '@angular/core';

import { SidebarComponent } from "../../shared/components/sidebar/sidebar.component";
import { AdvertisementComponent } from "../../shared/components/advertisement/advertisement.component";
import { RouterModule } from "@angular/router";

@Component({
  selector: 'app-user',
  standalone: true,
  imports: [SidebarComponent, AdvertisementComponent, RouterModule],
  templateUrl: './user.component.html',
  styleUrl: './user.component.scss'
})
export class UserComponent {

}
