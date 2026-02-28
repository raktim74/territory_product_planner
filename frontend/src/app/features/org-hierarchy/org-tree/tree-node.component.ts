import { Component, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OrgTreeNode, HierarchyService } from '../../../core/hierarchy/hierarchy.service';
import { TerritoryService } from '../../../core/territory/territory.service';

@Component({
  selector: 'app-tree-node',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="tree-branch">
      <!-- Node Card -->
      <div class="node-card" [class]="(node.user.role?.name || 'user').toLowerCase()">
        <div class="card-glow"></div>
        <div class="card-content">
          <div class="user-identity">
            <div class="avatar-wrap">
              <div class="avatar">{{ getInitials(node.user.email) }}</div>
              <div class="status-pip"></div>
            </div>
            <div class="text-info">
              <span class="email" [title]="node.user.email">{{ node.user.email }}</span>
              <span class="role-caption">{{ formatRole(node.user.role?.name) }}</span>
            </div>
          </div>

          <!-- Sales Org Hierarchy Mapping Section -->
          <div class="territories-section">
            <span class="section-label">Sales Org Mapping (Areas)</span>
            <div class="territory-tags">
                <span class="territory-tag" *ngFor="let t of node.user.territories">
                    {{ t.name }}
                    <button class="remove-tag" (click)="removeTerritory(t.id)" title="Unmap area">×</button>
                </span>
                <div *ngIf="node.user.territories.length === 0" class="no-areas">No areas mapped</div>
            </div>
            
            <div class="mapping-actions" *ngIf="!showAddArea">
                 <button class="map-action-btn" (click)="toggleAddArea()">+ Map Area</button>
            </div>
            
            <div class="add-area-selector" *ngIf="showAddArea">
                <select (change)="onAreaSelected($event)">
                    <option value="">Select Area...</option>
                    <option *ngFor="let t of availableTerritories()" [value]="t.id">
                        {{ t.name }} ({{ t.type }})
                    </option>
                </select>
                <div class="mini-actions">
                    <button class="btn-cancel-mini" (click)="toggleAddArea()">Cancel</button>
                </div>
            </div>
          </div>
          
          <div class="card-footer">
            <div class="stat">
              <span class="label">Teams</span>
              <span class="val">{{ node.children?.length || 0 }}</span>
            </div>
             <div class="stat">
              <span class="label">Reach</span>
              <span class="val">{{ getTotalDirectReports(node) }}</span>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Connectors and Children -->
      <div class="subtree" *ngIf="node.children && node.children.length > 0">
        <div class="vertical-line"></div>
        <div class="children-grid">
          <app-tree-node *ngFor="let child of node.children" [node]="child"></app-tree-node>
        </div>
      </div>
    </div>
  `,
  styleUrl: './org-tree.scss'
})
export class TreeNodeComponent {
  @Input() node!: OrgTreeNode;
  public territoryService = inject(TerritoryService);
  private hierarchyService = inject(HierarchyService);

  showAddArea = false;

  availableTerritories() {
    const assignedIds = this.node.user.territories.map(t => t.id);
    return this.territoryService.territories().filter(t => !assignedIds.includes(t.id));
  }

  toggleAddArea() {
    this.showAddArea = !this.showAddArea;
    if (this.showAddArea && this.territoryService.territories().length === 0) {
      this.territoryService.fetchTerritories().subscribe();
    }
  }

  onAreaSelected(event: any) {
    const id = event.target.value;
    if (!id) return;

    this.territoryService.assignUserToTerritory(this.node.user.id, Number(id)).subscribe({
      next: () => {
        this.showAddArea = false;
        // Trigger a full tree refresh to show new mapping
        this.hierarchyService.fetchTree().subscribe();
      }
    });
  }

  removeTerritory(id: number) {
    this.territoryService.revokeTerritory(id).subscribe({
      next: () => {
        this.hierarchyService.fetchTree().subscribe();
      }
    });
  }

  getInitials(email: string): string {
    if (!email) return 'U';
    return email.substring(0, 2).toUpperCase();
  }

  formatRole(role?: string): string {
    if (!role) return 'Standard Field Agent';
    return role.split('_').join(' ').toLowerCase();
  }

  getTotalDirectReports(node: OrgTreeNode): number {
    if (!node.children) return 0;
    let count = node.children.length;
    node.children.forEach(child => {
      if (child.children) count += child.children.length;
    });
    return count;
  }
}
