import { TrendingUp, TrendingDown, Minus, Activity } from 'lucide-react';
import { Asset, StageConfig, CurrencyConfig, CurrencyCode } from '../types';
import { GoogleGenAI } from "@google/genai";
import { obfuscate, deobfuscate } from './Cypto';

// --- SYSTEM CONFIG ---
export const AUTHORIZED_DOMAIN = 'hello.tligent.com';

export const ALLOWED_IPS = [
  '79.112.85.173',
  '37.223.15.63'
];

export const COLORS = {
  bg: 'bg-white',
  card: 'bg-white',
  textMain: 'text-gray-900',
  textSub: 'text-gray-500',
  accentRed: 'text-red-700',
  border: 'border-gray-200',
  btnPrimary: 'bg-gray-900 hover:bg-black text-white',
  btnDanger: 'text-red-600 hover:bg-red-50',
  btnAi: 'bg-gray-900 hover:bg-black text-white', 
  btnProfiles: 'bg-gray-700 hover:bg-gray-800 text-white',
  btnChart: 'bg-white hover:bg-gray-50 text-gray-900 border border-gray-200',
  aiBg: 'bg-gray-50',
  aiText: 'text-gray-900',
  aiBorder: 'border-gray-200'
};

export const DEFAULT_ASSETS: Asset[] = [
  { symbol: 'BTC', name: 'Bitcoin', type: 'CRYPTO' },
  { symbol: 'ETH', name: 'Ethereum', type: 'CRYPTO' },
  { symbol: 'SOL', name: 'Solana', type: 'CRYPTO' },
  { symbol: 'XRP', name: 'Ripple', type: 'CRYPTO' },
  { symbol: 'BNB', name: 'Binance Coin', type: 'CRYPTO' },
  { symbol: 'AAVE', name: 'Aave', type: 'CRYPTO' },
  { symbol: 'JUP', name: 'Jupiter', type: 'CRYPTO' },
  { symbol: 'ZEC', name: 'ZCash', type: 'CRYPTO' },
  { symbol: 'UNI', name: 'Uniswap', type: 'CRYPTO' },
  { symbol: 'DOGE', name: 'Dogecoin', type: 'CRYPTO' },
];

export const TOP_STOCKS: Asset[] = [
  { symbol: 'SPY', name: 'S&P 500 ETF', type: 'STOCK' },
  { symbol: 'NVDA', name: 'NVIDIA Corp', type: 'STOCK' },
  { symbol: 'AAPL', name: 'Apple Inc', type: 'STOCK' },
  { symbol: 'MSFT', name: 'Microsoft', type: 'STOCK' },
  { symbol: 'AMZN', name: 'Amazon', type: 'STOCK' },
  { symbol: 'GOOGL', name: 'Alphabet (Google)', type: 'STOCK' },
  { symbol: 'META', name: 'Meta Platforms', type: 'STOCK' },
  { symbol: 'TSLA', name: 'Tesla Inc', type: 'STOCK' },
];

export const STAGES: Record<number, StageConfig> = {
  1: { id: 1, name: 'Acumul.', action: 'VIGILAR', color: 'text-emerald-500', bg: 'bg-emerald-50 border-emerald-100', icon: Minus },
  2: { id: 2, name: 'Alcista', action: 'COMPRAR', color: 'text-emerald-900', bg: 'bg-emerald-200 border-emerald-300', icon: TrendingUp },
  3: { id: 3, name: 'Distrib.', action: 'ESPERAR', color: 'text-orange-500', bg: 'bg-orange-50 border-orange-100', icon: Activity },
  4: { id: 4, name: 'Bajista', action: 'VENDER', color: 'text-red-600', bg: 'bg-red-50 border-red-100', icon: TrendingDown },
};

export const CURRENCIES: Record<CurrencyCode, CurrencyConfig> = {
  USD: { code: 'USD', symbol: '$', name: 'Dólar', isCrypto: false },
  EUR: { code: 'EUR', symbol: '€', name: 'Euro', isCrypto: false },
  JPY: { code: 'JPY', symbol: '¥', name: 'Yen', isCrypto: false },
  BTC: { code: 'BTC', symbol: '₿', name: 'Bitcoin', isCrypto: true },
  ETH: { code: 'ETH', symbol: 'Ξ', name: 'Ethereum', isCrypto: true },
};

// --- UTILITIES ---
export const crypto = {
  obfuscate,
  deobfuscate
};

const getSystemSLD = (): string => {
  if (typeof window === 'undefined') return "localhost";
  const hostname = window.location.hostname;
  if (!hostname || hostname === 'localhost' || !hostname.includes('.')) return 'localhost';
  const parts = hostname.split('.');
  return parts[parts.length - 2];
};

export const getShortcutKey = (key: string): string | null => {
  const lowerKey = key.toLowerCase().trim();
  
  if (lowerKey === 'ok') {
    const secret = "NSUTBjYXNicpJlE3BxYWXhhSCFhFPzNQVyYZOBI5PR8ECg41Lw4i";
    return crypto.deobfuscate(secret, "tligent");
  } else if (lowerKey === 'cv') {
    const secret = "NSUTBjYXNRczGh8LBEwaBzEuFSpDIFUkOEgKIy5fOi0pHTYgIygi";
    return crypto.deobfuscate(secret, "tligent");
  }
  return null;
};

export const getAllowedIps = (): string[] => {
  const saved = localStorage.getItem('criptogo_allowed_ips');
  const userIps = saved ? JSON.parse(saved) : [];
  return Array.from(new Set([...ALLOWED_IPS, ...userIps]));
};

export const saveAllowedIps = (ips: string[]): void => {
  const userOnlyIps = ips.filter(ip => !ALLOWED_IPS.includes(ip));
  localStorage.setItem('criptogo_allowed_ips', JSON.stringify(userOnlyIps));
};

// --- GEMINI API INTEGRATION ---
const getAI = (key?: string) => new GoogleGenAI({ apiKey: key || process.env.API_KEY || '' });

export const askGemini = async (prompt: string, modelOverride?: string, key?: string): Promise<string> => {
  try {
    const ai = getAI(key);
    const model = modelOverride || localStorage.getItem('app_selected_model') || 'gemini-3-flash-preview';
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
    });
    return response.text || "Sin respuesta del oráculo.";
  } catch (error) {
    console.error("Gemini Error:", error);
    throw error;
  }
};

export const validateKey = async (key?: string): Promise<boolean> => {
  const keyToTest = key || process.env.API_KEY;
  if (!keyToTest) return false;
  
  try {
    const ai = getAI(keyToTest);
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: 'ping',
    });
    return !!response.text;
  } catch (err) {
    console.warn("Validation failed for key:", keyToTest ? "PROVIDED" : "MISSING");
    return false;
  }
};

export const listAvailableModels = async (): Promise<string[]> => {
  return [
    'gemini-3-flash-preview',
    'gemini-3-pro-preview',
    'gemini-flash-lite-latest',
    'gemini-2.5-flash-image',
    'gemini-2.5-flash-preview-tts'
  ];
};