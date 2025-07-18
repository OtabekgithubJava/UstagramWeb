import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AuthServiceService } from './auth-service.service';
import { Favourite } from '../interfaces/favourite';

@Injectable({
  providedIn: 'root'
})
export class FavoritesService {
  private apiUrl = 'https://ustagramapi-3.onrender.com/api/Favourites';

  constructor(
    private http: HttpClient,
    private authService: AuthServiceService
  ) {}

  getFavoritesByUser() {
    return this.http.get<Favourite[]>(`${this.apiUrl}/GetFavourites`, { 
      headers: this.getAuthHeaders()
    });
  }

  createFavorite(postId: string) {
    return this.http.post(`${this.apiUrl}/CreateFavourite`, 
      { PostId: postId },
      {
        headers: this.getAuthHeaders()
      }
    );
  }

  deleteFavorite(favoriteId: string) {
    return this.http.delete(`${this.apiUrl}/DeleteFavourite/${favoriteId}`, {
      headers: this.getAuthHeaders()
    });
  }

  isPostFavorited(postId: string) {
    return this.http.get<boolean>(`${this.apiUrl}/check/${postId}`, {
      headers: this.getAuthHeaders()
    });
  }

  private getAuthHeaders() {
    return new HttpHeaders({
      'Authorization': `Bearer ${this.authService.getToken()}`,
      'Content-Type': 'application/json'
    });
  }
}