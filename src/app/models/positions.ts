import { HttpErrorResponse } from '@angular/common/http';

/** Read-only row shown in the dashboard positions table. */
export interface PositionView {
  symbol: string;
  quantity: number;
  averageCost: number;
  marketValue: number;
  unrealizedGainLoss: number;
}

export class SchwabNotConnectedError extends Error {
  constructor() {
    super('Schwab is not connected');
    this.name = 'SchwabNotConnectedError';
  }
}

/**
 * GET /api/user/positions is not on the deployed API yet (draft
 * trendseeker-api#1). Accept the Schwab position documents this app already
 * models, including account wrappers, and a flattened row in either camelCase
 * or the snake_case used by the rest of this API.
 */
export function parsePositionsResponse(body: unknown): PositionView[] {
  return extractPositionItems(body).map((item) => toPositionView(item));
}

export function responseIndicatesDisconnected(body: unknown): boolean {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return false;
  }

  const record = body as Record<string, unknown>;
  if (
    record['logged_in'] === false ||
    record['connected'] === false ||
    record['schwab_connected'] === false ||
    record['schwabConnected'] === false
  ) {
    return true;
  }

  return detailIndicatesDisconnected(record['detail']);
}

export function classifyPositionsError(err: unknown): 'not-connected' | 'error' {
  if (err instanceof SchwabNotConnectedError) {
    return 'not-connected';
  }

  if (err instanceof HttpErrorResponse && detailIndicatesDisconnected(err.error)) {
    return 'not-connected';
  }

  return 'error';
}

function detailIndicatesDisconnected(detail: unknown): boolean {
  if (typeof detail === 'string') {
    return isNotConnectedMessage(detail);
  }

  if (detail && typeof detail === 'object' && !Array.isArray(detail)) {
    const record = detail as Record<string, unknown>;
    if (typeof record['detail'] === 'string' && isNotConnectedMessage(record['detail'])) {
      return true;
    }
    if (typeof record['message'] === 'string' && isNotConnectedMessage(record['message'])) {
      return true;
    }
  }

  return false;
}

function isNotConnectedMessage(message: string): boolean {
  const text = message.toLowerCase();
  if (text.includes('not authenticated') && !text.includes('schwab')) {
    return false;
  }

  return (
    text.includes('not connected to schwab') ||
    text.includes('schwab account not connected') ||
    text.includes('schwab not connected') ||
    (text.includes('schwab') &&
      (text.includes('not connected') ||
        text.includes('not logged') ||
        text.includes('no refresh') ||
        text.includes('no token') ||
        text.includes('reconnect')))
  );
}

function extractPositionItems(body: unknown): unknown[] {
  if (Array.isArray(body)) {
    return body.flatMap((item) => positionsInside(item) ?? [item]);
  }

  if (body && typeof body === 'object') {
    const nested = positionsInside(body);
    if (nested) {
      return nested;
    }

    const record = body as Record<string, unknown>;
    if (record['symbol'] || record['instrument']) {
      return [body];
    }
  }

  throw new Error('Unexpected positions response');
}

function positionsInside(value: unknown): unknown[] | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }

  const record = value as Record<string, unknown>;
  if (Array.isArray(record['positions'])) {
    return record['positions'];
  }

  const account = record['securitiesAccount'];
  if (account && typeof account === 'object' && !Array.isArray(account)) {
    const positions = (account as Record<string, unknown>)['positions'];
    if (Array.isArray(positions)) {
      return positions;
    }
  }

  return null;
}

function toPositionView(item: unknown): PositionView {
  if (!item || typeof item !== 'object' || Array.isArray(item)) {
    throw new Error('Invalid position');
  }

  const row = item as Record<string, unknown>;
  const symbol = readSymbol(row);
  if (!symbol) {
    throw new Error('Position is missing a symbol');
  }

  const longQuantity = readNumber(row['longQuantity']);
  const shortQuantity = readNumber(row['shortQuantity']);
  const quantity =
    longQuantity !== undefined || shortQuantity !== undefined
      ? (longQuantity ?? 0) - (shortQuantity ?? 0)
      : (readNumber(row['quantity']) ?? 0);

  const averageCost =
    readNumber(row['averagePrice']) ??
    readNumber(row['average_price']) ??
    (quantity < 0 ? readNumber(row['averageShortPrice']) : readNumber(row['averageLongPrice'])) ??
    readNumber(row['averageCost']) ??
    readNumber(row['average_cost']) ??
    0;

  const marketValue = readNumber(row['marketValue']) ?? readNumber(row['market_value']) ?? 0;

  const longOpen = readNumber(row['longOpenProfitLoss']);
  const shortOpen = readNumber(row['shortOpenProfitLoss']);
  const unrealizedGainLoss =
    readNumber(row['unrealizedGainLoss']) ??
    readNumber(row['unrealized_gain_loss']) ??
    readNumber(row['gainLoss']) ??
    readNumber(row['gain_loss']) ??
    (longOpen !== undefined || shortOpen !== undefined
      ? (longOpen ?? 0) + (shortOpen ?? 0)
      : marketValue - averageCost * quantity);

  return {
    symbol,
    quantity,
    averageCost,
    marketValue,
    unrealizedGainLoss,
  };
}

function readSymbol(row: Record<string, unknown>): string | undefined {
  const instrument = row['instrument'];
  if (instrument && typeof instrument === 'object' && !Array.isArray(instrument)) {
    const symbol = readString((instrument as Record<string, unknown>)['symbol']);
    if (symbol) {
      return symbol;
    }
  }

  return readString(row['symbol']);
}

function readString(value: unknown): string | undefined {
  if (typeof value !== 'string') {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed === '' ? undefined : trimmed;
}

function readNumber(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return undefined;
}
