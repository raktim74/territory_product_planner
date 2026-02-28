import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ProductService } from '../../../core/product/product.service';
import { PricePlanner } from '../price-planner/price-planner';

@Component({
  selector: 'app-product-catalog',
  standalone: true,
  imports: [CommonModule, RouterModule, PricePlanner],
  templateUrl: './product-catalog.html',
  styleUrl: './product-catalog.scss',
})
export class ProductCatalog implements OnInit {
  public productService = inject(ProductService);
  public selectedProduct = signal<any>(null);

  ngOnInit(): void {
    this.productService.fetchProducts().subscribe();
  }

  viewDetails(product: any) {
    this.selectedProduct.set(product);
  }

  onDelete(id: number) {
    if (confirm('Are you sure you want to delete this product?')) {
      this.productService.deleteProduct(id).subscribe({
        next: () => {
          this.productService.fetchProducts().subscribe();
        },
        error: (err) => alert('Deletion failed: ' + err.message)
      });
    }
  }
}
