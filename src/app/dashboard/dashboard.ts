import { Component, inject, OnInit } from '@angular/core';
import { interval } from 'rxjs';
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

    this.authService.user$.subscribe({
      next: (user) => {
        if (!user) {
          console.warn("User not logged in → redirecting to Firebase login");
          this.authService.googleLogin().catch(err => console.error("Login error:", err));
          return;
        }

        console.log("Firebase user logged in:", user.email);

        this.authService.schwabIsLoggedIn().subscribe({
          next: (res) => {
            if (!res.logged_in) {
              console.log("Schwab not connected, starting Schwab auth flow...");
              this.authService.schwabLogin().subscribe({
                next: (res) => {
                  window.open(res.auth_url, "_self");
                },
                error: (err) => console.error("Error calling Schwab login:", err)
              });
            }
          },
          error: (err) => console.error("Error checking Schwab login:", err)
        });

        const idleCheck = interval(30 * 60 * 1000);
        const sub = idleCheck.subscribe(() => {
          if (!this.authService.firebaseLoggedIn()) {
            console.warn("Firebase user logged out, redirecting to home...");
            this.router.navigate(['/']);
            sub.unsubscribe();
          }
        });
      },
      error: (err) => console.error("Auth state subscription error:", err)
    });

  }
}
