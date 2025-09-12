import { Component, inject, OnInit } from '@angular/core';
import { StocksService } from '../services/get-stocks';
import { catchError } from 'rxjs';

@Component({
  selector: 'app-dashboard',
  imports: [],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
  providers: [StocksService]
})
export class Dashboard {

  stocksService = inject(StocksService);
  stockData: any;

  ticker: string = 'AAPL';

  ngOnInit(): void {
    this.stocksService.getStocks(this.ticker).pipe(catchError((err) => {
      console.error('Error fetching stock data', err);
      throw err;
    })).subscribe(data => {
      this.stockData = data;
      console.log(data);
    });
  }

}
