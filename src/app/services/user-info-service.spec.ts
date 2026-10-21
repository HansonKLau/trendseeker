import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { UserInfoService } from './user-info-service';
import { environment } from '../../environments/environment';
import { SchwabNotConnectedError } from '../models/positions';

describe('UserInfoService', () => {
  let service: UserInfoService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(UserInfoService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('loads positions with the Firebase bearer token and does not echo it back', () => {
    spyOn(service, 'getFirebaseIdToken').and.resolveTo('test-token');

    let symbol = '';
    service.getPositions().subscribe((positions) => {
      symbol = positions[0].symbol;
    });

    return Promise.resolve().then(() => {
      const req = http.expectOne(`${environment.apiUrl}/user/positions`);
      expect(req.request.method).toBe('GET');
      expect(req.request.headers.get('Authorization')).toBe('Bearer test-token');
      expect(req.request.withCredentials).toBe(true);
      expect(JSON.stringify(req.request.body ?? '')).not.toContain('test-token');

      req.flush({
        positions: [
          {
            symbol: 'AAPL',
            quantity: 12,
            average_cost: 178.42,
            market_value: 2340,
            unrealized_gain_loss: 198.96,
          },
        ],
      });

      expect(symbol).toBe('AAPL');
    });
  });

  it('surfaces a disconnected Schwab account from the positions payload', () => {
    spyOn(service, 'getFirebaseIdToken').and.resolveTo('test-token');

    let error: unknown;
    service.getPositions().subscribe({
      error: (err) => {
        error = err;
      },
    });

    return Promise.resolve().then(() => {
      const req = http.expectOne(`${environment.apiUrl}/user/positions`);
      req.flush({ logged_in: false });
      expect(error).toBeInstanceOf(SchwabNotConnectedError);
    });
  });
});