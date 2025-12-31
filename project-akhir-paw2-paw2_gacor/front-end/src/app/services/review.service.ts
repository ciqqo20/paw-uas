import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environment/environment';
export interface Review {
  _id: string;
  resep: string | { _id: string; nama: string; foto: string };
  user: {
    _id: string;
    nama: string;
  };
  rating: number;
  komentar: string;
  createdAt: string;
}

export interface ReviewResponse {
  success: boolean;
  count?: number;
  data: Review[] | Review;
  message?: string;
  error?: string;
}

@Injectable({
  providedIn: 'root',
})
export class ReviewService {
  // PERBAIKAN: Endpoint yang benar sesuai backend standard
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  // Get all reviews globally
  getAllReviews(): Observable<ReviewResponse> {
    // Endpoint: GET /api/reviews (harusnya plural)
    return this.http.get<ReviewResponse>(`${this.apiUrl}/reviews`);
  }

  // Get reviews for a specific recipe
  getReviews(recipeId: string): Observable<ReviewResponse> {
    // Endpoint: GET /api/recipes/:recipeId/reviews
    return this.http.get<ReviewResponse>(`${this.apiUrl}/recipes/${recipeId}/reviews`);
  }

  // Add a review
  addReview(
    recipeId: string,
    reviewData: { rating: number; komentar: string }
  ): Observable<ReviewResponse> {
    // Endpoint: POST /api/recipes/:recipeId/reviews
    return this.http.post<ReviewResponse>(`${this.apiUrl}/recipes/${recipeId}/reviews`, reviewData);
  }

  // Delete a review
  deleteReview(reviewId: string): Observable<ReviewResponse> {
    // Endpoint: DELETE /api/reviews/:reviewId
    return this.http.delete<ReviewResponse>(`${this.apiUrl}/reviews/${reviewId}`);
  }
}
