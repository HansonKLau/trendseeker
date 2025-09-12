import { TestBed } from '@angular/core/testing';

import { GetStocks } from './get-stocks';

describe('GetStocks', () => {
  let service: GetStocks;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(GetStocks);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
