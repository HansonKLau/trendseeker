import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { provideRouter } from '@angular/router';
import { BehaviorSubject, of, throwError } from 'rxjs';

import { Header } from './header';
import { AuthService } from '../../services/auth-service';
import { UserInfoService } from '../../services/user-info-service';

describe('Header', () => {
  let component: Header;
  let fixture: ComponentFixture<Header>;
  let schwabLogout: jasmine.Spy;
  let googleLogout: jasmine.Spy;
  let setSchwabConnected: jasmine.Spy;
  let navigate: jasmine.Spy;

  beforeEach(async () => {
    schwabLogout = jasmine
      .createSpy('schwabLogout')
      .and.returnValue(of({ message: 'Logged out successfully' }));
    googleLogout = jasmine.createSpy('googleLogout').and.resolveTo(undefined);
    setSchwabConnected = jasmine.createSpy('setSchwabConnected');

    await TestBed.configureTestingModule({
      imports: [Header],
      providers: [
        provideRouter([]),
        {
          provide: AuthService,
          useValue: {
            user$: new BehaviorSubject({ uid: 'user-1' }),
            schwabLogout,
            googleLogout,
            setSchwabConnected,
            schwabIsLoggedIn: () => of({ logged_in: true }),
            firebaseLoggedIn: () => true,
          },
        },
        { provide: UserInfoService, useValue: {} },
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

  function clickLogout(): void {
    const button = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
    expect(button.textContent).toContain('Logout');
    button.click();
  }
});
