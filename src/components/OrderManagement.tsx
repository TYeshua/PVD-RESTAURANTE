import { useState, useEffect } from 'react';
import { Plus, ShoppingCart, Trash2, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Database } from '../lib/database.types';

type Table = Database['public']['Tables']['tables']['Row'];
type Order = Database['public']['Tables']['orders']['Row'];
type Product = Database['public']['Tables']['products']['Row'];
type Category = Database['public']['Tables']['categories']['Row'];

type OrderWithItems = Order & {
  items?: Array<{
    id: string;
    product_id: string;
    quantity: number;
    unit_price: number;
    notes: string;
    product_name: string;
  }>;
};

export function OrderManagement() {
  const [tables, setTables] = useState<Table[]>([]);
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [currentOrder, setCurrentOrder] = useState<OrderWithItems | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showOrderModal, setShowOrderModal] = useState(false);

  useEffect(() => {
    loadTables();
    loadProducts();
    loadCategories();
  }, []);

  const loadTables = async () => {
    const { data } = await supabase
      .from('tables')
      .select('*')
      .order('number');
    if (data) setTables(data);
  };

  const loadProducts = async () => {
    const { data } = await supabase
      .from('products')
      .select('*')
      .eq('active', true)
      .order('name');
    if (data) setProducts(data);
  };

  const loadCategories = async () => {
    const { data } = await supabase
      .from('categories')
      .select('*')
      .order('name');
    if (data) setCategories(data);
  };

  const openTable = async (table: Table) => {
    if (table.status === 'closed') {
      await supabase
        .from('tables')
        .update({ status: 'open' })
        .eq('id', table.id);
    }

    const { data: orderData } = await supabase
      .from('orders')
      .select('*')
      .eq('table_id', table.id)
      .neq('status', 'paid')
      .maybeSingle();

    if (!orderData) {
      const { data: newOrder } = await supabase
        .from('orders')
        .insert({ table_id: table.id, status: 'pending', total: 0 })
        .select()
        .single();

      if (newOrder) {
        setCurrentOrder({ ...newOrder, items: [] });
      }
    } else {
      const { data: items } = await supabase
        .from('order_items')
        .select('id, product_id, quantity, unit_price, notes')
        .eq('order_id', orderData.id);

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

      setCurrentOrder({ ...orderData, items: itemsWithNames });
    }

    setSelectedTable(table);
    setShowOrderModal(true);
    loadTables();
  };

  const addItemToOrder = async (product: Product) => {
    if (!currentOrder) return;

    const existingItem = currentOrder.items?.find(
      item => item.product_id === product.id
    );

    if (existingItem) {
      await supabase
        .from('order_items')
        .update({ quantity: existingItem.quantity + 1 })
        .eq('id', existingItem.id);
    } else {
      await supabase
        .from('order_items')
        .insert({
          order_id: currentOrder.id,
          product_id: product.id,
          quantity: 1,
          unit_price: product.price,
          status: 'pending',
        });
    }

    const newTotal = currentOrder.items
      ? currentOrder.items.reduce((sum, item) => {
          if (item.product_id === product.id) {
            return sum + product.price * (existingItem ? existingItem.quantity + 1 : 1);
          }
          return sum + item.unit_price * item.quantity;
        }, existingItem ? 0 : product.price)
      : product.price;

    await supabase
      .from('orders')
      .update({ total: newTotal })
      .eq('id', currentOrder.id);

    const { data: orderData } = await supabase
      .from('orders')
      .select('*')
      .eq('id', currentOrder.id)
      .single();

    const { data: items } = await supabase
      .from('order_items')
      .select('id, product_id, quantity, unit_price, notes')
      .eq('order_id', currentOrder.id);

    const itemsWithNames = await Promise.all(
      (items || []).map(async (item) => {
        const { data: prod } = await supabase
          .from('products')
          .select('name')
          .eq('id', item.product_id!)
          .single();
        return {
          ...item,
          product_name: prod?.name || 'Produto',
        };
      })
    );

    if (orderData) {
      setCurrentOrder({ ...orderData, items: itemsWithNames });
    }
  };

  const removeItem = async (itemId: string) => {
    if (!currentOrder) return;

    await supabase
      .from('order_items')
      .delete()
      .eq('id', itemId);

    const { data: items } = await supabase
      .from('order_items')
      .select('unit_price, quantity')
      .eq('order_id', currentOrder.id);

    const newTotal = items?.reduce((sum, item) => sum + item.unit_price * item.quantity, 0) || 0;

    await supabase
      .from('orders')
      .update({ total: newTotal })
      .eq('id', currentOrder.id);

    const { data: orderData } = await supabase
      .from('orders')
      .select('*')
      .eq('id', currentOrder.id)
      .single();

    const { data: updatedItems } = await supabase
      .from('order_items')
      .select('id, product_id, quantity, unit_price, notes')
      .eq('order_id', currentOrder.id);

    const itemsWithNames = await Promise.all(
      (updatedItems || []).map(async (item) => {
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

    if (orderData) {
      setCurrentOrder({ ...orderData, items: itemsWithNames });
    }
  };

  const closeModal = () => {
    setShowOrderModal(false);
    setSelectedTable(null);
    setCurrentOrder(null);
  };

  const filteredProducts = selectedCategory === 'all'
    ? products
    : products.filter(p => p.category_id === selectedCategory);

  return (
    <div className="max-w-7xl mx-auto p-6">
      <h1 className="text-3xl font-bold text-slate-800 dark:text-white mb-6">Comandas e Mesas</h1>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {tables.map(table => (
          <button
            key={table.id}
            onClick={() => openTable(table)}
            className={`p-6 rounded-2xl shadow-lg transition-all transform hover:scale-105 ${
              table.status === 'open'
                ? 'bg-accent-500 text-white shadow-accent-500/30'
                : 'bg-green-500 text-white hover:bg-green-600 shadow-green-500/30'
            }`}
          >
            <div className="text-center">
              <div className="text-3xl font-bold mb-2">Mesa {table.number}</div>
              <div className="text-sm opacity-90">
                {table.status === 'open' ? 'Ocupada' : 'Livre'}
              </div>
            </div>
          </button>
        ))}
      </div>

      {showOrderModal && currentOrder && selectedTable && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-6xl h-5/6 flex flex-col transition-colors duration-200 overflow-hidden">
            <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
              <h2 className="text-2xl font-bold text-slate-800 dark:text-white">
                Mesa {selectedTable.number}
              </h2>
              <button
                onClick={closeModal}
                className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <div className="flex-1 overflow-hidden flex">
              <div className="w-2/3 p-6 overflow-y-auto border-r border-slate-200 dark:border-slate-700 custom-scrollbar">
                <div className="mb-6 flex gap-2 flex-wrap">
                  <button
                    onClick={() => setSelectedCategory('all')}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                      selectedCategory === 'all'
                        ? 'bg-primary-600 text-white shadow-lg shadow-primary-600/25'
                        : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                    }`}
                  >
                    Todos
                  </button>
                  {categories.map(cat => (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedCategory(cat.id)}
                      className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                        selectedCategory === cat.id
                          ? 'bg-primary-600 text-white shadow-lg shadow-primary-600/25'
                          : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                      }`}
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {filteredProducts.map(product => (
                    <button
                      key={product.id}
                      onClick={() => addItemToOrder(product)}
                      className="group bg-white dark:bg-slate-700/50 hover:bg-primary-50 dark:hover:bg-primary-900/20 border border-slate-200 dark:border-slate-600 hover:border-primary-400 dark:hover:border-primary-500 rounded-xl p-4 text-left transition-all hover:shadow-md"
                    >
                      <div className="font-semibold text-slate-800 dark:text-slate-200 group-hover:text-primary-700 dark:group-hover:text-primary-300 transition-colors">{product.name}</div>
                      <div className="text-lg font-bold text-primary-600 dark:text-primary-400 mt-2">
                        R$ {product.price.toFixed(2)}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="w-1/3 flex flex-col bg-slate-50 dark:bg-slate-900/50">
                <div className="flex-1 p-6 overflow-y-auto custom-scrollbar">
                  <h3 className="font-bold text-lg mb-4 text-slate-800 dark:text-white flex items-center gap-2">
                    <ShoppingCart size={20} className="text-primary-500" />
                    Pedido Atual
                  </h3>
                  {currentOrder.items && currentOrder.items.length > 0 ? (
                    <div className="space-y-3">
                      {currentOrder.items.map(item => (
                        <div
                          key={item.id}
                          className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm border border-slate-100 dark:border-slate-700 flex justify-between items-start group"
                        >
                          <div className="flex-1">
                            <div className="font-medium text-slate-800 dark:text-slate-200">
                              <span className="text-primary-600 dark:text-primary-400 font-bold mr-2">{item.quantity}x</span>
                              {item.product_name}
                            </div>
                            <div className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                              R$ {(item.unit_price * item.quantity).toFixed(2)}
                            </div>
                          </div>
                          <button
                            onClick={() => removeItem(item.id)}
                            className="text-slate-400 hover:text-red-500 p-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-64 text-slate-400 dark:text-slate-500">
                      <ShoppingCart size={48} className="mb-4 opacity-20" />
                      <p>Nenhum item adicionado</p>
                    </div>
                  )}
                </div>

                <div className="p-6 border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
                  <div className="flex justify-between items-end mb-4">
                    <span className="text-slate-500 dark:text-slate-400 font-medium">Total</span>
                    <span className="text-3xl font-bold text-slate-800 dark:text-white">
                      R$ {currentOrder.total.toFixed(2)}
                    </span>
                  </div>
                  <button
                    onClick={closeModal}
                    className="w-full bg-accent-500 hover:bg-accent-600 text-white py-4 rounded-xl font-bold text-lg shadow-lg shadow-accent-500/25 hover:shadow-accent-500/40 transition-all transform hover:-translate-y-0.5 active:translate-y-0"
                  >
                    Confirmar Pedido
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
