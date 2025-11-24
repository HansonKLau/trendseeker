import { Component, inject, OnInit } from '@angular/core';
import { interval, firstValueFrom } from 'rxjs';
import { AuthService } from '../services/auth-service';
import { UserInfoService } from '../services/user-info-service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-dashboard',
  imports: [],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class Dashboard implements OnInit {

  constructor(private authService: AuthService, 
              private userInfoService: UserInfoService,
              private router: Router) {}

  ngOnInit() {

    // (async () => {
    //   try {
    //     // wait for Firebase auth state so we have an ID token available
    //     const user = await firstValueFrom(this.authService.user$);
    //     if (!user) {
    //       console.warn('User not logged in → redirecting to home');
    //       this.router.navigate(['/']);
    //       return;
    //     }

    //     // ask the backend whether Schwab is connected for this user
    //     const status = await firstValueFrom(this.authService.schwabIsLoggedIn());
    //     this.authService.setSchwabConnected(status.logged_in);

    //     if (!status.logged_in) {
    //       console.warn('User not connected to Schwab → redirecting to home');
    //       this.router.navigate(['/']);
    //       return;
    //     }

    //     // Schwab is connected — set account info
    //     this.userInfoService.setAccountInfo().subscribe({
    //       next: (res) => {
    //         console.log('Account info set successfully:', res);
    //       },
    //       error: (err) => {
    //         console.error('Error setting account info:', err);
    //       }
    //     });

    //     // keep an idle check that redirects if Firebase signs out
    //     const idleCheck = interval(30 * 60 * 1000);
    //     const sub = idleCheck.subscribe(() => {
    //       if (!this.authService.firebaseLoggedIn()) {
    //         console.warn("Firebase user logged out, redirecting to home...");
    //         this.router.navigate(['/']);
    //         sub.unsubscribe();
    //       }
    //     });

    //   } catch (err) {
    //     console.error('Initialization error:', err);
    //     // fallback: redirect to home
    //     this.router.navigate(['/']);
    //   }
    // })();

  }
}
