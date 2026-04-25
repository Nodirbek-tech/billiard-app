export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string;
          role: 'admin' | 'operator';
          phone: string;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['profiles']['Row'], 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>;
      };
      billiard_tables: {
        Row: {
          id: string;
          number: number;
          name: string;
          status: 'available' | 'occupied';
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['billiard_tables']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['billiard_tables']['Insert']>;
      };
      settings: {
        Row: {
          id: string;
          key: string;
          value: string;
          label: string;
          description: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['settings']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['settings']['Insert']>;
      };
      products: {
        Row: {
          id: string;
          name: string;
          category: string;
          price: number;
          stock: number;
          is_active: boolean;
          sold_count: number;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['products']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['products']['Insert']>;
      };
      sessions: {
        Row: {
          id: string;
          table_id: string;
          operator_id: string;
          start_time: string;
          end_time: string | null;
          status: 'active' | 'completed' | 'cancelled';
          play_cost: number;
          products_cost: number;
          total_cost: number;
          payment_method: 'cash' | 'card' | 'mixed' | null;
          receipt_number: string | null;
          customer_name: string;
          notes: string;
          day_minutes: number;
          night_minutes: number;
          day_cost: number;
          night_cost: number;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['sessions']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['sessions']['Insert']>;
      };
      session_orders: {
        Row: {
          id: string;
          session_id: string;
          product_id: string;
          product_name: string;
          quantity: number;
          unit_price: number;
          total_price: number;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['session_orders']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['session_orders']['Insert']>;
      };
      stock_movements: {
        Row: {
          id: string;
          product_id: string;
          quantity_change: number;
          movement_type: 'sale' | 'restock' | 'adjustment' | 'void';
          reference_id: string | null;
          note: string;
          created_by: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['stock_movements']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['stock_movements']['Insert']>;
      };
      session_rounds: {
        Row: {
          id: string;
          session_id: string;
          round_number: number;
          start_time: string;
          end_time: string | null;
          duration_minutes: number;
          day_minutes: number;
          night_minutes: number;
          day_cost: number;
          night_cost: number;
          calculated_cost: number;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['session_rounds']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['session_rounds']['Insert']>;
      };
    };
  };
}
