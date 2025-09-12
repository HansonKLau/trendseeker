import { Component } from '@angular/core';
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

import { AuthService } from '@auth0/auth0-angular';

@Component({
  selector: 'app-login',
  imports: [],
  templateUrl: './login.html',
  styleUrl: './login.scss'
})
export class Login {

  private SCHWAB_APP_KEY = environment.SCHWAB_APP_KEY;
  private SCHWAB_SECRET = environment.SCHWAB_SECRET;
  private SCHWAB_STOCKS_URL = environment.SCHWAB_STOCKS_URL;

  constructor(public auth: AuthService) {}

  // use schwab login to authenticate user

}
