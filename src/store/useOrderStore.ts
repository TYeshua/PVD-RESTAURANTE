import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { CartItem, Product } from '../types';

interface OrderState {
  items: CartItem[];
  tableId: string;
  addItem: (product: Product) => void;
  removeItem: (itemId: string) => void;
  sendToKitchen: () => void;
  closeTab: () => void;
  
  // Getters (computed values are usually derived in the component or via a selector, 
  // but we can expose helper functions or keep state updated)
  getOrderTotal: () => number;
  getDraftCount: () => number;
}

export const useOrderStore = create<OrderState>()(
  persist(
    (set, get) => ({
      items: [],
      tableId: '1', // Default table for now

      addItem: (product: Product) => {
        set((state) => {
          const existingItemIndex = state.items.findIndex(
            (item) => item.id === product.id && item.status === 'draft'
          );

          if (existingItemIndex !== -1) {
            // Increment quantity if item exists and is draft
            const newItems = [...state.items];
            newItems[existingItemIndex].quantity += 1;
            return { items: newItems };
          } else {
            // Add new item
            const newItem: CartItem = {
              ...product,
              quantity: 1,
              status: 'draft',
            };
            return { items: [...state.items, newItem] };
          }
        });
      },

      removeItem: (itemId: string) => {
        const state = get();
        const item = state.items.find((i) => i.id === itemId);

        if (!item) return;

        if (item.status === 'confirmed') {
          console.error('Cannot remove confirmed items.');
          // In a real app, we might throw an error or show a toast
          return;
        }

        set((state) => ({
          items: state.items.filter((i) => i.id !== itemId || i.status !== 'draft'),
        }));
      },

      sendToKitchen: () => {
        set((state) => {
          const draftItems = state.items.filter((item) => item.status === 'draft');
          
          if (draftItems.length === 0) return {};

          console.log('🖨️ Sending to kitchen:', draftItems);

          const updatedItems = state.items.map((item) => 
            item.status === 'draft' ? { ...item, status: 'confirmed' as const } : item
          );

          return { items: updatedItems };
        });
      },

      closeTab: () => {
        const total = get().getOrderTotal();
        console.log(`💰 Closing tab. Total: $${total.toFixed(2)}`);
        set({ items: [] });
      },

      getOrderTotal: () => {
        return get().items.reduce((total, item) => total + (item.price * item.quantity), 0);
      },

      getDraftCount: () => {
        return get().items.filter((item) => item.status === 'draft').length;
      },
    }),
    {
      name: 'restaurant-order-storage', // unique name for localStorage
      storage: createJSONStorage(() => localStorage),
    }
  )
);
