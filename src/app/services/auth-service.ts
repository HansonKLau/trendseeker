import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private loggedIn = false;
  private baseUrl = environment.apiUrl + '/auth';

  constructor(private http: HttpClient) { }

  login(): Observable<{ auth_url: string }> {
    return this.http.get<{ auth_url: string }>(`${this.baseUrl}/login`, { withCredentials: true });  
  }

  logout(): Observable<{ message: string }> {
    return this.http.get<{ message: string }>(`${this.baseUrl}/logout`, { withCredentials: true });
  }

  refreshTokens(): Observable<{ message: string }> {
    return this.http.get<{ message: string }>(`${this.baseUrl}/refresh-tokens`, { withCredentials: true });
  }

  isLoggedIn(): Observable<{ logged_in: boolean }> {
    return this.http.get<{ logged_in: boolean }>(`${this.baseUrl}/status`, { withCredentials: true });
  }

  setLoggedIn(status: boolean) {
    this.loggedIn = status;
  }

  getLoggedIn(): boolean {
    return this.loggedIn;
  }

}
