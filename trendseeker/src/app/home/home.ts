import { Component, inject, OnInit } from '@angular/core';
import { EarningsService } from '../services/get-earnings';
import { Earnings } from '../models/earnings.model';
import { catchError } from 'rxjs';

@Component({
  selector: 'app-home',
  imports: [],
  templateUrl: './home.html',
  styleUrl: './home.scss',
  providers: [EarningsService]
})

export class Home implements OnInit {

  earningsService = inject(EarningsService);
  earnings: Earnings[] = [];

  ngOnInit(): void {
    this.earningsService.getEarnings().pipe(catchError((err) => {
      console.error('Error fetching earnings data', err);
      throw err;
    })).subscribe(data => {
      this.earnings = data;
      console.log(data);
    });
  }

}
