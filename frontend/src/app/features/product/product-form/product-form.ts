import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { ProductService } from '../../../core/product/product.service';

@Component({
  selector: 'app-product-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  template: `
    <div class="form-page">
      <div class="form-header">
        <button class="back-link" routerLink="/products">← Back to Catalog</button>
        <h2>{{ isEdit ? 'Update Product' : 'Release Product' }}</h2>
        <p>{{ isEdit ? 'Revise the product specifications and pricing.' : 'Introduce a new SKU to the marketplace architecture.' }}</p>
      </div>

      <div class="premium-card">
        <form [formGroup]="productForm" (ngSubmit)="onSubmit()">
          <div class="form-grid">
            <div class="form-group full">
              <label>Inventory Item Name</label>
              <input type="text" formControlName="name" placeholder="e.g. Ultra-Light Laptop Pro">
            </div>

            <div class="form-group">
              <label>Global SKU</label>
              <input type="text" formControlName="sku" placeholder="SKU-882-X" [readonly]="isEdit">
            </div>

            <div class="form-group">
              <label>Base MSRP (USD)</label>
              <input type="number" formControlName="base_price" placeholder="1299.99">
            </div>

            <div class="form-group">
              <label>Classification Category</label>
              <input type="text" formControlName="category" placeholder="e.g. Computing">
            </div>

            <div class="form-group full">
              <label>Deployment Specification (Description)</label>
              <textarea formControlName="description" rows="4" placeholder="Detailed product specs..."></textarea>
            </div>
          </div>

          <div class="form-footer">
            <button type="button" class="btn-secondary" routerLink="/products">Abort</button>
            <button type="submit" class="btn-primary" [disabled]="productForm.invalid">
              {{ isEdit ? 'Save Changes' : 'Commit to Catalog' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .form-page { padding: 60px; max-width: 900px; margin: 0 auto; }
    .form-header { margin-bottom: 40px; }
    .back-link { background: none; border: none; color: #3b82f6; cursor: pointer; padding: 0; margin-bottom: 16px; font-weight: 600; }
    h2 { font-size: 2rem; color: #fff; margin-bottom: 8px; }
    
    .premium-card { 
      background: #1e293b; padding: 40px; border-radius: 24px; 
      border: 1px solid rgba(255,255,255,0.05);
      box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5);
    }

    .form-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; }
    .form-group.full { grid-column: span 3; }

    .form-footer { 
      display: flex; gap: 16px; justify-content: flex-end; 
      margin-top: 40px; padding-top: 30px; border-top: 1px solid rgba(255,255,255,0.05);
    }
  `]
})
export class ProductForm implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private productService = inject(ProductService);

  isEdit = false;
  productId?: number;

  productForm: FormGroup = this.fb.group({
    name: ['', Validators.required],
    sku: ['', Validators.required],
    base_price: [0, [Validators.required, Validators.min(0)]],
    category: [''],
    description: ['']
  });

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEdit = true;
      this.productId = +id;
      this.productService.getProduct(this.productId).subscribe({
        next: (p) => {
          this.productForm.patchValue(p);
        }
      });
    }
  }

  onSubmit() {
    if (this.productForm.invalid) return;

    if (this.isEdit && this.productId) {
      this.productService.updateProduct(this.productId, this.productForm.value).subscribe({
        next: () => this.router.navigate(['/products']),
        error: (err) => alert('Product update failed: ' + err.message)
      });
    } else {
      this.productService.createProduct(this.productForm.value).subscribe({
        next: () => this.router.navigate(['/products']),
        error: (err) => alert('Product commit failed: ' + err.message)
      });
    }
  }
}
