import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Order } from '../types';

export const useRealtimeOrders = () => {
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    // 1. Fetch initial orders
    const fetchOrders = async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('*, items:order_items(*, product:products(*))')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching orders:', error);
      } else {
        setOrders(data || []);
      }
    };

    fetchOrders();

    // 2. Subscribe to realtime changes
    const channel = supabase
      .channel('orders-channel')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'orders',
        },
        async (payload) => {
          console.log('New order received!', payload);
          
          // Fetch the full order with items to ensure we have complete data
          const { data: newOrder, error } = await supabase
            .from('orders')
            .select('*, items:order_items(*, product:products(*))')
            .eq('id', payload.new.id)
            .single();

          if (!error && newOrder) {
            setOrders((prevOrders) => [newOrder, ...prevOrders]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return { orders };
};
