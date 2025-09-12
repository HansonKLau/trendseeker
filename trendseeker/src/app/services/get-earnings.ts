import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Earnings } from '../models/earnings.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})

export class EarningsService {

  private FMP_API_KEY = environment.FMP_API_KEY;
  private FMP_EARNINGS_URL = environment.FMP_EARNINGS_CALENDAR_URL;

  constructor(private http: HttpClient) {}

  getEarnings(): Observable<Earnings[]> {

    const today = new Date();

    const nextWeek = new Date();
    nextWeek.setDate(today.getDate() + 30);

    // format dates as YYYY-MM-DD for the API
    const formatDate = (date: Date): string => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    const fromDate = formatDate(today);
    const toDate = formatDate(nextWeek)

    const url = `${this.FMP_EARNINGS_URL}?from=${fromDate}&to=${toDate}&apikey=${this.FMP_API_KEY}`;
    return this.http.get<Earnings[]>(url);
  }
  
  
}
