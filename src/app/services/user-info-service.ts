import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { AccountResponse } from '../models/account.model';

@Injectable({
  providedIn: 'root'
})
export class UserInfoService {

  private baseUrl = environment.apiUrl + '/user';

  constructor(private http: HttpClient) {}

  // getFullAccountInfo(): Observable<AccountResponse[]> {
  // return this.http.get<AccountResponse[]>(`${this.baseUrl}/profile`, {
  //   withCredentials: true,
  // });
  // }

  getAccountNumbers(): Observable<String[]> {
    return this.http.get<String[]>(`${this.baseUrl}/profile`, {
      withCredentials: true,
    });
  }

  // getFullAccountInfo(): Observable<String> {
  //   return this.http.get<String>(`${this.baseUrl}/profile`, {
  //     withCredentials: true,
  //   });
  // }


}
  
