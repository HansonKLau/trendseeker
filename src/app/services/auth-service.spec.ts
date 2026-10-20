import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { AuthService } from './auth-service';
import { environment } from '../../environments/environment';

describe('AuthService', () => {
  let service: AuthService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(AuthService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('sends the Firebase bearer token on Schwab logout the same way as login', () => {
    spyOn(service, 'getFirebaseIdToken').and.resolveTo('test-token');

    let logoutMessage = '';
    let loginUrl = '';
    service.schwabLogout().subscribe((res) => {
      logoutMessage = res.message;
    });
    service.schwabLogin().subscribe((res) => {
      loginUrl = res.auth_url;
    });

    return Promise.resolve().then(() => {
      const logout = http.expectOne(`${environment.apiUrl}/auth/logout`);
      const login = http.expectOne(`${environment.apiUrl}/auth/login`);

      expect(logout.request.method).toBe('GET');
      expect(logout.request.withCredentials).toBe(true);
      expect(logout.request.headers.get('Authorization')).toBe('Bearer test-token');
      expect(login.request.headers.get('Authorization')).toBe(
        logout.request.headers.get('Authorization'),
      );

      logout.flush({ message: 'Logged out successfully' });
      login.flush({ auth_url: 'https://schwab.example/authorize' });

      expect(logoutMessage).toBe('Logged out successfully');
      expect(loginUrl).toBe('https://schwab.example/authorize');
    });
  });
});
