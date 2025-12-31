import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { Recipe as RecipeModel, RecipeService } from '../services/recipe.service';
import { Review as ReviewModel, ReviewService } from '../services/review.service';

@Component({
  selector: 'app-review',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './review.html',
  styleUrl: './review.css',
})
export class ReviewComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  recipeId: string | null = null;
  recipe: RecipeModel | null = null;
  reviews: ReviewModel[] = [];
  currentUser: any = null;

  loading = false;
  error = '';

  // New Review Form
  rating = 5;
  komentar = '';
  submitLoading = false;
  submitError = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private recipeService: RecipeService,
    private reviewService: ReviewService,
    private authService: AuthService,
    private cdr: ChangeDetectorRef // <-- TAMBAHAN INI
  ) {}

  ngOnInit() {
    this.route.queryParams.pipe(takeUntil(this.destroy$)).subscribe((params) => {
      this.recipeId = params['recipeId'] || null;
      console.log('Recipe ID from query:', this.recipeId); // <-- DEBUG
      this.loadData();
    });

    this.loadCurrentUser();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadCurrentUser() {
    if (this.authService.isLoggedIn()) {
      this.authService
        .getProfile()
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response) => {
            if (response.success) {
              this.currentUser = response.data;
              this.cdr.detectChanges(); // <-- FORCE UPDATE
            }
          },
          error: (err) => console.error('Failed to load user:', err),
        });
    }
  }

  loadData() {
    this.loading = true;
    this.error = '';

    if (this.recipeId) {
      // Load specific recipe data
      this.recipeService
        .getRecipeById(this.recipeId)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (res) => {
            console.log('Recipe loaded:', res); // <-- DEBUG
            if (res.success) {
              this.recipe = res.data as RecipeModel;
              this.cdr.detectChanges(); // <-- FORCE UPDATE
            }
          },
          error: (err) => {
            console.error('Error loading recipe:', err);
            this.error = 'Failed to load recipe details';
            this.cdr.detectChanges();
          },
        });

      // Load Reviews for recipe
      this.reviewService
        .getReviews(this.recipeId)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (res) => {
            console.log('Reviews loaded:', res); // <-- DEBUG
            if (res.success) {
              this.reviews = Array.isArray(res.data)
                ? [...res.data]
                : res.data
                ? [res.data as ReviewModel]
                : [];
            }
            this.loading = false;
            this.cdr.detectChanges(); // <-- FORCE UPDATE
          },
          error: (err) => {
            console.error('Error loading reviews:', err);
            this.error = 'Failed to load reviews';
            this.loading = false;
            this.cdr.detectChanges();
          },
        });
    } else {
      // Load ALL reviews
      console.log('Loading all reviews...'); // <-- DEBUG
      this.reviewService
        .getAllReviews()
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (res) => {
            console.log('All reviews loaded:', res); // <-- DEBUG
            if (res.success) {
              this.reviews = Array.isArray(res.data)
                ? [...res.data]
                : res.data
                ? [res.data as ReviewModel]
                : [];
            }
            this.loading = false;
            this.cdr.detectChanges(); // <-- FORCE UPDATE
          },
          error: (err) => {
            console.error('Error loading all reviews:', err);
            this.error = 'Failed to load reviews';
            this.loading = false;
            this.cdr.detectChanges();
          },
        });
    }
  }

  submitReview() {
    if (!this.recipeId || !this.komentar.trim()) {
      this.submitError = 'Comment is required';
      return;
    }

    this.submitLoading = true;
    this.submitError = '';
    this.submitReviewAction();
  }

  private submitReviewAction() {
    this.reviewService
      .addReview(this.recipeId!, { rating: this.rating, komentar: this.komentar })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          if (res.success) {
            this.komentar = '';
            this.rating = 5;
            this.loadData(); // Refresh to get populated reviews
          } else {
            this.submitError = res.message || 'Failed to add review';
          }
          this.submitLoading = false;
          this.cdr.detectChanges(); // <-- FORCE UPDATE
        },
        error: (err) => {
          this.submitError = err.error?.message || 'Failed to add review';
          this.submitLoading = false;
          this.cdr.detectChanges();
        },
      });
  }

  deleteReview(reviewId: string) {
    if (!confirm('Are you sure you want to delete this review?')) return;

    this.reviewService
      .deleteReview(reviewId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          if (res.success) {
            this.loadData();
          }
        },
        error: (err) => {
          alert('Failed to delete review');
          console.error(err);
        },
      });
  }

  canDelete(review: ReviewModel): boolean {
    if (!this.currentUser) return false;
    if (this.currentUser.role === 'admin') return true;
    const userId = this.currentUser._id || this.currentUser.id;
    return review.user?._id === userId;
  }

  goBack() {
    this.router.navigate(['/recipe']);
  }

  getStars(rating: number): number[] {
    const r = Math.floor(rating || 0);
    return Array(r).fill(0);
  }

  getRecipeName(review: ReviewModel): string | null {
    if (review.resep && typeof review.resep === 'object' && 'nama' in review.resep) {
      return (review.resep as any).nama;
    }
    return null;
  }
}
