import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Post, PostDTO } from '../interfaces/post';
import { AuthServiceService } from './auth-service.service';

@Injectable({
  providedIn: 'root'
})
export class PostServiceService {

  private apiUrl = 'https://ustagram.onrender.com/api/Post';

  constructor(private http: HttpClient, private authService: AuthServiceService) { }

  createPost(formData: FormData): Observable<string> {
    console.log('FormData contents:'); 
    formData.forEach((value, key) => {
      console.log(key, value);
    });

    return this.http.post<string>(`${this.apiUrl}CreatePost`, formData, {
      headers: new HttpHeaders({
        'Authorization': `Bearer ${this.authService.getToken()}`,
        'enctype': 'multipart/form-data' 
      })
    });
  }

  updatePost(id: string, formData: FormData): Observable<string> {
    return this.http.put<string>(`${this.apiUrl}UpdatePost/${id}`, formData, {
      headers: new HttpHeaders({
        'Authorization': `Bearer ${this.authService.getToken()}`
      })
    });
  }

  getPostById(id: string): Observable<Post> {
    return this.http.get<Post>(`${this.apiUrl}GetPostById/${id}`);
  }

  getPostAttachment(id: string): Observable<Blob> {
    return this.http.get(`${this.apiUrl}GetPostAttachment/${id}`, {
      responseType: 'blob'
    });
  }

  editPost(p: Post): Observable<string> {
    return this.http.put<string>(`${this.apiUrl}UpdatePost/${p.id}`, p);
  }

  deletePost(id: string): Observable<string> {
    return this.http.delete<string>(`${this.apiUrl}DeletePost/${id}`);
  }

  getAllPosts(): Observable<Post[]> {
    return this.http.get<Post[]>(`${this.apiUrl}GetAllPosts`);
  }

  getLastFive(): Observable<Post[]> {
    return this.http.get<Post[]>(`${this.apiUrl}GetPostsLastFive`);
  }

  getTopFive(): Observable<Post[]> {
    return this.http.get<Post[]>(`${this.apiUrl}GetPostsTopFive`);
  }

  getMyPost(): Observable<Post[]> {
    return this.http.get<Post[]>(`${this.apiUrl}GetPostByUser`);
  }

  getIshPosts(): Observable<Post[]> {
    return this.http.get<Post[]>(`${this.apiUrl}GetPostsIshCategory`);
  }

  getSotuvPosts(): Observable<Post[]> {
    return this.http.get<Post[]>(`${this.apiUrl}GetPostsSotuvCategory`);
  }

  getReklamaPosts(): Observable<Post[]> {
    return this.http.get<Post[]>(`${this.apiUrl}GetPostsReklamaCategory`);
  }

  getPostsByUserId(userId: string): Observable<Post[]> {
    return this.http.get<Post[]>(`${this.apiUrl}GetPostsByUserId/user/${userId}`);
  }
}