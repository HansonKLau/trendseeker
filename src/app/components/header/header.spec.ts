import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpErrorResponse, provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { provideRouter } from '@angular/router';
import { User } from 'firebase/auth';
import { BehaviorSubject, of, throwError } from 'rxjs';

import { Header } from './header';
import { AuthService } from '../../services/auth-service';
import { environment } from '../../../environments/environment';

describe('Header', () => {
  let component: Header;
  let fixture: ComponentFixture<Header>;
  let schwabLogout: jasmine.Spy;
  let googleLogout: jasmine.Spy;
  let setSchwabConnected: jasmine.Spy;
  let navigate: jasmine.Spy;
  let schwabIsLoggedIn: jasmine.Spy;
  let connectSchwab: jasmine.Spy;
  const user$ = new BehaviorSubject<{ uid: string } | null>({ uid: 'user-1' });
  const connectError$ = new BehaviorSubject<string | null>(null);
  let loggedIn = true;

  beforeEach(async () => {
    user$.next({ uid: 'user-1' });
    connectError$.next(null);
    loggedIn = true;
    schwabLogout = jasmine
      .createSpy('schwabLogout')
      .and.returnValue(of({ message: 'Logged out successfully' }));
    googleLogout = jasmine.createSpy('googleLogout').and.resolveTo(undefined);
    setSchwabConnected = jasmine.createSpy('setSchwabConnected');
    schwabIsLoggedIn = jasmine
      .createSpy('schwabIsLoggedIn')
      .and.callFake(() => of({ logged_in: loggedIn }));
    connectSchwab = jasmine.createSpy('connectSchwab').and.returnValue(of(undefined));

    await TestBed.configureTestingModule({
      imports: [Header],
      providers: [
        provideRouter([]),
        {
          provide: AuthService,
          useValue: {
            user$,
            schwabConnectError$: connectError$,
            schwabLogout,
            googleLogout,
            setSchwabConnected,
            schwabIsLoggedIn,
            connectSchwab,
            clearSchwabConnectError: () => connectError$.next(null),
            reportSchwabConnectError: () => connectError$.next('Could not connect to Schwab.'),
            firebaseLoggedIn: () => true,
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Header);
    component = fixture.componentInstance;
    navigate = spyOn(TestBed.inject(Router), 'navigate').and.resolveTo(true);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('logs out of Schwab before Firebase when Logout is clicked', async () => {
    const order: string[] = [];
    schwabLogout.and.callFake(() => {
      order.push('schwab');
      return of({ message: 'Logged out successfully' });
    });
    googleLogout.and.callFake(() => {
      order.push('firebase');
      return Promise.resolve();
    });

    clickLogout();
    await fixture.whenStable();

    expect(order).toEqual(['schwab', 'firebase']);
    expect(setSchwabConnected).toHaveBeenCalledWith(false);
    expect(component.schwabConnected).toBe(false);
    expect(navigate).toHaveBeenCalledWith(['/']);
  });

  it('still signs out of Firebase when Schwab logout returns 401', async () => {
    const token = 'firebase-id-token-value';
    const order: string[] = [];
    schwabLogout.and.callFake(() => {
      order.push('schwab');
      return throwError(
        () =>
          new HttpErrorResponse({
            status: 401,
            error: { detail: `Bearer ${token}` },
          }),
      );
    });
    googleLogout.and.callFake(() => {
      order.push('firebase');
      return Promise.resolve();
    });
    spyOn(console, 'error');

    clickLogout();
    await fixture.whenStable();

    expect(order).toEqual(['schwab', 'firebase']);
    expect(navigate).toHaveBeenCalledWith(['/']);
    const logged = (console.error as jasmine.Spy).calls.allArgs().flat().map(String).join(' ');
    expect(logged).not.toContain(token);
    expect(logged).not.toContain('Bearer');
  });

  it('still signs out of Firebase when Schwab is not connected', async () => {
    schwabLogout.and.returnValue(throwError(() => new Error('Schwab not connected')));

    await component.logout();

    expect(googleLogout).toHaveBeenCalled();
    expect(navigate).toHaveBeenCalledWith(['/']);
    expect(component.schwabConnected).toBe(false);
  });

  it('shows Connect to Schwab when signed in and Schwab is not connected', () => {
    loggedIn = false;
    user$.next({ uid: 'user-1' });
    fixture.detectChanges();

    const button = findButton('Connect to Schwab');
    expect(button).not.toBeNull();
    button!.click();

    expect(connectSchwab).toHaveBeenCalled();
  });

  it('hides Connect to Schwab when Schwab is already connected', () => {
    expect(fixture.nativeElement.textContent).not.toContain('Connect to Schwab');
  });

  it('hides Connect to Schwab when Firebase has no user', () => {
    schwabIsLoggedIn.calls.reset();
    user$.next(null);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).not.toContain('Connect to Schwab');
    expect(schwabIsLoggedIn).not.toHaveBeenCalled();
  });

  it('checks Schwab status when user$ emits a signed-in user', () => {
    fixture.destroy();
    schwabIsLoggedIn.calls.reset();
    user$.next(null);
    loggedIn = false;

    fixture = TestBed.createComponent(Header);
    fixture.detectChanges();
    expect(schwabIsLoggedIn).not.toHaveBeenCalled();
    expect(fixture.nativeElement.textContent).not.toContain('Connect to Schwab');

    user$.next({ uid: 'user-1' });
    fixture.detectChanges();

    expect(schwabIsLoggedIn).toHaveBeenCalled();
    expect(fixture.nativeElement.textContent).toContain('Connect to Schwab');
  });

  it('shows the Schwab connect error without the response body', () => {
    connectError$.next('Could not connect to Schwab. Sign in again and retry.');
    fixture.detectChanges();

    const alert = fixture.nativeElement.querySelector('[role="alert"]') as HTMLElement;
    expect(alert.textContent).toContain('Could not connect to Schwab. Sign in again and retry.');
    expect(alert.textContent).not.toContain('Bearer');
  });

  function clickLogout(): void {
    const button = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
    expect(button.textContent).toContain('Logout');
    button.click();
  }

  function findButton(label: string): HTMLButtonElement | null {
    const buttons = Array.from(
      fixture.nativeElement.querySelectorAll('button'),
    ) as HTMLButtonElement[];
    return buttons.find((button) => button.textContent?.includes(label)) ?? null;
  }
});

describe('Header Schwab connect request', () => {
  let fixture: ComponentFixture<Header>;
  let component: Header;
  let service: AuthService;
  let http: HttpTestingController;
  const user$ = new BehaviorSubject<User | null>({ uid: 'user-1' } as User);

  beforeEach(async () => {
    user$.next({ uid: 'user-1' } as User);

    await TestBed.configureTestingModule({
      imports: [Header],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    service = TestBed.inject(AuthService);
    service.user$ = user$.asObservable();
    spyOn(service, 'getFirebaseIdToken').and.resolveTo('firebase-id-token');
    spyOn(window, 'open').and.returnValue(window);
    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(Header);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await nextTurn();
    http.expectOne(`${environment.apiUrl}/auth/status`).flush({ logged_in: false });
    fixture.detectChanges();
  });

  afterEach(() => {
    http.verify();
  });

  it('sends the Firebase bearer token when Connect to Schwab is clicked', async () => {
    const secretUrl = 'https://schwab.example/authorize?state=secret-value';
    const log = spyOn(console, 'log');
    const errorLog = spyOn(console, 'error');
    const button = findButton('Connect to Schwab');
    expect(button).not.toBeNull();

    button!.click();
    await nextTurn();

    const login = http.expectOne(`${environment.apiUrl}/auth/login`);
    expect(login.request.method).toBe('GET');
    expect(login.request.withCredentials).toBeTrue();
    expect(login.request.headers.get('Authorization')).toBe('Bearer firebase-id-token');
    login.flush({ auth_url: secretUrl });

    expect(window.open).toHaveBeenCalledOnceWith(secretUrl, '_self');
    const logged = [...log.calls.allArgs(), ...errorLog.calls.allArgs()]
      .flat()
      .map(String)
      .join(' ');
    expect(logged).not.toContain('secret-value');
    expect(logged).not.toContain(secretUrl);
    expect(logged).not.toContain('firebase-id-token');
  });

  it('shows a visible error when Schwab login fails after Google sign-in', async () => {
    const secretUrl = 'https://schwab.example/authorize?state=secret-value';
    spyOn(service, 'googleLogin').and.returnValue(of({ uid: 'user-1' } as User));
    const errorLog = spyOn(console, 'error');

    component.login();
    await nextTurn();
    http.expectOne(`${environment.apiUrl}/auth/status`).flush({ logged_in: false });
    await nextTurn();

    const login = http.expectOne(`${environment.apiUrl}/auth/login`);
    expect(login.request.headers.get('Authorization')).toBe('Bearer firebase-id-token');
    login.flush(
      { detail: `Bearer firebase-id-token`, auth_url: secretUrl },
      { status: 401, statusText: 'Unauthorized' },
    );
    fixture.detectChanges();

    const alert = fixture.nativeElement.querySelector('[role="alert"]') as HTMLElement;
    expect(alert.textContent).toContain('Could not connect to Schwab. Sign in again and retry.');
    expect(window.open).not.toHaveBeenCalled();
    const logged = errorLog.calls.allArgs().flat().map(String).join(' ');
    expect(logged).toContain('401');
    expect(logged).not.toContain('firebase-id-token');
    expect(logged).not.toContain('secret-value');
    expect(logged).not.toContain(secretUrl);
    expect(logged).not.toContain('Bearer');
  });

  function findButton(label: string): HTMLButtonElement | null {
    const buttons = Array.from(
      fixture.nativeElement.querySelectorAll('button'),
    ) as HTMLButtonElement[];
    return buttons.find((button) => button.textContent?.includes(label)) ?? null;
  }

  function nextTurn(): Promise<void> {
    return Promise.resolve().then(() => Promise.resolve());
  }
});
