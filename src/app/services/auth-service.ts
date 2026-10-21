import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, from, throwError, of, EMPTY } from 'rxjs';
import { catchError, map, switchMap, tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';

import { signInWithPopup, GoogleAuthProvider, onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '../../firebase/firebase';
import { HttpErrorResponse, HttpHeaders } from '@angular/common/http';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  // INITIALIZE

  private userSubject = new BehaviorSubject<User | null>(null);
  user$ = this.userSubject.asObservable();

  constructor(private http: HttpClient) {
    onAuthStateChanged(auth, (user: any) => {
      this.userSubject.next(user);
    });
  }

  // FIREBASE LOGIN

  googleLogin(): Observable<User> {
    const provider = new GoogleAuthProvider();

    if (auth.currentUser) {
      console.log('Already signed in');
      return of(auth.currentUser);
    }

    return from(signInWithPopup(auth, provider)).pipe(
      map((result) => result.user),
      catchError((error) => {
        console.error('Google login failed');
        return throwError(() => error);
      }),
    );

    // try {
    //   const result = await signInWithPopup(auth, provider);
    //   return result.user;
    // } catch (error) {
    //   console.error("Google login failed:", error);
    //   throw error;
    // }
  }

  async getFirebaseIdToken(): Promise<string> {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('No user signed in');
    }

    return user.getIdToken();
  }

  firebaseLoggedIn(): boolean {
    return !!this.userSubject.value;
  }

  authReady(): Promise<void> {
    return auth.authStateReady();
  }

  googleLogout() {
    return auth.signOut();
  }

  // SCHWAB LOGIN

  private schwabConnected = false;
  private baseUrl = environment.apiUrl + '/auth';
  private readonly connectErrorSubject = new BehaviorSubject<string | null>(null);
  /** Shown when starting Schwab OAuth fails. Never includes tokens or URLs. */
  readonly schwabConnectError$ = this.connectErrorSubject.asObservable();

  schwabLogin(): Observable<{ auth_url: string }> {
    // from converts promise to observable
    return from(this.getFirebaseIdToken()).pipe(
      // switchMap waits for the idToken before proceeding
      switchMap((idToken: string) => {
        const headers = new HttpHeaders({
          Authorization: `Bearer ${idToken}`,
        });

        // http.get returns an observable
        return this.http.get<{ auth_url: string }>(`${this.baseUrl}/login`, {
          headers,
          withCredentials: true,
        });
      }),
    );
  }

  /**
   * Starts Schwab OAuth for the signed-in Firebase user.
   * GET /auth/login with the Firebase bearer token, then navigates to auth_url.
   * Read-only: this does not place orders. Failures are reported on
   * schwabConnectError$ and are not rethrown. Tokens and auth URLs are not logged.
   */
  connectSchwab(): Observable<void> {
    this.connectErrorSubject.next(null);

    return this.schwabLogin().pipe(
      tap((res) => {
        const authUrl = schwabAuthUrl(res);
        if (!authUrl) {
          this.showConnectError(200, true);
          return;
        }

        window.open(authUrl, '_self');
      }),
      map(() => undefined),
      catchError((err: unknown) => {
        this.reportSchwabConnectError(err);
        return EMPTY;
      }),
    );
  }

  /** Records a Schwab connect/login failure. Logs the HTTP status only. */
  reportSchwabConnectError(err: unknown): void {
    const status = err instanceof HttpErrorResponse ? err.status : undefined;
    this.showConnectError(status, false);
  }

  clearSchwabConnectError(): void {
    this.connectErrorSubject.next(null);
  }

  private showConnectError(status: number | undefined, missingLink: boolean): void {
    console.error('Schwab connect failed', status ?? 'unknown');
    this.connectErrorSubject.next(schwabConnectErrorText(status, missingLink));
  }

  schwabLogout(): Observable<{ message: string }> {
    return from(this.getFirebaseIdToken()).pipe(
      switchMap((idToken: string) => {
        const headers = new HttpHeaders({
          Authorization: `Bearer ${idToken}`,
        });

        return this.http.get<{ message: string }>(`${this.baseUrl}/logout`, {
          headers,
          withCredentials: true,
        });
      }),
    );
  }

  schwabRefreshTokens(): Observable<{ message: string }> {
    return from(this.getFirebaseIdToken()).pipe(
      switchMap((idToken: string) => {
        const headers = new HttpHeaders({
          Authorization: `Bearer ${idToken}`,
        });

        return this.http.get<{ message: string }>(`${this.baseUrl}/refresh-tokens`, {
          headers,
          withCredentials: true,
        });
      }),
    );
  }

  schwabIsLoggedIn(): Observable<{ logged_in: boolean }> {
    return from(this.getFirebaseIdToken()).pipe(
      switchMap((idToken: string) => {
        const headers = new HttpHeaders({
          Authorization: `Bearer ${idToken}`,
        });

        return this.http.get<{ logged_in: boolean }>(`${this.baseUrl}/status`, {
          headers,
          withCredentials: true,
        });
      }),
    );
  }

  setSchwabConnected(status: boolean) {
    this.schwabConnected = status;
  }

  getSchwabConnected(): boolean {
    return this.schwabConnected;
  }
}

/** Accept only an http(s) auth_url. Other shapes are treated as a failed connect. */
function schwabAuthUrl(body: unknown): string | null {
  if (!body || typeof body !== 'object') {
    return null;
  }

  const value = (body as Record<string, unknown>)['auth_url'];
  if (typeof value !== 'string') {
    return null;
  }

  const url = value.trim();
  if (!url.startsWith('https://') && !url.startsWith('http://')) {
    return null;
  }

  return url;
}

function schwabConnectErrorText(status: number | undefined, missingLink: boolean): string {
  if (missingLink) {
    return 'Could not connect to Schwab. No connect link was returned.';
  }

  if (status === 401 || status === 403) {
    return 'Could not connect to Schwab. Sign in again and retry.';
  }

  if (typeof status === 'number' && status > 0) {
    return `Could not connect to Schwab (HTTP ${status}).`;
  }

  return 'Could not connect to Schwab. Check your connection and try again.';
}
