import { Component, OnDestroy, OnInit } from '@angular/core';
import { RouterLink, Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthService } from '../../services/auth-service';
import { CommonModule } from '@angular/common';
import { EMPTY, firstValueFrom, of, Subscription } from 'rxjs';
import { catchError, switchMap, tap } from 'rxjs/operators';

@Component({
  selector: 'app-header',
  imports: [RouterLink, CommonModule],
  templateUrl: './header.html',
  styleUrl: './header.scss',
})
export class Header implements OnInit, OnDestroy {
  public schwabConnected: boolean = false;
  private schwabStatusSub?: Subscription;

  constructor(
    public authService: AuthService,
    private router: Router,
  ) {}

  ngOnInit() {
    // Firebase auth may not be ready when the header is created. Wait until
    // user$ emits a signed-in user before calling /auth/status.
    this.schwabStatusSub = this.authService.user$
      .pipe(
        switchMap((user) => {
          if (!user) {
            return of({ logged_in: false });
          }

          return this.authService.schwabIsLoggedIn().pipe(
            catchError((err: unknown) => {
              const status = err instanceof HttpErrorResponse ? err.status : undefined;
              console.error('Schwab status check failed', status ?? 'unknown');
              return of({ logged_in: false });
            }),
          );
        }),
      )
      .subscribe((res) => {
        this.schwabConnected = !!res.logged_in;
        this.authService.setSchwabConnected(this.schwabConnected);
      });
  }

  ngOnDestroy() {
    this.schwabStatusSub?.unsubscribe();
  }

  login() {
    this.authService
      .googleLogin()
      .pipe(switchMap(() => this.schwabLogin()))
      .subscribe({
        error: (err: unknown) => this.logAuthStatus('Auth state error', err),
      });
  }

  /** Signed-in user who still needs Schwab. Same OAuth start as Login. */
  connectSchwab(): void {
    this.authService.connectSchwab().subscribe();
  }

  schwabLogin() {
    return this.authService.schwabIsLoggedIn().pipe(
      switchMap((res) => {
        if (!res.logged_in) {
          return this.authService.connectSchwab();
        }

        this.schwabConnected = true;
        this.authService.setSchwabConnected(true);

        return this.authService.schwabRefreshTokens().pipe(
          tap(() => {
            this.router.navigate(['/dashboard']);
          }),
        );
      }),
      catchError((err: unknown) => {
        this.authService.reportSchwabConnectError(err);
        return EMPTY;
      }),
    );
  }

  async logout() {
    try {
      // Schwab logout needs the Firebase ID token, so it has to finish first.
      await firstValueFrom(this.authService.schwabLogout());
    } catch (err) {
      const status = err instanceof HttpErrorResponse ? err.status : undefined;
      console.error('Schwab logout failed', status ?? 'unknown');
    }

    try {
      await this.authService.googleLogout();
      this.schwabConnected = false;
      this.authService.setSchwabConnected(false);
      this.authService.clearSchwabConnectError();
      console.log('User logged out successfully');
      this.router.navigate(['/']);
    } catch (err) {
      console.error('Firebase logout failed');
    }
  }

  private logAuthStatus(message: string, err: unknown): void {
    const status = err instanceof HttpErrorResponse ? err.status : undefined;
    console.error(message, status ?? 'unknown');
  }
}
