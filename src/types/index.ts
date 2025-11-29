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
  tableId: string;
  items: CartItem[];
  status: 'open' | 'closed';
  total: number;
}
