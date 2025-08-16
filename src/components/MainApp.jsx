import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LogOut, Receipt, Plus, List, TrendingUp, Settings, Loader2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import ReceiptTab from '@/components/tabs/ReceiptTab.jsx';
import InputTab from '@/components/tabs/InputTab.jsx';
import TransactionTab from '@/components/tabs/TransactionTab.jsx';
import ReportTab from '@/components/tabs/ReportTab.jsx';
import SettingsTab from '@/components/tabs/SettingsTab.jsx';
import { supabase } from '@/lib/customSupabaseClient';

const MainApp = ({ onLogout }) => {
  const [activeTab, setActiveTab] = useState('receipt');
  const [refreshTransactions, setRefreshTransactions] = useState(false);
  const [settings, setSettings] = useState({ store_name: 'Kang Serpis' });
  const [isLoadingSettings, setIsLoadingSettings] = useState(true);
  const [direction, setDirection] = useState(0);
  const [prevIndex, setPrevIndex] = useState(0);
  const tabRefs = useRef([]);

  const tabOrder = ['receipt', 'input', 'transactions', 'reports', 'settings'];

  useEffect(() => {
    const getStoreSettings = async () => {
      setIsLoadingSettings(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setIsLoadingSettings(false);
        return;
      }

      const { data, error } = await supabase
        .from('settings')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (data) {
        setSettings(data);
      } else if (error && error.code !== 'PGRST116') {
        console.error('Error fetching settings:', error);
      }
      setIsLoadingSettings(false);
    };

    getStoreSettings();
  }, []);

  const handleTabChange = (newTab) => {
    const newIndex = tabOrder.indexOf(newTab);
    const oldIndex = tabOrder.indexOf(activeTab);
    setDirection(newIndex > oldIndex ? 1 : -1);
    setPrevIndex(oldIndex);
    setActiveTab(newTab);
  };

  const handleTransactionSave = () => {
    setRefreshTransactions(true);
    setActiveTab('transactions');
  };

  const tabs = [
    { id: 'receipt', label: 'Nota', icon: Receipt },
    { id: 'input', label: 'Input', icon: Plus },
    { id: 'transactions', label: 'Data', icon: List },
    { id: 'reports', label: 'Laporan', icon: TrendingUp },
    { id: 'settings', label: 'Setting', icon: Settings },
  ];

  const getVariant = (index) => {
    const distance = Math.abs(index - prevIndex);
    const offset = 100 * distance;
    
    return {
      hidden: { 
        opacity: 0, 
        x: direction > 0 ? offset : -offset,
        scale: 0.8
      },
      visible: { 
        opacity: 1, 
        x: 0,
        scale: 1,
        transition: { 
          type: "spring", 
          stiffness: 300, 
          damping: 30 
        }
      },
      exit: { 
        opacity: 0, 
        x: direction > 0 ? -offset : offset,
        scale: 0.8,
        transition: { 
          duration: 0.2 
        }
      }
    };
  };

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="glass-effect border-b border-slate-700/50 p-4 flex-shrink-0"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
              <Receipt className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold gradient-text">
                {isLoadingSettings ? <Loader2 className="w-5 h-5 animate-spin" /> : (settings.store_name || 'MAKARYO SERVICE')}
              </h1>
              <p className="text-sm text-gray-400">{isLoadingSettings ? <Loader2 className="w-5 h-5 animate-spin" /> : (settings.store_address || 'Kota Metro')}</p>
            </div>
          </div>
          <Button
            onClick={onLogout}
            variant="ghost"
            size="sm"
            className="text-red-400 hover:text-white"
          >
            <LogOut className="w-6 h-6" />
          </Button>
        </div>
      </motion.header>

      <Tabs value={activeTab} onValueChange={handleTabChange} className="flex flex-col flex-grow overflow-hidden">
        <div className="px-4 pt-4 flex-shrink-0 relative">
          <TabsList className="grid w-full h-18 grid-cols-5 bg-slate-800/50 border border-slate-700/50 rounded-xl relative overflow-hidden">
            {tabs.map((tab, index) => {
              const Icon = tab.icon;
              return (
                <TabsTrigger
                  key={tab.id}
                  value={tab.id}
                  ref={(el) => (tabRefs.current[index] = el)}
                  className="flex flex-col items-center space-y-1 py-3 data-[state=active]:text-white rounded-lg transition-colors duration-200 z-10 relative"
                >
                  <motion.div
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    className="flex flex-col items-center"
                  >
                    <Icon className="w-5 h-5 mb-1" />
                    <span className="text-xs font-medium">{tab.label}</span>
                  </motion.div>
                </TabsTrigger>
              );
            })}
            
            {/* Animated Tab Indicator */}
            {tabRefs.current[0] && (
              <motion.div
                className="absolute bottom-0 h-1 bg-blue-500 rounded-full z-0"
                layoutId="tabIndicator"
                initial={false}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
              />
            )}
          </TabsList>
        </div>

        <div className="flex-grow overflow-y-auto p-4 relative">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={activeTab}
              custom={direction}
              variants={getVariant(tabOrder.indexOf(activeTab))}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="absolute inset-0"
            >
              <TabsContent value="receipt" className="mt-0 h-full">
                <ReceiptTab />
              </TabsContent>
              <TabsContent value="input" className="mt-0 h-full">
                <InputTab onSaveSuccess={handleTransactionSave} />
              </TabsContent>
              <TabsContent value="transactions" className="mt-0 h-full">
                <TransactionTab 
                  refresh={refreshTransactions} 
                  onRefreshed={() => setRefreshTransactions(false)}
                />
              </TabsContent>
              <TabsContent value="reports" className="mt-0 h-full">
                <ReportTab />
              </TabsContent>
              <TabsContent value="settings" className="mt-0 h-full">
                <SettingsTab />
              </TabsContent>
            </motion.div>
          </AnimatePresence>
        </div>
      </Tabs>
    </div>
  );
};

export default MainApp;