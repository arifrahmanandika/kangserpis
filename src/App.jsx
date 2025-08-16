import React from 'react';
import { Helmet } from 'react-helmet';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/SupabaseAuthContext.jsx';
import LoginScreen from '@/components/LoginScreen.jsx';
import MainApp from '@/components/MainApp.jsx';

function App() {
  const { session, loading, signOut } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Kang Serpis - Aplikasi Reparasi Smartphone</title>
        <meta name="description" content="Aplikasi manajemen data penjualan dan reparasi smartphone yang mudah dan efisien" />
        <meta property="og:title" content="Kang Serpis - Aplikasi Reparasi Smartphone" />
        <meta property="og:description" content="Aplikasi manajemen data penjualan dan reparasi smartphone yang mudah dan efisien" />
      </Helmet>
      
      <div className="min-h-screen">
        <AnimatePresence mode="wait">
          {!session ? (
            <LoginScreen key="login" />
          ) : (
            <MainApp key="main" onLogout={signOut} />
          )}
        </AnimatePresence>
      </div>
    </>
  );
}

export default App;