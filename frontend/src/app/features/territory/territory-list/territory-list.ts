import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TerritoryService } from '../../../core/territory/territory.service';

@Component({
  selector: 'app-territory-list',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './territory-list.html',
  styleUrl: './territory-list.scss'
})
export class TerritoryList implements OnInit {
  public territoryService = inject(TerritoryService);

  ngOnInit() {
    this.territoryService.fetchTerritories().subscribe();
  }

  viewDetails(territory: any) {
    alert(`Territory Details:\nName: ${territory.name}\nType: ${territory.type}\nID: ${territory.id}`);
  }

  onDelete(id: number) {
    if (confirm('Are you sure you want to delete this territory? This will remove all associated boundaries.')) {
      this.territoryService.deleteTerritory(id).subscribe({
        next: () => {
          this.territoryService.fetchTerritories().subscribe();
        },
        error: (err) => alert('Deletion failed: ' + err.message)
      });
    }
  }
}
