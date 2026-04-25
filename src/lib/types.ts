import type { Database } from './database.types';

export type Profile = Database['public']['Tables']['profiles']['Row'];
export type BilliardTable = Database['public']['Tables']['billiard_tables']['Row'];
export type Setting = Database['public']['Tables']['settings']['Row'];
export type Product = Database['public']['Tables']['products']['Row'];
export type Session = Database['public']['Tables']['sessions']['Row'];
export type SessionOrder = Database['public']['Tables']['session_orders']['Row'];
export type StockMovement = Database['public']['Tables']['stock_movements']['Row'];
export type SessionRound = Database['public']['Tables']['session_rounds']['Row'];

export interface SessionWithDetails extends Session {
  billiard_tables?: BilliardTable;
  profiles?: Profile;
  session_orders?: SessionOrder[];
  session_rounds?: SessionRound[];
}

export interface TableWithSession extends BilliardTable {
  active_session?: SessionWithDetails | null;
}

export interface BillingBreakdown {
  dayMinutes: number;
  nightMinutes: number;
  dayCost: number;
  nightCost: number;
  totalPlayCost: number;
}

export interface RateConfig {
  dayRate: number;
  nightRate: number;
}

export type PaymentMethod = 'cash' | 'card' | 'mixed';
