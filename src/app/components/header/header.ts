import { Component, OnInit } from '@angular/core';
import { RouterLink, Router } from '@angular/router';
import { AuthService } from '../../services/auth-service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-header',
  imports: [RouterLink, CommonModule],
  templateUrl: './header.html',
  styleUrl: './header.scss',
})

export class Header implements OnInit {

  public loggedIn: boolean = false;
  constructor(private authService: AuthService, private router: Router) {}

  ngOnInit() {
    this.authService.schwabIsLoggedIn().subscribe({
      next: (res) => {
        this.authService.setSchwabLoggedIn(res.logged_in);
        this.loggedIn = this.authService.getSchwabLoggedIn();
        console.log("User logged in status:", this.authService.getSchwabLoggedIn());
      },
      error: err => {
        console.error("Error calling isLoggedIn API", err);
      }
    });
  }

  login() {
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
          },
          error: (err) => console.error("Auth state subscription error:", err)
        });
  }

  logout() {
    this.authService.googleLogout().then(() => {
      console.log("User logged out successfully");
    }).catch(err => {
      console.error("Logout error:", err);
    });

    this.router.navigate(['/']);
  }
}
