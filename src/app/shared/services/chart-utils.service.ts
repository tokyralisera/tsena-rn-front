import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class ChartUtilsService {
  /**
   * Générer des couleurs pour les graphiques
   */
  generateColors(count: number): string[] {
    const colors = [
      '#5733eb', // Violet (primary)
      '#3b82f6', // Bleu
      '#10b981', // Vert
      '#f59e0b', // Jaune
      '#ef4444', // Rouge
      '#8b5cf6', // Purple
      '#ec4899', // Pink
      '#06b6d4', // Cyan
      '#14b8a6', // Teal
      '#f97316', // Orange
    ];

    if (count <= colors.length) {
      return colors.slice(0, count);
    }

    const extendedColors = [...colors];
    while (extendedColors.length < count) {
      extendedColors.push(this.generateRandomColor());
    }

    return extendedColors;
  }

  /**
   * Générer une couleur aléatoire
   */
  private generateRandomColor(): string {
    const hue = Math.floor(Math.random() * 360);
    return `hsl(${hue}, 70%, 60%)`;
  }

  /**
   * Calculer le pourcentage
   */
  calculatePercentage(value: number, total: number): number {
    if (total === 0) return 0;
    return (value / total) * 100;
  }
}