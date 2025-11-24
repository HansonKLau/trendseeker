import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { from, Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { AccountResponse } from '../models/account.model';
import { switchMap } from 'rxjs/operators';
import { auth } from '../../firebase/firebase';
import { HttpHeaders } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class UserInfoService {

  private baseUrl = environment.apiUrl + '/user';

  constructor(private http: HttpClient) {}

  async getFirebaseIdToken(): Promise<string> {
    const user = auth.currentUser;
    if (!user) {
      throw new Error("No user signed in");
    }

    return user.getIdToken();
  }

  setAccountInfo(): Observable<any> {
    return from(this.getFirebaseIdToken()).pipe(
      switchMap((idToken: string) => {
        const headers = new HttpHeaders({
          Authorization: `Bearer ${idToken}`
        });

        return this.http.post<any>(
          `${this.baseUrl}/set-account-info`,
          {}, // body
          { headers, withCredentials: true }
        );
      })
    );
  }

  setAccountBalancesAndPositions(): Observable<any> {
    return from(this.getFirebaseIdToken()).pipe(
      switchMap((idToken: string) => {
        const headers = new HttpHeaders({
          Authorization: `Bearer ${idToken}`
        });
        return this.http.post<any>(
          `${this.baseUrl}/set-balances-positions`,
          {}, // body
          { headers, withCredentials: true }
        );
      })
    );
  }


  // getFullAccountInfo(): Observable<AccountResponse[]> {
  // return this.http.get<AccountResponse[]>(`${this.baseUrl}/profile`, {
  //   withCredentials: true,
  // });
  // }

  // getAccountNumbers(): Observable<String[]> {
  //   return this.http.get<String[]>(`${this.baseUrl}/profile`, {
  //     withCredentials: true,
  //   });
  // }

  // getFullAccountInfo(): Observable<String> {
  //   return this.http.get<String>(`${this.baseUrl}/profile`, {
  //     withCredentials: true,
  //   });
  // }


}
  
