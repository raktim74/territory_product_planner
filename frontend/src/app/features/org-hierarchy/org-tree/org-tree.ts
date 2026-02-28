import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HierarchyService } from '../../../core/hierarchy/hierarchy.service';
import { TreeNodeComponent } from './tree-node.component';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-org-tree',
  standalone: true,
  imports: [CommonModule, TreeNodeComponent, RouterModule],
  templateUrl: './org-tree.html',
  styleUrl: './org-tree.scss'
})
export class OrgTree implements OnInit {
  public hierarchyService = inject(HierarchyService);

  errorMsg = '';

  ngOnInit() {
    this.hierarchyService.fetchTree().subscribe({
      error: (err) => {
        this.errorMsg = 'Failed to load organization hierarchy';
      }
    });
  }
}
