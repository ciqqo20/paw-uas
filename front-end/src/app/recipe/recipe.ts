import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import {
  FormArray,
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { AuthService } from '../services/auth.service';
import { Recipe as RecipeModel, RecipeService } from '../services/recipe.service';
import { Review, ReviewService } from '../services/review.service';

@Component({
  selector: 'app-recipe',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './recipe.html',
  styleUrl: './recipe.css',
})
export class Recipe implements OnInit {
  recipes: RecipeModel[] = [];
  loading = false;
  error = '';
  searchTerm = '';
  currentUser: any = null;

  // Filters
  selectedCategory = '';
  selectedDifficulty = '';

  // Create Modal State
  showCreateModal = false;
  recipeForm: FormGroup;
  selectedFile: File | null = null;
  submitLoading = false;
  submitError = '';

  // Detail Modal State
  showDetailModal = false;
  selectedRecipe: RecipeModel | null = null;
  deleteLoading = false;

  // Review State
  reviews: Review[] = [];
  reviewsLoading = false;
  reviewRating = 5;
  reviewComment = '';
  submitReviewLoading = false;
  submitReviewError = '';

  constructor(
    private recipeService: RecipeService,
    private authService: AuthService,
    private fb: FormBuilder,
    private reviewService: ReviewService,
    private cdr: ChangeDetectorRef // <-- TAMBAHAN INI!
  ) {
    this.recipeForm = this.fb.group({
      nama: ['', Validators.required],
      waktuMasak: ['', [Validators.required, Validators.min(1)]],
      porsi: ['', [Validators.required, Validators.min(1)]],
      kategori: ['utama', Validators.required],
      tingkatKesulitan: ['sedang', Validators.required],
      bahan: this.fb.array([this.fb.control('', Validators.required)]),
      langkah: this.fb.array([this.fb.control('', Validators.required)]),
    });
  }

  ngOnInit() {
    this.loadCurrentUser();
    this.loadRecipes();
  }

  loadCurrentUser() {
    if (this.authService.isLoggedIn()) {
      this.authService.getProfile().subscribe({
        next: (response) => {
          if (response.success) {
            this.currentUser = response.data;
            this.cdr.detectChanges(); // <-- FORCE UPDATE
          }
        },
        error: (err) => console.error('Failed to load user profile', err),
      });
    }
  }

  // Getters for FormArrays
  get bahanArray() {
    return this.recipeForm.get('bahan') as FormArray;
  }

  get langkahArray() {
    return this.recipeForm.get('langkah') as FormArray;
  }

  // Add/Remove methods
  addBahan() {
    this.bahanArray.push(this.fb.control('', Validators.required));
  }

  removeBahan(index: number) {
    this.bahanArray.removeAt(index);
  }

  addLangkah() {
    this.langkahArray.push(this.fb.control('', Validators.required));
  }

  removeLangkah(index: number) {
    this.langkahArray.removeAt(index);
  }

  // File handling
  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
    }
  }

  // Modal toggling
  openCreateModal() {
    this.showCreateModal = true;
  }

  closeCreateModal() {
    this.showCreateModal = false;
    this.recipeForm.reset({
      kategori: 'utama',
      tingkatKesulitan: 'sedang',
    });
    // Reset arrays to have 1 empty control
    while (this.bahanArray.length !== 0) {
      this.bahanArray.removeAt(0);
    }
    this.bahanArray.push(this.fb.control('', Validators.required));

    while (this.langkahArray.length !== 0) {
      this.langkahArray.removeAt(0);
    }
    this.langkahArray.push(this.fb.control('', Validators.required));

    this.selectedFile = null;
    this.submitError = '';
  }

  openDetailModal(recipe: RecipeModel) {
    this.selectedRecipe = recipe;
    this.showDetailModal = true;
    this.loadReviews(recipe._id);
    this.cdr.detectChanges(); // <-- FORCE UPDATE
  }

  closeDetailModal() {
    this.showDetailModal = false;
    this.selectedRecipe = null;
    this.reviews = [];
  }

  loadRecipes() {
    this.loading = true;
    this.error = '';

    const params: any = {};
    if (this.selectedCategory) params.kategori = this.selectedCategory;
    if (this.selectedDifficulty) params.tingkatKesulitan = this.selectedDifficulty;

    this.recipeService.getAllRecipes(params).subscribe({
      next: (response) => {
        console.log('API Response:', response); // <-- DEBUG LOG

        if (response.success) {
          let data = Array.isArray(response.data) ? response.data : [response.data];

          // Client-side filtering for search term
          if (this.searchTerm.trim()) {
            const term = this.searchTerm.toLowerCase();
            data = data.filter(
              (r) =>
                r.nama.toLowerCase().includes(term) ||
                (r.bahan && r.bahan.some((b) => b.toLowerCase().includes(term)))
            );
          }

          // PERBAIKAN: Force new array reference
          this.recipes = [...data];
          console.log('Recipes set:', this.recipes.length); // <-- DEBUG LOG
        } else {
          this.error = response.message || 'Failed to load recipes';
        }

        this.loading = false;
        this.cdr.detectChanges(); // <-- FORCE UPDATE UI
      },
      error: (err) => {
        console.error('Error loading recipes:', err);
        this.error = 'An error occurred while connecting to the server.';
        this.loading = false;
        this.cdr.detectChanges(); // <-- FORCE UPDATE
      },
    });
  }

  loadReviews(recipeId: string) {
    this.reviewsLoading = true;
    this.reviewService.getReviews(recipeId).subscribe({
      next: (res) => {
        if (res.success) {
          this.reviews = Array.isArray(res.data) ? [...res.data] : [res.data];
        }
        this.reviewsLoading = false;
        this.cdr.detectChanges(); // <-- FORCE UPDATE
      },
      error: () => {
        this.reviewsLoading = false;
        this.cdr.detectChanges();
      },
    });
  }

  submitReview() {
    if (!this.selectedRecipe) return;
    if (!this.reviewComment.trim()) {
      this.submitReviewError = 'Comment is required';
      return;
    }

    this.submitReviewLoading = true;
    this.submitReviewError = '';

    this.reviewService
      .addReview(this.selectedRecipe._id, {
        rating: this.reviewRating,
        komentar: this.reviewComment,
      })
      .subscribe({
        next: (res) => {
          if (res.success) {
            this.reviewComment = '';
            this.reviewRating = 5;
            this.loadReviews(this.selectedRecipe!._id);
            this.loadRecipes(); // To update grid stats
          } else {
            this.submitReviewError = res.message || 'Failed to add review';
          }
          this.submitReviewLoading = false;
          this.cdr.detectChanges(); // <-- FORCE UPDATE
        },
        error: (err) => {
          this.submitReviewError = err.error?.message || 'Failed to add review';
          this.submitReviewLoading = false;
          this.cdr.detectChanges();
        },
      });
  }

  deleteReview(reviewId: string) {
    if (!confirm('Are you sure you want to delete this review?')) return;
    this.reviewService.deleteReview(reviewId).subscribe({
      next: (res) => {
        if (res.success && this.selectedRecipe) {
          this.loadReviews(this.selectedRecipe._id);
          this.loadRecipes(); // Update grid stats
        }
      },
      error: () => alert('Failed to delete review'),
    });
  }

  canDeleteReview(review: Review): boolean {
    if (!this.currentUser) return false;
    if (this.currentUser.role === 'admin') return true;
    return review.user._id === this.currentUser._id || review.user._id === this.currentUser.id;
  }

  getStars(rating: number): number[] {
    return Array(rating).fill(0);
  }

  onFilterChange() {
    this.loadRecipes();
  }

  onSearch() {
    this.loadRecipes();
  }

  onSubmit() {
    if (this.recipeForm.invalid || !this.selectedFile) {
      this.submitError = 'Please fill all required fields and upload a photo.';
      return;
    }

    this.submitLoading = true;
    this.submitError = '';

    const formData = new FormData();
    const formValue = this.recipeForm.value;

    formData.append('nama', formValue.nama);
    formData.append('waktuMasak', formValue.waktuMasak);
    formData.append('porsi', formValue.porsi);
    formData.append('kategori', formValue.kategori);
    formData.append('tingkatKesulitan', formValue.tingkatKesulitan);
    formData.append('foto', this.selectedFile);

    // Backend expects JSON strings for arrays
    formData.append('bahan', JSON.stringify(formValue.bahan));
    formData.append('langkah', JSON.stringify(formValue.langkah));

    this.recipeService.createRecipe(formData).subscribe({
      next: (response) => {
        if (response.success) {
          this.closeCreateModal();
          this.loadRecipes(); // Refresh list
        } else {
          this.submitError = response.message || 'Failed to create recipe';
        }
        this.submitLoading = false;
        this.cdr.detectChanges(); // <-- FORCE UPDATE
      },
      error: (err) => {
        console.error('Error creating recipe:', err);
        this.submitError = err.error?.message || 'An error occurred during creation.';
        this.submitLoading = false;
        this.cdr.detectChanges();
      },
    });
  }

  canDelete(recipe: RecipeModel): boolean {
    if (!this.currentUser) return false;
    if (this.currentUser.role === 'admin') return true;
    // Check if createdBy is object (populated) or string (id)
    const creatorId =
      typeof recipe.createdBy === 'object' ? recipe.createdBy?._id : recipe.createdBy;
    return creatorId === this.currentUser._id || creatorId === this.currentUser.id;
  }

  deleteRecipe() {
    if (!this.selectedRecipe) return;

    if (!confirm('Are you sure you want to delete this recipe?')) return;

    this.deleteLoading = true;
    this.recipeService.deleteRecipe(this.selectedRecipe._id).subscribe({
      next: (response) => {
        if (response.success) {
          this.closeDetailModal();
          this.loadRecipes();
        }
        this.deleteLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error deleting recipe:', err);
        alert('Failed to delete recipe');
        this.deleteLoading = false;
        this.cdr.detectChanges();
      },
    });
  }
}
