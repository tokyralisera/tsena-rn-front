import { CommonModule } from '@angular/common';
import { Component, signal } from '@angular/core';
import { RouterModule } from '@angular/router';

interface Partner {
  id: string;
  name: string;
  description: string;
  logo: string;
  bgColor: string;
  website?: string;
}

interface Advertisement {
  id: string;
  title: string;
  description: string;
  ctaText: string;
  ctaLink: string;
  gradient: string;
}

@Component({
  selector: 'app-advertisement',
  standalone: true,
  imports: [RouterModule, CommonModule],
  templateUrl: './advertisement.component.html',
  styleUrl: './advertisement.component.scss'
})
export class AdvertisementComponent {
  partners = signal<Partner[]>([
    {
      id: 'mtp',
      name: 'MTP',
      description: 'Ministère des Travaux Publics',
      logo: '/assets/partners/mtp.png',
      bgColor: 'bg-emerald-100',
      website: 'https://mtp.gov.mg'
    },
    {
      id: 'meteo',
      name: 'Météo Madda',
      description: 'Branche Météorologique',
      logo: '/assets/partners/meteo.png',
      bgColor: 'bg-emerald-100',
      website: 'https://www.meteomadagascar.mg/'
    }
  ]);


  onPartnerClick(partner: Partner): void {
    if (partner.website) {
      window.open(partner.website, '_blank', 'noopener,noreferrer');
    }
  }

  onImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.src = '/assets/default-partner.svg';
  }
}