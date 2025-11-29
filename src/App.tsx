import { useState } from 'react';
import { ShoppingCart, ChefHat, Receipt, Menu as MenuIcon, Store } from 'lucide-react';
import { MenuManagement } from './components/MenuManagement';
import { OrderManagement } from './components/OrderManagement';
import { KitchenView } from './components/KitchenView';
import { CheckoutView } from './components/CheckoutView';

import { RestaurantRegistration } from './components/RestaurantRegistration';

import { ThemeProvider } from './context/ThemeContext';
import { ThemeToggle } from './components/ThemeToggle';

type View = 'home' | 'orders' | 'menu' | 'kitchen' | 'checkout' | 'register';

function App() {
  const [currentView, setCurrentView] = useState<View>('home');

  return (
    <ThemeProvider>
      <div className="min-h-screen relative overflow-hidden transition-colors duration-200 font-sans">
        {/* Global Background Layers - Alive Aesthetic */}
        <div className="fixed inset-0 z-0 pointer-events-none">
          {/* Base Background */}
          <div className="absolute inset-0 bg-slate-50 dark:bg-slate-900 transition-colors duration-500" />
          
          {/* Mesh Gradient Blobs */}
          <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-primary-600/20 dark:bg-primary-500/10 blur-[120px] animate-pulse-slow mix-blend-multiply dark:mix-blend-screen" />
          <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] rounded-full bg-blue-500/20 dark:bg-blue-600/10 blur-[120px] animate-pulse-slow delay-1000 mix-blend-multiply dark:mix-blend-screen" />
          <div className="absolute top-[30%] left-[40%] w-[40%] h-[40%] rounded-full bg-secondary-300/30 dark:bg-secondary-200/5 blur-[100px] animate-pulse-slow delay-2000 mix-blend-multiply dark:mix-blend-screen" />
          
          {/* Noise Texture for Texture/Depth */}
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 dark:opacity-10 mix-blend-overlay" />
        </div>

        <div className="relative z-10 flex flex-col min-h-screen">
        <nav className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-md shadow-sm border-b border-slate-200 dark:border-slate-700 transition-colors duration-200 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div 
              className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => setCurrentView('home')}
            >
              <div className="p-2 bg-primary-100 dark:bg-primary-900/30 rounded-xl">
                <ChefHat className="text-primary-600 dark:text-primary-400" size={28} />
              </div>
              <h1 className="text-xl font-bold text-slate-800 dark:text-white tracking-tight">PDV Restaurante</h1>
            </div>
            <div className="flex gap-2 items-center">
              <button
                onClick={() => setCurrentView('orders')}
                className={`px-4 py-2 rounded-xl font-medium transition-all flex items-center gap-2 ${
                  currentView === 'orders'
                    ? 'bg-primary-600 text-white shadow-lg shadow-primary-600/20'
                    : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-600'
                }`}
              >
                <ShoppingCart size={20} />
                Pedidos
              </button>
              <button
                onClick={() => setCurrentView('menu')}
                className={`px-4 py-2 rounded-xl font-medium transition-all flex items-center gap-2 ${
                  currentView === 'menu'
                    ? 'bg-primary-600 text-white shadow-lg shadow-primary-600/20'
                    : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-600'
                }`}
              >
                <MenuIcon size={20} />
                Cardápio
              </button>
              <button
                onClick={() => setCurrentView('kitchen')}
                className={`px-4 py-2 rounded-xl font-medium transition-all flex items-center gap-2 ${
                  currentView === 'kitchen'
                    ? 'bg-primary-600 text-white shadow-lg shadow-primary-600/20'
                    : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-600'
                }`}
              >
                <ChefHat size={20} />
                Cozinha
              </button>
              <button
                onClick={() => setCurrentView('checkout')}
                className={`px-4 py-2 rounded-xl font-medium transition-all flex items-center gap-2 ${
                  currentView === 'checkout'
                    ? 'bg-primary-600 text-white shadow-lg shadow-primary-600/20'
                    : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-600'
                }`}
              >
                <Receipt size={20} />
                Fechar Conta
              </button>
              <button
                onClick={() => setCurrentView('register')}
                className={`px-4 py-2 rounded-xl font-medium transition-all flex items-center gap-2 ${
                  currentView === 'register'
                    ? 'bg-primary-600 text-white shadow-lg shadow-primary-600/20'
                    : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-600'
                }`}
              >
                <Store size={20} />
                Registrar
              </button>
              <div className="ml-2 pl-2 border-l border-slate-200 dark:border-slate-700">
                <ThemeToggle />
              </div>
            </div>
          </div>
        </div>
      </nav>

      <main className="py-6 h-[calc(100vh-64px)] overflow-y-auto custom-scrollbar">
        <div className="max-w-7xl mx-auto px-4">
          {currentView === 'home' && (
            <div className="flex flex-col items-center justify-center h-full text-slate-500 dark:text-slate-400">
              <ChefHat size={64} className="mb-4 opacity-50" />
              <h2 className="text-2xl font-bold">Bem-vindo ao PDV</h2>
              <p>Selecione uma opção no menu acima</p>
            </div>
          )}
          {currentView === 'orders' && <OrderManagement />}
          {currentView === 'menu' && <MenuManagement />}
          {currentView === 'kitchen' && <KitchenView />}
          {currentView === 'checkout' && <CheckoutView />}
          {currentView === 'register' && <RestaurantRegistration />}
        </div>
      </main>

        </div>
      </div>
    </ThemeProvider>
  );
}

export default App;
