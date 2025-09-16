import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth-service';

@Component({
  selector: 'app-header',
  imports: [RouterLink],
  templateUrl: './header.html',
  styleUrl: './header.scss'
})

export class Header {

  constructor(private authService: AuthService) {}

  login() {
    this.authService.login().subscribe({
      next: (res) => {
        console.log("Login API triggered");
        window.open(res.auth_url, "_blank");
      },
      error: err => {
        console.error("Error calling login API", err);
      }
    });
  }


}
