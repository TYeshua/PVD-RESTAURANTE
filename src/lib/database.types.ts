export type Database = {
  public: {
    Tables: {
      categories: {
        Row: {
          id: string;
          name: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          created_at?: string;
        };
      };
      products: {
        Row: {
          id: string;
          category_id: string | null;
          name: string;
          price: number;
          active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          category_id?: string | null;
          name: string;
          price?: number;
          active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          category_id?: string | null;
          name?: string;
          price?: number;
          active?: boolean;
          created_at?: string;
        };
      };
      tables: {
        Row: {
          id: string;
          number: string;
          status: 'open' | 'closed';
          created_at: string;
        };
        Insert: {
          id?: string;
          number: string;
          status?: 'open' | 'closed';
          created_at?: string;
        };
        Update: {
          id?: string;
          number?: string;
          status?: 'open' | 'closed';
          created_at?: string;
        };
      };
      orders: {
        Row: {
          id: string;
          table_id: string | null;
          status: 'pending' | 'preparing' | 'ready' | 'delivered' | 'paid';
          total: number;
          created_at: string;
          closed_at: string | null;
        };
        Insert: {
          id?: string;
          table_id?: string | null;
          status?: 'pending' | 'preparing' | 'ready' | 'delivered' | 'paid';
          total?: number;
          created_at?: string;
          closed_at?: string | null;
        };
        Update: {
          id?: string;
          table_id?: string | null;
          status?: 'pending' | 'preparing' | 'ready' | 'delivered' | 'paid';
          total?: number;
          created_at?: string;
          closed_at?: string | null;
        };
      };
      order_items: {
        Row: {
          id: string;
          order_id: string | null;
          product_id: string | null;
          quantity: number;
          unit_price: number;
          notes: string;
          status: 'pending' | 'preparing' | 'ready' | 'delivered';
          created_at: string;
        };
        Insert: {
          id?: string;
          order_id?: string | null;
          product_id?: string | null;
          quantity?: number;
          unit_price: number;
          notes?: string;
          status?: 'pending' | 'preparing' | 'ready' | 'delivered';
          created_at?: string;
        };
        Update: {
          id?: string;
          order_id?: string | null;
          product_id?: string | null;
          quantity?: number;
          unit_price?: number;
          notes?: string;
          status?: 'pending' | 'preparing' | 'ready' | 'delivered';
          created_at?: string;
        };
      };
    };
  };
};
