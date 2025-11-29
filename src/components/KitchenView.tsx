import { useState, useEffect } from 'react';
import { Clock, CheckCircle, Printer } from 'lucide-react';
import { supabase } from '../lib/supabase';

type OrderItem = {
  id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  notes: string;
  status: 'pending' | 'preparing' | 'ready' | 'delivered';
  created_at: string;
  product_name: string;
  table_number: string;
};

export function KitchenView() {
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [filter, setFilter] = useState<'all' | 'pending' | 'preparing'>('all');

  useEffect(() => {
    loadOrderItems();
    const interval = setInterval(loadOrderItems, 5000);
    return () => clearInterval(interval);
  }, []);

  const loadOrderItems = async () => {
    const { data: items } = await supabase
      .from('order_items')
      .select('*')
      .in('status', ['pending', 'preparing'])
      .order('created_at', { ascending: true });

    if (items) {
      const enrichedItems = await Promise.all(
        items.map(async (item) => {
          const { data: product } = await supabase
            .from('products')
            .select('name')
            .eq('id', item.product_id!)
            .single();

          const { data: order } = await supabase
            .from('orders')
            .select('table_id')
            .eq('id', item.order_id!)
            .single();

          let tableNumber = '';
          if (order?.table_id) {
            const { data: table } = await supabase
              .from('tables')
              .select('number')
              .eq('id', order.table_id)
              .single();
            tableNumber = table?.number || '';
          }

          return {
            ...item,
            product_name: product?.name || 'Produto',
            table_number: tableNumber,
          };
        })
      );

      setOrderItems(enrichedItems);
    }
  };

  const updateItemStatus = async (itemId: string, status: 'preparing' | 'ready') => {
    await supabase
      .from('order_items')
      .update({ status })
      .eq('id', itemId);

    loadOrderItems();
  };

  const printItem = (item: OrderItem) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>Impressão - Cozinha</title>
          <style>
            body { font-family: monospace; padding: 20px; }
            h1 { font-size: 24px; margin-bottom: 10px; }
            .info { font-size: 18px; margin: 10px 0; }
            .quantity { font-size: 32px; font-weight: bold; margin: 20px 0; }
          </style>
        </head>
        <body>
          <h1>${item.product_name}</h1>
          <div class="info">Mesa: ${item.table_number}</div>
          <div class="quantity">Quantidade: ${item.quantity}</div>
          ${item.notes ? `<div class="info">Obs: ${item.notes}</div>` : ''}
          <div class="info">Horário: ${new Date(item.created_at).toLocaleTimeString('pt-BR')}</div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const filteredItems = orderItems.filter(item => {
    if (filter === 'all') return true;
    return item.status === filter;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 dark:bg-yellow-900/30 border-yellow-400 dark:border-yellow-600 text-yellow-800 dark:text-yellow-200';
      case 'preparing':
        return 'bg-primary-100 dark:bg-primary-900/30 border-primary-400 dark:border-primary-600 text-primary-800 dark:text-primary-200';
      default:
        return 'bg-gray-100 dark:bg-gray-800 border-gray-400 dark:border-gray-600 text-gray-800 dark:text-gray-200';
    }
  };

  const getTimeElapsed = (createdAt: string) => {
    const minutes = Math.floor((Date.now() - new Date(createdAt).getTime()) / 60000);
    return minutes;
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-slate-800 dark:text-white">Cozinha / Produção</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-xl font-medium transition-all ${
              filter === 'all'
                ? 'bg-slate-800 dark:bg-slate-700 text-white shadow-lg shadow-slate-800/25'
                : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600'
            }`}
          >
            Todos ({orderItems.length})
          </button>
          <button
            onClick={() => setFilter('pending')}
            className={`px-4 py-2 rounded-xl font-medium transition-all ${
              filter === 'pending'
                ? 'bg-yellow-600 text-white shadow-lg shadow-yellow-600/25'
                : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600'
            }`}
          >
            Pendentes ({orderItems.filter(i => i.status === 'pending').length})
          </button>
          <button
            onClick={() => setFilter('preparing')}
            className={`px-4 py-2 rounded-xl font-medium transition-all ${
              filter === 'preparing'
                ? 'bg-primary-600 text-white shadow-lg shadow-primary-600/25'
                : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600'
            }`}
          >
            Em Preparo ({orderItems.filter(i => i.status === 'preparing').length})
          </button>
        </div>
      </div>

      {filteredItems.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-slate-500 dark:text-slate-400 text-xl">Nenhum pedido na fila</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredItems.map(item => {
            const timeElapsed = getTimeElapsed(item.created_at);
            const isUrgent = timeElapsed >= 15;

            return (
              <div
                key={item.id}
                className={`border rounded-xl p-4 shadow-lg transition-all ${getStatusColor(item.status)} ${
                  isUrgent ? 'ring-4 ring-red-500 ring-opacity-50' : ''
                }`}
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <div className="text-sm font-medium opacity-75">Mesa {item.table_number}</div>
                    <h3 className="text-2xl font-bold mt-1">{item.product_name}</h3>
                  </div>
                  <div className="text-right">
                    <div className={`text-3xl font-bold ${isUrgent ? 'text-red-600' : ''}`}>
                      {item.quantity}x
                    </div>
                    <div className="flex items-center gap-1 text-sm mt-1 opacity-75">
                      <Clock size={14} />
                      {timeElapsed} min
                    </div>
                  </div>
                </div>

                {item.notes && (
                  <div className="bg-white/50 dark:bg-slate-800/50 rounded-lg p-3 mb-4 backdrop-blur-sm">
                    <div className="text-xs font-bold uppercase tracking-wider mb-1 opacity-70">Observações</div>
                    <div className="text-sm font-medium">{item.notes}</div>
                  </div>
                )}

                <div className="flex gap-2">
                  <button
                    onClick={() => printItem(item)}
                    className="flex-1 bg-white/80 dark:bg-slate-800/80 hover:bg-white dark:hover:bg-slate-700 text-slate-800 dark:text-white py-2 rounded-xl font-medium transition-colors flex items-center justify-center gap-2 backdrop-blur-sm"
                  >
                    <Printer size={18} />
                    Imprimir
                  </button>
                  {item.status === 'pending' && (
                    <button
                      onClick={() => updateItemStatus(item.id, 'preparing')}
                      className="flex-1 bg-primary-600 hover:bg-primary-700 text-white py-2 rounded-xl font-medium transition-colors shadow-lg shadow-primary-600/20"
                    >
                      Iniciar
                    </button>
                  )}
                  {item.status === 'preparing' && (
                    <button
                      onClick={() => updateItemStatus(item.id, 'ready')}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded-xl font-medium transition-colors flex items-center justify-center gap-2 shadow-lg shadow-green-600/20"
                    >
                      <CheckCircle size={18} />
                      Pronto
                    </button>
                  )}
                </div>

                <div className="mt-3 text-xs opacity-60 text-center font-medium">
                  Pedido às {new Date(item.created_at).toLocaleTimeString('pt-BR')}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
