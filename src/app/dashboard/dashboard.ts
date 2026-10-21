import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription, from, of } from 'rxjs';
import { catchError, switchMap, take } from 'rxjs/operators';
import { AuthService } from '../services/auth-service';
import { UserInfoService } from '../services/user-info-service';
import { PositionView, classifyPositionsError } from '../models/positions';

type DashboardStatus = 'loading' | 'signed-out' | 'not-connected' | 'empty' | 'error' | 'ready';

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class Dashboard implements OnInit, OnDestroy {
  status: DashboardStatus = 'loading';
  positions: PositionView[] = [];
  errorMessage = '';

  private loadSub?: Subscription;

  constructor(
    private authService: AuthService,
    private userInfoService: UserInfoService,
  ) {}

  ngOnInit(): void {
    this.load();
  }

  ngOnDestroy(): void {
    this.loadSub?.unsubscribe();
  }

  load(): void {
    this.loadSub?.unsubscribe();
    this.status = 'loading';
    this.positions = [];
    this.errorMessage = '';

    this.loadSub = from(this.authService.authReady())
      .pipe(
        switchMap(() => this.authService.user$.pipe(take(1))),
        switchMap((user) => {
          if (!user) {
            return of<DashboardStatus>('signed-out');
          }

          return this.authService.schwabIsLoggedIn().pipe(
            switchMap((schwab) => {
              if (!schwab.logged_in) {
                return of<DashboardStatus>('not-connected');
              }

              return this.userInfoService.getPositions().pipe(
                switchMap((positions) => {
                  this.positions = positions;
                  return of<DashboardStatus>(positions.length === 0 ? 'empty' : 'ready');
                }),
              );
            }),
          );
        }),
        catchError((err: unknown) => {
          if (classifyPositionsError(err) === 'not-connected') {
            return of<DashboardStatus>('not-connected');
          }

          this.errorMessage = 'Could not load positions. Try again.';
          return of<DashboardStatus>('error');
        }),
      )
      .subscribe((status) => {
        this.status = status;
      });
  }

  get totalMarketValue(): number {
    return this.positions.reduce((sum, position) => sum + position.marketValue, 0);
  }

  get totalUnrealized(): number {
    return this.positions.reduce((sum, position) => sum + position.unrealizedGainLoss, 0);
  }
}
