import { Component, OnInit } from '@angular/core';
import { RouterLink, Router } from '@angular/router';
import { AuthService } from '../../services/auth-service';
import { CommonModule } from '@angular/common';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-header',
  imports: [RouterLink, CommonModule],
  templateUrl: './header.html',
  styleUrl: './header.scss',
})

export class Header {

  public schwabConnected: boolean = false;

  constructor(public authService: AuthService, private router: Router) {}

  ngOnInit() {
    this.authService.schwabIsLoggedIn().subscribe({
      next: (res) => {
        if (res.logged_in) {
          this.schwabConnected = true;
        } else {
          this.schwabConnected = false;
        }
      },
      error: (err) => console.error('Auth state subscription error:', err)
    });

    if (this.authService.firebaseLoggedIn()) {
      console.log('User already logged in to Firebase');
    }
  }

  async login() {
    try {
      
      if (!this.authService.firebaseLoggedIn()) {
        console.warn('User not logged in → redirecting to Firebase login');
        await this.authService.googleLogin();
        return;
      }

      console.log('Firebase user logged in');

      this.authService.schwabIsLoggedIn().subscribe({
        next: (res) => {
          if (!res.logged_in) {
            console.log('Schwab not connected, starting Schwab auth flow...');
            this.authService.schwabLogin().subscribe({
              next: (res) => {
                window.open(res.auth_url, '_self');
              },
              error: (err) => console.error('Error calling Schwab login:', err)
            });

          } else {
            console.log('Schwab already connected.');
            // invoke refresh tokens
            this.authService.schwabRefreshTokens().subscribe({
              next: (res) => {
                console.log('Schwab tokens refreshed:', res?.message);
                // navigate to dashboard in SPA after successful token refresh
                this.router.navigate(['/dashboard']);
              },
              error: (err) => console.error('Error refreshing Schwab tokens:', err)
            });
          }
        },
        error: (err) => console.error('Error checking Schwab login:', err)
      });

    } catch (err) {
      console.error('Auth state error:', err);
    }
  }

  async schwabLogin() {
    try {

      this.authService.schwabIsLoggedIn().subscribe({
        next: (res) => {
          if (!res.logged_in) {
            console.log('Schwab not connected, starting Schwab auth flow...');
            this.authService.schwabLogin().subscribe({
              next: (res) => {
                window.open(res.auth_url, '_self');
              },
              error: (err) => console.error('Error calling Schwab login:', err)
            });

          } else {
            console.log('Schwab already connected.');
            this.schwabConnected = true;
            this.authService.setSchwabConnected(true);
            // invoke refresh tokens
            this.authService.schwabRefreshTokens().subscribe({
              next: (res) => {
                console.log('Schwab tokens refreshed:', res?.message);
                // navigate to dashboard in SPA after successful token refresh
                this.router.navigate(['/dashboard']);
              },
              error: (err) => console.error('Error refreshing Schwab tokens:', err)
            });
          }
        },
        error: (err) => console.error('Error checking Schwab login:', err)
      });

    } catch (err) {
      console.error('Auth state error:', err);
    }
  }

  async logout() {
    try {
      await this.authService.googleLogout();
      this.schwabConnected = false;
      this.authService.setSchwabConnected(false);
      console.log("User logged out successfully");
      this.router.navigate(['/']);
    } catch (err) {
      console.error("Logout error:", err);
    }
  }
}
