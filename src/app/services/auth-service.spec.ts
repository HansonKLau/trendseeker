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

  it('starts Schwab connect with the bearer token and does not log the auth URL', () => {
    const secretUrl = 'https://schwab.example/authorize?state=secret-value';
    spyOn(service, 'getFirebaseIdToken').and.resolveTo('test-token');
    const open = spyOn(window, 'open').and.returnValue(window);
    const log = spyOn(console, 'log');
    const errorLog = spyOn(console, 'error');

    service.connectSchwab().subscribe();

    return Promise.resolve().then(() => {
      const login = http.expectOne(`${environment.apiUrl}/auth/login`);
      expect(login.request.method).toBe('GET');
      expect(login.request.withCredentials).toBeTrue();
      expect(login.request.headers.get('Authorization')).toBe('Bearer test-token');
      login.flush({ auth_url: secretUrl });

      expect(open).toHaveBeenCalledOnceWith(secretUrl, '_self');
      const logged = [...log.calls.allArgs(), ...errorLog.calls.allArgs()]
        .flat()
        .map(String)
        .join(' ');
      expect(logged).not.toContain('secret-value');
      expect(logged).not.toContain(secretUrl);
      expect(logged).not.toContain('test-token');
    });
  });

  it('shows a connect error and does not open a window when login returns 401', () => {
    const secretUrl = 'https://schwab.example/authorize?state=secret-value';
    spyOn(service, 'getFirebaseIdToken').and.resolveTo('test-token');
    const open = spyOn(window, 'open');
    const log = spyOn(console, 'log');
    const errorLog = spyOn(console, 'error');
    let message: string | null = 'pending';
    service.schwabConnectError$.subscribe((value) => {
      message = value;
    });

    service.connectSchwab().subscribe();

    return Promise.resolve().then(() => {
      const login = http.expectOne(`${environment.apiUrl}/auth/login`);
      login.flush(
        { detail: 'Bearer test-token', auth_url: secretUrl },
        { status: 401, statusText: 'Unauthorized' },
      );

      expect(open).not.toHaveBeenCalled();
      expect(message).toBe('Could not connect to Schwab. Sign in again and retry.');
      const logged = [...log.calls.allArgs(), ...errorLog.calls.allArgs()]
        .flat()
        .map(String)
        .join(' ');
      expect(logged).toContain('401');
      expect(logged).not.toContain('secret-value');
      expect(logged).not.toContain(secretUrl);
      expect(logged).not.toContain('test-token');
      expect(logged).not.toContain('Bearer');
    });
  });

  it('does not navigate when /auth/login omits auth_url', () => {
    const secretUrl = 'https://schwab.example/authorize?state=secret-value';
    spyOn(service, 'getFirebaseIdToken').and.resolveTo('test-token');
    const open = spyOn(window, 'open');
    const errorLog = spyOn(console, 'error');
    let message: string | null = null;
    service.schwabConnectError$.subscribe((value) => {
      message = value;
    });

    service.connectSchwab().subscribe();

    return Promise.resolve().then(() => {
      const login = http.expectOne(`${environment.apiUrl}/auth/login`);
      login.flush({ authorization_url: secretUrl, detail: 'Bearer test-token' });

      expect(open).not.toHaveBeenCalled();
      expect(message).toBe('Could not connect to Schwab. No connect link was returned.');
      const logged = errorLog.calls.allArgs().flat().map(String).join(' ');
      expect(logged).not.toContain('secret-value');
      expect(logged).not.toContain('test-token');
      expect(logged).not.toContain('Bearer');
    });
  });
});
