import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})

export class StocksService {

  private SCHWAB_APP_KEY = environment.SCHWAB_APP_KEY;
  private SCHWAB_SECRET = environment.SCHWAB_SECRET;
  private SCHWAB_STOCKS_URL = environment.SCHWAB_STOCKS_URL;

  constructor(private http: HttpClient) {}

  getStocks(ticker: string): Observable<any> {

    const baseUrl = `${this.SCHWAB_STOCKS_URL}quotes`;

    const url = new URL(baseUrl);
    url.searchParams.set('symbols', ticker);
    url.searchParams.set('apikey', this.SCHWAB_APP_KEY);
    url.searchParams.set('secret', this.SCHWAB_SECRET);

    const finalUrl = url.toString();

    return this.http.get<any>(finalUrl);
  }
  
}
