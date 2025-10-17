export interface Instrument {
  cusip: string;
  symbol: string;
  description: string;
  instrumentId: number;
  netChange: number;
  type: string;
}

export interface Position {
  shortQuantity: number;
  averagePrice: number;
  currentDayProfitLoss: number;
  currentDayProfitLossPercentage: number;
  longQuantity: number;
  settledLongQuantity: number;
  settledShortQuantity: number;
  agedQuantity: number;
  instrument: Instrument;
  marketValue: number;
  maintenanceRequirement: number;
  averageLongPrice: number;
  averageShortPrice: number;
  taxLotAverageLongPrice: number;
  taxLotAverageShortPrice: number;
  longOpenProfitLoss: number;
  shortOpenProfitLoss: number;
  previousSessionLongQuantity: number;
  previousSessionShortQuantity: number;
  currentDayCost: number;
}

export interface Balances {
  availableFunds?: number;
  availableFundsNonMarginableTrade?: number;
  buyingPower?: number;
  buyingPowerNonMarginableTrade?: number;
  cashBalance?: number;
  equity?: number;
  equityPercentage?: number;
  maintenanceRequirement?: number;
  marginBalance?: number;
  regTCall?: number;
  shortBalance?: number;
  [key: string]: number | undefined;
}

export interface SecuritiesAccount {
  accountNumber: string;
  roundTrips: number;
  isDayTrader: boolean;
  isClosingOnlyRestricted: boolean;
  pfcbFlag: boolean;
  positions: Position[];
  initialBalances: Balances;
  currentBalances: Balances;
  projectedBalances: Balances;
}

export interface AccountResponse {
  securitiesAccount: SecuritiesAccount;
}

export interface AccountInfo {
  accountNumber: string;
  hashValue: string;
}