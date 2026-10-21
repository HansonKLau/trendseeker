import { HttpErrorResponse } from '@angular/common/http';
import {
  SchwabNotConnectedError,
  classifyPositionsError,
  parsePositionsResponse,
  responseIndicatesDisconnected,
} from './positions';

describe('parsePositionsResponse', () => {
  const schwabPosition = {
    shortQuantity: 0,
    averagePrice: 178.42,
    longQuantity: 12,
    instrument: { symbol: 'AAPL', description: 'Apple Inc', type: 'EQUITY' },
    marketValue: 2340,
    averageLongPrice: 178.42,
    longOpenProfitLoss: 198.96,
    shortOpenProfitLoss: 0,
  };

  it('maps a Schwab position array', () => {
    expect(parsePositionsResponse([schwabPosition])).toEqual([
      {
        symbol: 'AAPL',
        quantity: 12,
        averageCost: 178.42,
        marketValue: 2340,
        unrealizedGainLoss: 198.96,
      },
    ]);
  });

  it('reads short quantity as a negative share count', () => {
    const [row] = parsePositionsResponse([
      {
        shortQuantity: 4,
        longQuantity: 0,
        averagePrice: 20,
        averageShortPrice: 20,
        instrument: { symbol: 'XYZ' },
        marketValue: -70,
        longOpenProfitLoss: 0,
        shortOpenProfitLoss: -10,
      },
    ]);

    expect(row.quantity).toBe(-4);
    expect(row.averageCost).toBe(20);
    expect(row.unrealizedGainLoss).toBe(-10);
  });

  it('flattens securitiesAccount wrappers', () => {
    const rows = parsePositionsResponse([
      {
        securitiesAccount: {
          accountNumber: '123',
          positions: [schwabPosition],
        },
      },
    ]);

    expect(rows.map((row) => row.symbol)).toEqual(['AAPL']);
  });

  it('reads a snake_case list wrapped in positions', () => {
    expect(
      parsePositionsResponse({
        positions: [
          {
            symbol: 'MSFT',
            quantity: 5,
            average_cost: 410.1,
            market_value: 2125.5,
            unrealized_gain_loss: 75,
          },
        ],
      }),
    ).toEqual([
      {
        symbol: 'MSFT',
        quantity: 5,
        averageCost: 410.1,
        marketValue: 2125.5,
        unrealizedGainLoss: 75,
      },
    ]);
  });

  it('returns an empty list when the account has no positions', () => {
    expect(parsePositionsResponse({ positions: [] })).toEqual([]);
  });

  it('rejects a payload that is not a position list', () => {
    expect(() => parsePositionsResponse({ hello: 'world' })).toThrowError(
      /Unexpected positions response/,
    );
  });
});

describe('connection errors', () => {
  it('detects a disconnected body', () => {
    expect(responseIndicatesDisconnected({ logged_in: false })).toBeTrue();
    expect(responseIndicatesDisconnected({ schwab_connected: false, positions: [] })).toBeTrue();
    expect(responseIndicatesDisconnected({ positions: [] })).toBeFalse();
  });

  it('classifies Schwab connection failures separately from other errors', () => {
    expect(classifyPositionsError(new SchwabNotConnectedError())).toBe('not-connected');
    expect(
      classifyPositionsError(
        new HttpErrorResponse({
          status: 409,
          error: { detail: 'Schwab account not connected' },
        }),
      ),
    ).toBe('not-connected');
    expect(
      classifyPositionsError(
        new HttpErrorResponse({
          status: 401,
          error: { detail: 'Not authenticated' },
        }),
      ),
    ).toBe('error');
  });
});
