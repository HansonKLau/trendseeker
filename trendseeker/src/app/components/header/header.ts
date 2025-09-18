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
    this.authService.isLoggedIn().subscribe({
      next: (res) => {
        this.authService.setLoggedIn(res.logged_in);
        this.loggedIn = this.authService.getLoggedIn();
        console.log("User logged in status:", this.authService.getLoggedIn());
      },
      error: err => {
        console.error("Error calling isLoggedIn API", err);
      }
    });
  }

  login() {
    this.authService.login().subscribe({
      next: (res) => {
        console.log("Login API triggered");
        window.open(res.auth_url, "_self");
      },
      error: err => {
        console.error("Error calling login API", err);
      }
    });
  }

  logout() {
    this.authService.setLoggedIn(false);
    this.loggedIn = false;

    this.authService.logout().subscribe({
      next: () => {
        console.log("Logout API triggered");
      },
      error: err => {
        console.error("Error calling logout API", err);
      }
    });

    this.router.navigate(['/']);
  }


}
