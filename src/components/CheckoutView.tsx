import { useState, useEffect } from 'react';
import { Receipt, X, Printer, DollarSign } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Database } from '../lib/database.types';

type Table = Database['public']['Tables']['tables']['Row'];
type Order = Database['public']['Tables']['orders']['Row'];

type OrderWithDetails = Order & {
  table_number: string;
  items: Array<{
    id: string;
    product_name: string;
    quantity: number;
    unit_price: number;
  }>;
};

export function CheckoutView() {
  const [openTables, setOpenTables] = useState<Table[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<OrderWithDetails | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'money' | 'card' | 'pix'>('money');

  useEffect(() => {
    loadOpenTables();
  }, []);

  const loadOpenTables = async () => {
    const { data } = await supabase
      .from('tables')
      .select('*')
      .eq('status', 'open')
      .order('number');
    if (data) setOpenTables(data);
  };

  const loadOrderDetails = async (table: Table) => {
    const { data: order } = await supabase
      .from('orders')
      .select('*')
      .eq('table_id', table.id)
      .neq('status', 'paid')
      .maybeSingle();

    if (order) {
      const { data: items } = await supabase
        .from('order_items')
        .select('id, product_id, quantity, unit_price')
        .eq('order_id', order.id);

      const itemsWithNames = await Promise.all(
        (items || []).map(async (item) => {
          const { data: product } = await supabase
            .from('products')
            .select('name')
            .eq('id', item.product_id!)
            .single();
          return {
            ...item,
            product_name: product?.name || 'Produto',
          };
        })
      );

      setSelectedOrder({
        ...order,
        table_number: table.number,
        items: itemsWithNames,
      });
      setShowPaymentModal(true);
    }
  };

  const printReceipt = () => {
    if (!selectedOrder) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const itemsHtml = selectedOrder.items
      .map(
        item => `
        <tr>
          <td>${item.quantity}x</td>
          <td>${item.product_name}</td>
          <td style="text-align: right">R$ ${(item.unit_price * item.quantity).toFixed(2)}</td>
        </tr>
      `
      )
      .join('');

    printWindow.document.write(`
      <html>
        <head>
          <title>Comanda - Mesa ${selectedOrder.table_number}</title>
          <style>
            body {
              font-family: 'Courier New', monospace;
              padding: 20px;
              max-width: 300px;
              margin: 0 auto;
            }
            h1 {
              text-align: center;
              font-size: 20px;
              margin-bottom: 20px;
              border-bottom: 2px dashed #333;
              padding-bottom: 10px;
            }
            table {
              width: 100%;
              margin: 20px 0;
              border-collapse: collapse;
            }
            td {
              padding: 5px 0;
            }
            .total-row {
              border-top: 2px dashed #333;
              font-size: 18px;
              font-weight: bold;
              padding-top: 10px;
            }
            .footer {
              text-align: center;
              margin-top: 20px;
              border-top: 2px dashed #333;
              padding-top: 10px;
              font-size: 12px;
            }
          </style>
        </head>
        <body>
          <h1>COMANDA</h1>
          <div style="text-align: center; margin-bottom: 20px;">
            <div style="font-size: 24px; font-weight: bold;">Mesa ${selectedOrder.table_number}</div>
            <div style="font-size: 12px;">${new Date().toLocaleString('pt-BR')}</div>
          </div>
          <table>
            ${itemsHtml}
            <tr class="total-row">
              <td colspan="2">TOTAL</td>
              <td style="text-align: right">R$ ${selectedOrder.total.toFixed(2)}</td>
            </tr>
          </table>
          <div class="footer">
            Obrigado pela preferência!<br>
            Volte sempre!
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const completePayment = async () => {
    if (!selectedOrder) return;

    await supabase
      .from('order_items')
      .update({ status: 'delivered' })
      .eq('order_id', selectedOrder.id);

    await supabase
      .from('orders')
      .update({
        status: 'paid',
        closed_at: new Date().toISOString(),
      })
      .eq('id', selectedOrder.id);

    const { data: order } = await supabase
      .from('orders')
      .select('table_id')
      .eq('id', selectedOrder.id)
      .single();

    if (order?.table_id) {
      await supabase
        .from('tables')
        .update({ status: 'closed' })
        .eq('id', order.table_id);
    }

    setShowPaymentModal(false);
    setSelectedOrder(null);
    loadOpenTables();
  };

  const closeModal = () => {
    setShowPaymentModal(false);
    setSelectedOrder(null);
  };

  const getPaymentMethodLabel = (method: string) => {
    switch (method) {
      case 'money':
        return 'Dinheiro';
      case 'card':
        return 'Cartão';
      case 'pix':
        return 'PIX';
      default:
        return method;
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-6">Fechamento de Conta</h1>

      {openTables.length === 0 ? (
        <div className="text-center py-12">
          <Receipt size={64} className="mx-auto text-gray-400 dark:text-gray-500 mb-4" />
          <p className="text-gray-500 dark:text-gray-400 text-xl">Nenhuma mesa aberta</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {openTables.map(table => (
            <button
              key={table.id}
              onClick={() => loadOrderDetails(table)}
              className="bg-gradient-to-br from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white p-6 rounded-lg shadow-lg transition-all transform hover:scale-105"
            >
              <div className="text-center">
                <div className="text-3xl font-bold mb-2">Mesa {table.number}</div>
                <div className="text-sm opacity-90">Clique para fechar</div>
              </div>
            </button>
          ))}
        </div>
      )}

      {showPaymentModal && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full transition-colors duration-200">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
                Mesa {selectedOrder.table_number}
              </h2>
              <button
                onClick={closeModal}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-6">
              <div className="mb-6">
                <h3 className="font-bold text-lg mb-3 text-gray-800 dark:text-white">Itens da Comanda</h3>
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 space-y-2">
                  {selectedOrder.items.map(item => (
                    <div
                      key={item.id}
                      className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-600 last:border-0"
                    >
                      <div className="text-gray-800 dark:text-gray-200">
                        <span className="font-medium">{item.quantity}x</span> {item.product_name}
                      </div>
                      <div className="font-semibold text-gray-700 dark:text-gray-300">
                        R$ {(item.unit_price * item.quantity).toFixed(2)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mb-6 text-right">
                <div className="text-3xl font-bold text-gray-800 dark:text-white">
                  Total: R$ {selectedOrder.total.toFixed(2)}
                </div>
              </div>

              <div className="mb-6">
                <h3 className="font-bold text-lg mb-3 text-gray-800 dark:text-white">Forma de Pagamento</h3>
                <div className="grid grid-cols-3 gap-3">
                  <button
                    onClick={() => setPaymentMethod('money')}
                    className={`p-4 rounded-lg border-2 transition-all text-gray-800 dark:text-white ${
                      paymentMethod === 'money'
                        ? 'border-primary-600 bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400'
                        : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                    }`}
                  >
                    <DollarSign className="mx-auto mb-2" size={32} />
                    <div className="font-semibold">Dinheiro</div>
                  </button>
                  <button
                    onClick={() => setPaymentMethod('card')}
                    className={`p-4 rounded-lg border-2 transition-all text-gray-800 dark:text-white ${
                      paymentMethod === 'card'
                        ? 'border-primary-600 bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400'
                        : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                    }`}
                  >
                    <Receipt className="mx-auto mb-2" size={32} />
                    <div className="font-semibold">Cartão</div>
                  </button>
                  <button
                    onClick={() => setPaymentMethod('pix')}
                    className={`p-4 rounded-lg border-2 transition-all text-gray-800 dark:text-white ${
                      paymentMethod === 'pix'
                        ? 'border-primary-600 bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400'
                        : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                    }`}
                  >
                    <svg className="mx-auto mb-2" width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                    </svg>
                    <div className="font-semibold">PIX</div>
                  </button>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={printReceipt}
                  className="flex-1 bg-gray-600 hover:bg-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600 text-white py-3 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
                >
                  <Printer size={20} />
                  Imprimir Comanda
                </button>
                <button
                  onClick={completePayment}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-semibold transition-colors"
                >
                  Confirmar Pagamento
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
