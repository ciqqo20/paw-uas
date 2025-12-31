import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environment/environment';

export interface Recipe {
  _id: string;
  nama: string;
  foto: string;
  bahan: string[];
  langkah: string[];
  waktuMasak: number;
  porsi: number;
  kategori: string;
  tingkatKesulitan: string;
  createdBy?: any;
  createdAt?: string;
  updatedAt?: string;
  averageRating?: number;
  totalReviews?: number;
}

export interface RecipeResponse {
  success: boolean;
  count?: number;
  pagination?: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    limit: number;
  };
  data: Recipe[] | Recipe;
  message?: string;
  error?: string;
}

@Injectable({
  providedIn: 'root',
})
export class RecipeService {
  private apiUrl = `${environment.apiUrl}/recipes`;

  constructor(private http: HttpClient) {}

  // Get all recipes with optional filtering
  getAllRecipes(params?: {
    kategori?: string;
    tingkatKesulitan?: string;
    page?: number;
    limit?: number;
  }): Observable<RecipeResponse> {
    let httpParams = new HttpParams();

    if (params) {
      if (params.kategori) httpParams = httpParams.set('kategori', params.kategori);
      if (params.tingkatKesulitan)
        httpParams = httpParams.set('tingkatKesulitan', params.tingkatKesulitan);
      if (params.page) httpParams = httpParams.set('page', params.page.toString());
      if (params.limit) httpParams = httpParams.set('limit', params.limit.toString());
    }

    return this.http.get<RecipeResponse>(this.apiUrl, { params: httpParams });
  }

  // Get single recipe by ID
  getRecipeById(id: string): Observable<RecipeResponse> {
    return this.http.get<RecipeResponse>(`${this.apiUrl}/${id}`);
  }

  // Get my recipes (protected)
  getMyRecipes(): Observable<RecipeResponse> {
    // Auth interceptor should handle the token
    return this.http.get<RecipeResponse>(`${this.apiUrl}/my-recipes`);
  }

  // Create recipe (protected, multipart/form-data)
  createRecipe(recipeData: FormData): Observable<RecipeResponse> {
    return this.http.post<RecipeResponse>(this.apiUrl, recipeData);
  }

  // Update recipe (protected, multipart/form-data)
  updateRecipe(id: string, recipeData: FormData): Observable<RecipeResponse> {
    return this.http.put<RecipeResponse>(`${this.apiUrl}/${id}`, recipeData);
  }

  // Delete recipe (protected)
  deleteRecipe(id: string): Observable<RecipeResponse> {
    return this.http.delete<RecipeResponse>(`${this.apiUrl}/${id}`);
  }
}
