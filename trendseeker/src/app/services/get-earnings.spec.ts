import { TestBed } from '@angular/core/testing';

import { EarningsService } from './get-earnings';

describe('GetEarnings', () => {
  let service: EarningsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(EarningsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
