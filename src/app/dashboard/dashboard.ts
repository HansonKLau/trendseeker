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

    this.authService.isLoggedIn().subscribe({ 
      next: (res) => {
        this.authService.setLoggedIn(res.logged_in);
        console.log("User logged in status:", this.authService.getLoggedIn());

        if (!this.authService.getLoggedIn()) {
          console.warn("User not logged in, redirecting to login...");
          this.authService.login().subscribe({
            next: (res) => {
              console.log("Login API triggered");
              window.open(res.auth_url, "_self");
            },
            error: err => {
              console.error("Error calling login API", err);
            }
          });
        } else {
          
          // check login status every 30 minutes, redirect to home if not logged in
          const idleCheck = interval(30 * 60 * 1000); // 30 minutes
          const sub = idleCheck.subscribe(() => {
            this.authService.isLoggedIn().subscribe({
              next: (res) => {
                this.authService.setLoggedIn(res.logged_in);
                console.log("User logged in status (time check):", this.authService.getLoggedIn());
                if (!this.authService.getLoggedIn()) {
                  console.warn("User session expired, redirecting to home...");
                  this.router.navigate(['/']);
                  // unsubscribe from further checks
                  sub.unsubscribe();
                }
              },
              error: err => {
                console.error("Error calling isLoggedIn API", err);
                this.router.navigate(['/']);
                sub.unsubscribe();
              }
            });
          });
        }

      },
      error: err => {
        console.error("Error calling isLoggedIn API", err);
      }
    });

  
  }
}
