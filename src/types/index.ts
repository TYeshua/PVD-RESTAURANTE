export type PrinterDestination = 'kitchen' | 'bar';
export type ItemStatus = 'draft' | 'confirmed';

export interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  printerDestination: PrinterDestination;
}

export interface CartItem extends Product {
  quantity: number;
  observation?: string;
  status: ItemStatus;
}

export interface Order {
  id: string;
  table_number: string;
  status: 'pending' | 'accepted' | 'completed';
  total: number;
  created_at: string;
  items?: OrderItem[];
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  observation?: string;
  product?: Product;
}
