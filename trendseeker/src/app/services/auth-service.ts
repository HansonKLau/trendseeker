import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private baseUrl = environment.apiUrl + '/auth';

  constructor(private http: HttpClient) { }

  login(): Observable<{ auth_url: string }> {
    return this.http.get<{ auth_url: string }>(`${this.baseUrl}/login`);  
  }

}
