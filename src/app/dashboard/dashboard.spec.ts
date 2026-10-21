import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BehaviorSubject, of, throwError } from 'rxjs';
import { Dashboard } from './dashboard';
import { AuthService } from '../services/auth-service';
import { UserInfoService } from '../services/user-info-service';
import { PositionView, SchwabNotConnectedError } from '../models/positions';

describe('Dashboard', () => {
  let fixture: ComponentFixture<Dashboard>;
  const user$ = new BehaviorSubject<object | null>({ uid: 'user-1' });
  const connectError$ = new BehaviorSubject<string | null>(null);
  let loggedIn = true;
  let connectSchwab: jasmine.Spy;
  let positionsResult: () => ReturnType<UserInfoService['getPositions']>;

  const positions: PositionView[] = [
    {
      symbol: 'AAPL',
      quantity: 12,
      averageCost: 178.42,
      marketValue: 2340,
      unrealizedGainLoss: 198.96,
    },
    {
      symbol: 'TSLA',
      quantity: 3,
      averageCost: 250,
      marketValue: 612,
      unrealizedGainLoss: -138,
    },
  ];

  beforeEach(async () => {
    user$.next({ uid: 'user-1' });
    connectError$.next(null);
    loggedIn = true;
    connectSchwab = jasmine.createSpy('connectSchwab').and.returnValue(of(undefined));
    positionsResult = () => of(positions);

    await TestBed.configureTestingModule({
      imports: [Dashboard],
      providers: [
        {
          provide: AuthService,
          useValue: {
            user$,
            authReady: () => Promise.resolve(),
            schwabIsLoggedIn: () => of({ logged_in: loggedIn }),
            schwabConnectError$: connectError$,
            connectSchwab,
          },
        },
        {
          provide: UserInfoService,
          useValue: {
            getPositions: () => positionsResult(),
          },
        },
      ],
    }).compileComponents();
  });

  function create(): Dashboard {
    fixture = TestBed.createComponent(Dashboard);
    fixture.detectChanges();
    return fixture.componentInstance;
  }

  async function settle(): Promise<void> {
    await fixture.whenStable();
    fixture.detectChanges();
  }

  it('shows positions, gain and loss colors, and totals', async () => {
    create();
    await settle();

    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('AAPL');
    expect(text).toContain('TSLA');
    expect(text).toContain('$2,340.00');
    expect(text).toContain('$2,952.00');
    expect(text).toContain('$60.96');

    const gain = fixture.nativeElement.querySelector('tbody .gain') as HTMLElement;
    const loss = fixture.nativeElement.querySelector('tbody .loss') as HTMLElement;
    expect(gain.textContent).toContain('$198.96');
    expect(loss.textContent).toContain('-$138.00');
    expect(fixture.nativeElement.querySelector('button')).toBeNull();
    expect(text.toLowerCase()).not.toContain('buy');
    expect(text.toLowerCase()).not.toContain('sell');
  });

  it('shows an empty state when Schwab returns no positions', async () => {
    positionsResult = () => of([]);
    create();
    await settle();

    expect(fixture.nativeElement.textContent).toContain('No open positions.');
    expect(fixture.nativeElement.querySelector('table')).toBeNull();
  });

  it('shows a not-connected state without calling positions', async () => {
    loggedIn = false;
    const userInfo = TestBed.inject(UserInfoService);
    spyOn(userInfo, 'getPositions').and.returnValue(of([]));
    create();
    await settle();

    expect(fixture.nativeElement.textContent).toContain('Schwab is not connected.');
    expect(userInfo.getPositions).not.toHaveBeenCalled();

    const button = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
    expect(button.textContent).toContain('Connect Schwab');
    button.click();
    expect(connectSchwab).toHaveBeenCalled();
    expect(userInfo.getPositions).not.toHaveBeenCalled();
  });

  it('shows a not-connected state when the positions request says Schwab is disconnected', async () => {
    positionsResult = () => throwError(() => new SchwabNotConnectedError());
    create();
    await settle();

    expect(fixture.nativeElement.textContent).toContain('Schwab is not connected.');
  });

  it('shows a connect failure on the not-connected state', async () => {
    loggedIn = false;
    connectError$.next('Could not connect to Schwab (HTTP 502).');
    create();
    await settle();

    expect(fixture.nativeElement.textContent).toContain('Could not connect to Schwab (HTTP 502).');
    expect(fixture.nativeElement.textContent.toLowerCase()).not.toContain('buy');
    expect(fixture.nativeElement.textContent.toLowerCase()).not.toContain('sell');
  });

  it('shows an error state and retries the load', async () => {
    let calls = 0;
    positionsResult = () => {
      calls += 1;
      return calls === 1 ? throwError(() => new Error('network')) : of(positions);
    };
    create();
    await settle();

    expect(fixture.nativeElement.textContent).toContain('Could not load positions.');
    fixture.nativeElement.querySelector('button').click();
    await settle();

    expect(fixture.nativeElement.textContent).toContain('AAPL');
  });

  it('asks the visitor to sign in when Firebase has no user', async () => {
    user$.next(null);
    create();
    await settle();

    expect(fixture.nativeElement.textContent).toContain('Sign in to view your Schwab positions.');
  });

  it('starts in a loading state', () => {
    const component = create();
    expect(component.status).toBe('loading');
    expect(fixture.nativeElement.textContent).toContain('Loading positions…');
  });
});
