import { supabase } from '../lib/supabase';
import { CartItem } from '../types';

export const submitOrder = async (tableNumber: string, cartItems: CartItem[]) => {
  try {
    // 1. Calculate total
    const total = cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);

    // 2. Create Order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        table_number: tableNumber,
        total: total,
        status: 'pending'
      })
      .select()
      .single();

    if (orderError) throw orderError;
    if (!order) throw new Error('Failed to create order');

    // 3. Create Order Items
    const orderItems = cartItems.map(item => ({
      order_id: order.id,
      product_id: item.id,
      quantity: item.quantity,
      observation: item.observation
    }));

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems);

    if (itemsError) throw itemsError;

    return order;
  } catch (error) {
    console.error('Error submitting order:', error);
    throw error;
  }
};
