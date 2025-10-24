import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, from } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { environment } from '../../environments/environment';

import { signInWithPopup, GoogleAuthProvider, onAuthStateChanged, User } from "firebase/auth";
import { auth } from '../../firebase/firebase';
import { HttpHeaders } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  
  // INITIALIZE

  private userSubject = new BehaviorSubject<User | null>(null);
  user$ = this.userSubject.asObservable();

  constructor(private http: HttpClient) {
    
    onAuthStateChanged(auth, (user) => {
      this.userSubject.next(user);
    });
  }

  // FIREBASE LOGIN

  async googleLogin() {
    const provider = new GoogleAuthProvider();

    try {
      const result = await signInWithPopup(auth, provider);
      return result.user;
    } catch (error) {
      console.error("Google login failed:", error);
      throw error;
    }
  }

  async getFirebaseIdToken(): Promise<string> {
    const user = auth.currentUser;
    if (!user) {
      throw new Error("No user signed in");
    }

    return user.getIdToken();
  }

  firebaseLoggedIn(): boolean {
    return !!this.userSubject.value;
  }

  googleLogout() {
    return auth.signOut();
  }

  // SCHWAB LOGIN

  private schwabLoggedIn = false;
  private baseUrl = environment.apiUrl + '/auth';

  schwabLogin(): Observable<{ auth_url: string }> {
    // from converts promise to observable
    return from(this.getFirebaseIdToken()).pipe(
      // switchMap waits for the idToken before proceeding
      switchMap((idToken: string) => {
        const headers = new HttpHeaders({
          Authorization: `Bearer ${idToken}`,
        });

        // http.get returns an observable
        return this.http.get<{ auth_url: string }>(`${this.baseUrl}/login`, { headers, withCredentials: true });
      })
    );
  }

  schwabLogout(): Observable<{ message: string }> {
    return this.http.get<{ message: string }>(`${this.baseUrl}/logout`, { withCredentials: true });
  }

  schwabRefreshTokens(): Observable<{ message: string }> {

    return from(this.getFirebaseIdToken()).pipe(
      switchMap((idToken: string) => {
        const headers = new HttpHeaders({
          Authorization: `Bearer ${idToken}`,
        });

        return this.http.get<{ message: string }>(`${this.baseUrl}/refresh-tokens`, { headers, withCredentials: true });
      })
    );
  }

  schwabIsLoggedIn(): Observable<{ logged_in: boolean }> {

    return from(this.getFirebaseIdToken()).pipe(
      switchMap((idToken: string) => {
        const headers = new HttpHeaders({
          Authorization: `Bearer ${idToken}`,
        });

        return this.http.get<{ logged_in: boolean }>(`${this.baseUrl}/status`, { headers, withCredentials: true });
      })
    );
  }

  setSchwabLoggedIn(status: boolean) {
    this.schwabLoggedIn = status;
  }

  getSchwabLoggedIn(): boolean {
    return this.schwabLoggedIn;
  }

}
