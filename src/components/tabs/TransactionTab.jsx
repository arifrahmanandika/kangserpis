import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Search, Printer, Eye, Edit, Trash2, Calendar, Loader2, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';
import { printTransactionReceipt } from '@/lib/print';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import EditTransactionModal from '@/components/EditTransactionModal.jsx';

const TransactionTab = ({ refresh, onRefreshed }) => {
  const [transactions, setTransactions] = useState([]);
  const [filteredTransactions, setFilteredTransactions] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState(new Date().toISOString().split('T')[0]);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const loadTransactions = useCallback(async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      toast({ title: "Gagal memuat data", description: error.message, variant: "destructive" });
    } else {
      setTransactions(data);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    loadTransactions();
  }, [loadTransactions]);

  useEffect(() => {
    if (refresh) {
      loadTransactions();
      onRefreshed();
    }
  }, [refresh, loadTransactions, onRefreshed]);

  const filterTransactions = useCallback(() => {
    let filtered = transactions;

    if (dateFilter) {
      filtered = filtered.filter(t => new Date(t.created_at).toISOString().split('T')[0] === dateFilter);
    }

    if (searchTerm) {
      const lowerSearchTerm = searchTerm.toLowerCase();
      filtered = filtered.filter(t =>
        t.customer_name.toLowerCase().includes(lowerSearchTerm) ||
        t.device_type.toLowerCase().includes(lowerSearchTerm) ||
        t.services.some(s => s.name.toLowerCase().includes(lowerSearchTerm))
      );
    }

    setFilteredTransactions(filtered);
  }, [transactions, searchTerm, dateFilter]);

  useEffect(() => {
    filterTransactions();
  }, [filterTransactions]);

  const formatCurrency = (amount) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
  const formatDateTime = (dateString) => new Date(dateString).toLocaleString('id-ID');

  const handlePrint = (transaction) => {
    printTransactionReceipt(transaction);
  };

  const handleEdit = (transaction) => {
    setEditingTransaction(transaction);
    setSelectedTransaction(null);
  };

  const handleDelete = async (transactionId) => {
    const { error } = await supabase.from('transactions').delete().match({ id: transactionId });
    if (error) {
      toast({ title: "Gagal menghapus", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Data Dihapus", description: "Transaksi berhasil dihapus." });
      setTransactions(transactions.filter(t => t.id !== transactionId));
      setSelectedTransaction(null);
    }
  };

  const handleUpdateSuccess = (updatedTransaction) => {
    setTransactions(transactions.map(t => t.id === updatedTransaction.id ? updatedTransaction : t));
    setEditingTransaction(null);
  };

  const TransactionDetail = ({ transaction, onClose }) => {
    const totalModal = transaction.services.reduce((sum, s) => sum + (s.modalPrice || 0), 0);
    const totalJual = transaction.services.reduce((sum, s) => sum + (s.sellPrice || 0), 0);
    const profit = totalJual - totalModal;

    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={onClose}>
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-slate-800 rounded-xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center justify-between mb-4"><h3 className="text-xl font-bold gradient-text">Detail Transaksi</h3><Button onClick={onClose} variant="ghost" size="sm" >X</Button></div>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><Label className="text-gray-400">ID Transaksi</Label><p className="text-white font-mono break-all">{transaction.id.substring(0, 8)}</p></div>
              <div><Label className="text-gray-400">Tanggal</Label><p className="text-white">{formatDateTime(transaction.created_at)}</p></div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
            <div><Label className="text-gray-400">Nama Konsumen</Label><p className="text-white font-semibold">{transaction.customer_name}</p></div>
            <div><Label className="text-gray-400">Type HP</Label><p className="text-white">{transaction.device_type}</p></div>
            </div>

            <div>
              <Label className="text-gray-400">Services</Label>
              <div className="space-y-2">
                {transaction.services.map((s, i) => (
                  <div key={i} className="bg-slate-700/50 p-3 rounded-lg"><p className="text-white font-medium">{s.name}</p><div className="grid grid-cols-2 gap-2 text-sm mt-1"><span className="text-red-400">Modal: {formatCurrency(s.modalPrice)}</span><span className="text-blue-400">Jual: {formatCurrency(s.sellPrice)}</span></div></div>
                ))}
              </div>
            </div>
            <div className="bg-slate-700/30 p-3 rounded-lg"><div className="grid grid-cols-3 gap-2 text-sm"><div><Label className="text-gray-400">Total Modal</Label><p className="text-red-400 font-semibold">{formatCurrency(totalModal)}</p></div><div><Label className="text-gray-400">Total Jual</Label><p className="text-blue-400 font-semibold">{formatCurrency(totalJual)}</p></div><div><Label className="text-gray-400">Laba</Label><p className="text-green-400 font-semibold">{formatCurrency(profit)}</p></div></div></div>
            <div><Label className="text-gray-400">Catatan</Label><p className="text-white">{transaction.notes}</p></div>
            {/**<div><Label className="text-gray-400">Dibuat oleh</Label><p className="text-white">{transaction.created_by_user_email}</p></div>  */}
            <div className="flex space-x-2 pt-4">
              <Button onClick={() => handleEdit(transaction)} className="flex-1 bg-blue-600 hover:bg-blue-700"><Edit className="w-4 h-4 mr-2" />Ubah</Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" className="flex-1"><Trash2 className="w-4 h-4 mr-2" />Hapus</Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="bg-slate-800 border-slate-700 text-white">
                  <AlertDialogHeader>
                    <AlertDialogTitle className="flex items-center"><AlertTriangle className="w-5 h-5 mr-2 text-yellow-400"/>Hayooo...!!!!</AlertDialogTitle>
                    <AlertDialogDescription className="text-gray-400">
                      Yakin Hapus transaksi ini?
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel className="border-slate-600 text-white hover:bg-slate-700">Batal</AlertDialogCancel>
                    <AlertDialogAction onClick={() => handleDelete(transaction.id)} className="bg-red-600 hover:bg-red-700">Ya, Hapus</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </motion.div>
      </motion.div>
    );
  };

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <Card className="glass-effect border-slate-700/50">
          <CardHeader><CardTitle className="gradient-text flex items-center space-x-2"><Search className="w-6 h-6" /><span>Data Transaksi</span></CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-gray-300">Pencarian</Label>
                <div className="relative"><Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" /><Input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10 bg-slate-800/50 border-slate-700 text-white" placeholder="Cari nama, HP, atau service..."/></div>
              </div>
              <div>
                <Label className="text-gray-300">Filter Tanggal</Label>
                <div className="relative"><Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" /><Input type="date" value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} className="pl-10 bg-slate-800/50 border-slate-700 text-white"/></div>
              </div>
            </div>
            <div className="space-y-3">
              {isLoading ? (<div className="flex justify-center items-center py-8"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>) :
               filteredTransactions.length === 0 ? (<div className="text-center py-8 text-gray-400"><Search className="w-12 h-12 mx-auto mb-4 opacity-50" /><p>Tidak ada transaksi ditemukan</p></div>) :
               (filteredTransactions.map((t, i) => {
                  const totalJual = t.services.reduce((sum, s) => sum + (s.sellPrice || 0), 0);
                  return (
                    <motion.div key={t.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3, delay: i * 0.1 }} className="bg-slate-800/30 rounded-lg p-4 border border-slate-700/50">
                      <div className="flex items-center justify-between">
                        <div className="flex-1 overflow-hidden">
                          <div className="flex items-center space-x-2 mb-2"><h4 className="font-semibold text-white truncate">{t.customer_name}</h4><span className="text-xs bg-blue-600 text-white px-2 py-1 rounded flex-shrink-0">{t.device_type}</span></div>
                          <p className="text-sm text-gray-400 mb-1 truncate">{t.services.map(s => s.name).join(', ')}</p>
                          <div className="flex items-center justify-between text-xs text-gray-500"><span>{formatDateTime(t.created_at)}</span><span className="text-blue-400 font-semibold">{formatCurrency(totalJual)}</span></div>
                        </div>
                        <div className="flex space-x-2 ml-4"><Button onClick={() => handlePrint(t)} size="sm" variant="outline" className="border-slate-600 text-white hover:bg-slate-700"><Printer className="w-4 h-4" /></Button><Button onClick={() => setSelectedTransaction(t)} size="sm" className="bg-blue-600 hover:bg-blue-700"><Eye className="w-4 h-4" /></Button></div>
                      </div>
                    </motion.div>
                  );
                }))
              }
            </div>
          </CardContent>
        </Card>
      </motion.div>
      {selectedTransaction && <TransactionDetail transaction={selectedTransaction} onClose={() => setSelectedTransaction(null)} />}
      {editingTransaction && <EditTransactionModal transaction={editingTransaction} onClose={() => setEditingTransaction(null)} onSaveSuccess={handleUpdateSuccess} />}
    </div>
  );
};

export default TransactionTab;