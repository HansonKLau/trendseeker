import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { environment } from '../../environments/environment';

import { signInWithPopup, GoogleAuthProvider, onAuthStateChanged, User } from "firebase/auth";
import { auth } from '../../firebase/firebase';

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
    return this.http.get<{ auth_url: string }>(`${this.baseUrl}/login`, { withCredentials: true });  
  }

  schwabLogout(): Observable<{ message: string }> {
    return this.http.get<{ message: string }>(`${this.baseUrl}/logout`, { withCredentials: true });
  }

  schwabRefreshTokens(): Observable<{ message: string }> {
    return this.http.get<{ message: string }>(`${this.baseUrl}/refresh-tokens`, { withCredentials: true });
  }

  schwabIsLoggedIn(): Observable<{ logged_in: boolean }> {
    return this.http.get<{ logged_in: boolean }>(`${this.baseUrl}/status`, { withCredentials: true });
  }

  setSchwabLoggedIn(status: boolean) {
    this.schwabLoggedIn = status;
  }

  getSchwabLoggedIn(): boolean {
    return this.schwabLoggedIn;
  }

}
