import { Component, OnInit } from '@angular/core';
import { RouterLink, Router } from '@angular/router';
import { AuthService } from '../../services/auth-service';
import { UserInfoService } from '../../services/user-info-service';
import { CommonModule } from '@angular/common';
import { firstValueFrom, switchMap, tap, NEVER} from 'rxjs';

@Component({
  selector: 'app-header',
  imports: [RouterLink, CommonModule],
  templateUrl: './header.html',
  styleUrl: './header.scss',
})

export class Header {

  public schwabConnected: boolean = false;

  constructor(public authService: AuthService, private userService: UserInfoService, private router: Router) {}

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

  login() {
    try {

      this.authService.googleLogin().pipe(
        switchMap(googleRes => {
          console.log('Firebase login successful:', googleRes);
          return this.schwabLogin();
        })
      ).subscribe(schwabRes => {
          console.log('Schwab login flow initiated:', schwabRes);
        }
      ) 
      
      // if (!this.authService.firebaseLoggedIn()) {
      //   console.warn('User not logged in → redirecting to Firebase login');
      //   await this.authService.googleLogin();
      //   return;
      // }

      // console.log('Firebase user logged in');

      // this.authService.schwabIsLoggedIn().pipe(

      //   // makes sure schwab is connected
      //   switchMap(res => {
      //     if (!res.logged_in) {
      //       console.log("Schwab not connected, starting auth flow...");
      //       return this.authService.schwabLogin().pipe(
      //         tap(login => window.open(login.auth_url, "_self")),
      //         switchMap(() => NEVER)
      //       );
      //     }

      //     console.log("Schwab already connected.");

      //     return this.authService.schwabRefreshTokens();
      //   }),

      //   switchMap(() => this.userService.setAccountInfo())

      // ).subscribe({
      //   next: () => {
      //     console.log("Account info set");
      //     this.router.navigate(['/dashboard']);
      //   },
      //   error: err => console.error("Flow error:", err)
      // });

    } catch (err) {
      console.error('Auth state error:', err);
    }
  }

  schwabLogin() {
    return this.authService.schwabIsLoggedIn().pipe(
      switchMap(res => {
        if (!res.logged_in) {
          console.log('Schwab not connected, starting Schwab auth flow...');
          return this.authService.schwabLogin().pipe(
            tap(res => window.open(res.auth_url, '_self'))
          );
        } else {
          console.log('Schwab already connected.');
          this.schwabConnected = true;
          this.authService.setSchwabConnected(true);

          return this.authService.schwabRefreshTokens().pipe(
            tap(res => {
              console.log('Schwab tokens refreshed:', res.message);
              this.router.navigate(['/dashboard']);
            })
          );
        }
      })
  );
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
