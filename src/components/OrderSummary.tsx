import React from 'react';
import { useOrderStore } from '../store/useOrderStore';
import { Product } from '../types';

// Mock products for testing adding items
const MOCK_PRODUCTS: Product[] = [
  { id: '1', name: 'Burger', price: 12.50, category: 'Food', printerDestination: 'kitchen' },
  { id: '2', name: 'Fries', price: 5.00, category: 'Food', printerDestination: 'kitchen' },
  { id: '3', name: 'Coke', price: 3.00, category: 'Drink', printerDestination: 'bar' },
  { id: '4', name: 'Beer', price: 6.00, category: 'Drink', printerDestination: 'bar' },
];

export const OrderSummary: React.FC = () => {
  const { 
    items, 
    addItem, 
    removeItem, 
    sendToKitchen, 
    closeTab, 
    getOrderTotal, 
    getDraftCount 
  } = useOrderStore();

  const total = getOrderTotal();
  const draftCount = getDraftCount();

  return (
    <div className="p-6 max-w-2xl mx-auto bg-white rounded-xl shadow-md space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">Table 1 - Order Summary</h2>

      {/* Product Selection Area (Mock) */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        {MOCK_PRODUCTS.map((product) => (
          <button
            key={product.id}
            onClick={() => addItem(product)}
            className="px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium"
          >
            + {product.name} (${product.price.toFixed(2)})
          </button>
        ))}
      </div>

      {/* Order List */}
      <div className="space-y-4">
        {items.length === 0 ? (
          <p className="text-gray-500 text-center py-4">No items in order.</p>
        ) : (
          items.map((item, index) => (
            <div 
              key={`${item.id}-${item.status}-${index}`} 
              className={`flex justify-between items-center p-3 rounded-lg border ${
                item.status === 'draft' ? 'bg-yellow-50 border-yellow-200' : 'bg-green-50 border-green-200'
              }`}
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-gray-800">{item.name}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    item.status === 'draft' ? 'bg-yellow-200 text-yellow-800' : 'bg-green-200 text-green-800'
                  }`}>
                    {item.status === 'draft' ? 'DRAFT' : 'SENT'}
                  </span>
                </div>
                <div className="text-sm text-gray-500">
                  {item.quantity}x ${item.price.toFixed(2)}
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <span className="font-medium text-gray-700">
                  ${(item.price * item.quantity).toFixed(2)}
                </span>
                {item.status === 'draft' && (
                  <button
                    onClick={() => removeItem(item.id)}
                    className="text-red-500 hover:text-red-700 p-1"
                    title="Remove Item"
                  >
                    🗑️
                  </button>
                )}
                {item.status === 'confirmed' && (
                  <span className="text-gray-400 cursor-not-allowed" title="Cannot remove sent items">
                    🔒
                  </span>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer Actions */}
      <div className="border-t pt-4 mt-6">
        <div className="flex justify-between items-center mb-4">
          <span className="text-lg font-semibold text-gray-600">Total:</span>
          <span className="text-2xl font-bold text-gray-900">${total.toFixed(2)}</span>
        </div>

        <div className="flex gap-3">
          <button
            onClick={closeTab}
            className="flex-1 px-4 py-2 border border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition-colors"
          >
            Close Tab
          </button>
          
          <button
            onClick={sendToKitchen}
            disabled={draftCount === 0}
            className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors flex justify-center items-center gap-2 ${
              draftCount > 0 
                ? 'bg-green-600 text-white hover:bg-green-700 shadow-sm' 
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            <span>Send to Kitchen</span>
            {draftCount > 0 && (
              <span className="bg-white text-green-600 text-xs font-bold px-2 py-0.5 rounded-full">
                {draftCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
