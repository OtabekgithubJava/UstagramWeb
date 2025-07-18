import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { User, UserDTO } from '../interfaces/user';
import { AuthServiceService } from './auth-service.service';

@Injectable({
  providedIn: 'root'
})
export class UserServiceService {
  private apiUrl = 'https://ustagramapi-3.onrender.com/api/User';

  constructor(private http: HttpClient, private authService: AuthServiceService) { }

  createUser(u: User): Observable<string> {
    return this.http.post<string>(`${this.apiUrl}CreateUser`, u);
  }

  updateUser(userId: string, user: FormData): Observable<string> {
    return this.http.put<string>(`${this.apiUrl}UpdateUser/${userId}`, user, {
      headers: new HttpHeaders({
        'Authorization': `Bearer ${this.authService.getToken()}`
      })
    });
  }

  deleteUser(id: string): Observable<string> {
    return this.http.delete<string>(`${this.apiUrl}DeleteUser?userId=${id}`);
  }

  getAllUsers(): Observable<User[]> {
    return this.http.get<User[]>(`${this.apiUrl}GetAllUsers`);
  }

  getUserByUsername(username: string): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}GetUserByUsername/${username}`);
  }

  getUserById(userId: string): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}GetUserById/${userId}`);
  }

  searchUsers(term: string): Observable<User[]> {
    return this.http.get<User[]>(`${this.apiUrl}SearchUsers/search?term=${term}`);
  }
}