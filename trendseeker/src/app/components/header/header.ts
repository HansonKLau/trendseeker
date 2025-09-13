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
      next: () => {
        console.log("Login API triggered");
      },
      error: err => {
        console.error("Error calling login API", err);
      }
    });
  }

}
