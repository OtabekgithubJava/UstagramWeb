import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { UserDTO } from '../interfaces/user';
import { Route, Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AuthServiceService {
  private apiUrl = 'https://ustagramapis.onrender.com/api/Auth';

  constructor(private http: HttpClient, private router: Router) {}

  private handleError(error: any) {
    // console.error('Auth error:', error);
    let errorMsg = error.error?.error || error.message || 'An unexpected error occurred';
    if (error.error?.details) {
      errorMsg = error.error.details.join('; ');
    }
    if (error.status === 0) {
      errorMsg = 'Network error: Could not connect to server';
    }
    return throwError(() => new Error(errorMsg));
  }

  signup(formData: FormData): Observable<any> {
    // console.log('FormData contents:');
    // for (let pair of (formData as any).entries()) {
    //     console.log(pair[0] + ', ' + pair[1]);
    // }

    const username = formData.get('username');
    const phone = formData.get('phone');
    
    if (!username || !phone) {
      return throwError(() => new Error('Username va telefon raqam talab qilinadi'));
    }

    return this.http.post(`${this.apiUrl}/signup`, formData, {
      headers: new HttpHeaders({
            'enctype': 'multipart/form-data'
        })
    }).pipe(
      tap((response: any) => {
        if (response.token) {
          localStorage.setItem('token', response.token);
        }
      }),
      catchError(error => {
      if (error.status === 409) {  
        return throwError(() => new Error('Bunday foydalanuvchi allaqachon mavjud!'));
      }
      return throwError(() => error);
    })
    );
  }

  login(username: string, password: string): Observable<any> {
    const formData = new FormData();
    formData.append('username', username);
    formData.append('password', password);

    return this.http.post(`${this.apiUrl}/login`, formData).pipe(
      tap((response: any) => {
        if (response.token) {
          localStorage.setItem('token', response.token);
          localStorage.setItem('currentUser', JSON.stringify(response.user));
        }
      }),
      catchError(error => {
        let errorMessage = 'Invalid username or password';
        if (error.error?.error) {
          errorMessage = error.error.error;
        }
        return throwError(() => new Error(errorMessage));
      })
    );
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  getCurrentUser(): any {
    const user = localStorage.getItem('currentUser');
    return user ? JSON.parse(user) : null;
  }

  getCurrentUserId(): string | null {
    const user = this.getCurrentUser();
    return user?.id || null;
  }

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('currentUser');
    this.router.navigate(['/login']);
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }
}