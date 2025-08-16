import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Save, Plus, Trash2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';

const EditTransactionModal = ({ transaction, onClose, onSaveSuccess }) => {
  const [formData, setFormData] = useState({
    customerName: transaction.customer_name,
    deviceType: transaction.device_type,
    services: transaction.services.map(s => ({ ...s })),
    notes: transaction.notes
  });
  const [isSaving, setIsSaving] = useState(false);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleServiceChange = (index, field, value) => {
    const updatedServices = [...formData.services];
    updatedServices[index][field] = value;
    setFormData(prev => ({ ...prev, services: updatedServices }));
  };

  const addService = () => {
    setFormData(prev => ({
      ...prev,
      services: [...prev.services, { name: '', modalPrice: '', sellPrice: '' }]
    }));
  };

  const removeService = (index) => {
    if (formData.services.length > 1) {
      const updatedServices = formData.services.filter((_, i) => i !== index);
      setFormData(prev => ({ ...prev, services: updatedServices }));
    }
  };

  const formatCurrency = (value) => {
    if (!value) return '';
    const number = value.toString().replace(/\D/g, '');
    return new Intl.NumberFormat('id-ID', {
      style: 'currency', currency: 'IDR', minimumFractionDigits: 0
    }).format(number);
  };

  const handleCurrencyInput = (index, field, value) => {
    const numericValue = value.replace(/\D/g, '');
    handleServiceChange(index, field, numericValue);
  };

  const handleSave = async () => {
    setIsSaving(true);
    const updatedData = {
      customer_name: formData.customerName,
      device_type: formData.deviceType,
      services: formData.services.map(s => ({
        name: s.name,
        modalPrice: parseInt(s.modalPrice) || 0,
        sellPrice: parseInt(s.sellPrice) || 0,
      })),
      notes: formData.notes,
    };

    const { data, error } = await supabase
      .from('transactions')
      .update(updatedData)
      .eq('id', transaction.id)
      .select()
      .single();

    setIsSaving(false);

    if (error) {
      toast({ title: "Gagal Memperbarui", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Data Berhasil Diperbarui", description: "Transaksi telah diupdate." });
      onSaveSuccess(data);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={onClose}>
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-slate-800 rounded-xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold gradient-text">Ubah Transaksi</h3>
          <Button onClick={onClose} variant="ghost" size="sm">×</Button>
        </div>
        <div className="space-y-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="customerName" className="text-gray-300">Nama Konsumen</Label>
              <Input id="customerName" value={formData.customerName} onChange={(e) => handleInputChange('customerName', e.target.value)} className="bg-slate-700/50 border-slate-600 text-white" />
            </div>
            <div>
              <Label htmlFor="deviceType" className="text-gray-300">Type HP</Label>
              <Input id="deviceType" value={formData.deviceType} onChange={(e) => handleInputChange('deviceType', e.target.value)} className="bg-slate-700/50 border-slate-600 text-white" />
            </div>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-gray-300 text-lg">Service</Label>
              <Button onClick={addService} size="sm" variant="outline" className="border-slate-600 text-white hover:bg-slate-700"><Plus className="w-4 h-4 mr-1" />Tambah</Button>
            </div>
            {formData.services.map((service, index) => (
              <motion.div key={index} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="p-4 bg-slate-700/30 rounded-lg space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-400">Service #{index + 1}</span>
                  {formData.services.length > 1 && (<Button onClick={() => removeService(index)} size="sm" variant="ghost" className="text-red-400 hover:text-red-300 hover:bg-red-900/20"><Trash2 className="w-4 h-4" /></Button>)}
                </div>
                <div>
                  <Label className="text-gray-300">Nama Service</Label>
                  <Input value={service.name} onChange={(e) => handleServiceChange(index, 'name', e.target.value)} className="bg-slate-600/50 border-slate-500 text-white" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-gray-300">Harga Modal</Label>
                    <Input value={formatCurrency(service.modalPrice)} onChange={(e) => handleCurrencyInput(index, 'modalPrice', e.target.value)} className="bg-slate-600/50 border-slate-500 text-white" />
                  </div>
                  <div>
                    <Label className="text-gray-300">Harga Jual</Label>
                    <Input value={formatCurrency(service.sellPrice)} onChange={(e) => handleCurrencyInput(index, 'sellPrice', e.target.value)} className="bg-slate-600/50 border-slate-500 text-white" />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
          <div>
            <Label htmlFor="notes" className="text-gray-300">Catatan</Label>
            <Textarea id="notes" value={formData.notes} onChange={(e) => handleInputChange('notes', e.target.value)} className="bg-slate-700/50 border-slate-600 text-white" rows={3} />
          </div>
          <Button onClick={handleSave} disabled={isSaving} className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700">
            {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />} Simpan Perubahan
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default EditTransactionModal;