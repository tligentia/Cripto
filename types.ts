
import { LucideIcon } from 'lucide-react';

export type CurrencyCode = 'USD' | 'EUR' | 'JPY' | 'BTC' | 'ETH';

export type AssetType = 'CRYPTO' | 'STOCK';

export type TimeRange = '1H' | '1D' | '1W' | '1M' | '3M' | 'YTD' | '1Y' | 'MAX';

export interface Asset {
  symbol: string;
  name: string;
  type?: AssetType; // Optional for backward compatibility, defaults to CRYPTO if undefined
  isFavorite?: boolean;
}

export interface PortfolioAsset extends Asset {
  id: string;
  amount: number;
  purchasePrice: number;
  purchaseDate: string;
  expenses: number; // Nuevo campo para gastos/comisiones
  currentPrice?: number;
  value?: number;
  pnl?: number;
  pnlPercent?: number;
  comments?: string;
}

export interface Portfolio {
  id: string;
  name: string;
  description: string;
  assets: PortfolioAsset[];
  createdAt: number;
}

export interface StageConfig {
  id: number;
  name: string;
  action: string;
  color: string;
  bg: string;
  icon: LucideIcon;
}

export interface Pivots {
  s1: number;
  r1: number;
}

export interface FibonacciLevels {
  f236: number;
  f382: number;
  f500: number;
  f618: number;
  f786: number;
}

export interface TimeframeAnalysis {
  price: number;
  ma20: number | null;
  rsi: number;
  stage: StageConfig;
  pivots: Pivots;
  fibonacci: FibonacciLevels;
}

export interface MarketData {
  daily: TimeframeAnalysis;
  weekly: TimeframeAnalysis | null;
  monthly: TimeframeAnalysis | null;
}

export interface FearGreedData {
  value: string;
  value_classification: string;
  timestamp: string;
  time_until_update: string;
}

export interface CurrencyConfig {
  code: CurrencyCode;
  symbol: string;
  name: string;
  isCrypto: boolean;
}
