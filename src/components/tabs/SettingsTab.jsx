import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Settings, Save, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext.jsx';

const defaultSettings = {
  store_name: '   MAKARYO SERVICE 22   ',
  store_address: 'Jl. Veteran No.29 Hadimulyo Barat',
  store_phone: ' 0822-8626-7757',
  header_note: 'Service Handphone, Android & iPhone',
  footer_note: 'Terima kasih atas kepercayaan Anda\nSIMPAN dan BAWA Nota ini\nuntuk Pengambilan & GARANSI'
};

const SettingsTab = () => {
  const { user } = useAuth();
  const [settings, setSettings] = useState(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  const loadSettings = useCallback(async () => {
    if (!user) {
        setIsLoading(false);
        return;
    };
    setIsLoading(true);
    const { data, error } = await supabase
      .from('settings')
      .select('*')
      .eq('user_id', user.id)
      .single();
    
    if (data) {
      setSettings(prev => ({ ...prev, ...data }));
    } else if (error && error.code !== 'PGRST116') { // PGRST116 = 0 rows
      toast({ title: "Gagal memuat pengaturan", description: error.message, variant: "destructive" });
    }
    // If no data and no critical error, we just keep the default state.
    setIsLoading(false);
  }, [user]);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const handleInputChange = (field, value) => {
    setSettings(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!user) return;
    setIsSaving(true);

    const { id, ...settingsToSave } = settings;
    const settingsData = {
      ...settingsToSave,
      user_id: user.id,
      updated_at: new Date().toISOString()
    };
    
    // Ensure all keys from defaultSettings exist before upserting
    Object.keys(defaultSettings).forEach(key => {
        if (settingsData[key] === undefined) {
            settingsData[key] = defaultSettings[key];
        }
    });

    const { error } = await supabase.from('settings').upsert(settingsData, { onConflict: 'user_id' });
    
    setIsSaving(false);
    if (error) {
      toast({ title: "Gagal menyimpan", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Pengaturan Disimpan", description: "Pengaturan berhasil diperbarui." });
      loadSettings();
    }
  };

  if (isLoading) {
    return <div className="flex justify-center items-center py-8"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>;
  }

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <Card className="glass-effect border-slate-700/50">
          <CardHeader><CardTitle className="gradient-text flex items-center space-x-2"><Settings className="w-6 h-6" /><span>Pengaturan Toko & Nota</span></CardTitle></CardHeader>
          <CardContent className="space-y-4">

            <div><Label htmlFor="store_name" className="text-gray-300">Nama Toko</Label><Input id="store_name" value={settings.store_name || ''} onChange={(e) => handleInputChange('store_name', e.target.value)} className="bg-slate-800/50 border-slate-700 text-white" placeholder="Nama toko Anda" /></div>
            <div><Label htmlFor="store_address" className="text-gray-300">Alamat Toko</Label><Input id="store_address" value={settings.store_address || ''} onChange={(e) => handleInputChange('store_address', e.target.value)} className="bg-slate-800/50 border-slate-700 text-white" placeholder="Alamat lengkap toko" /></div>
            <div><Label htmlFor="store_phone" className="text-gray-300">Nomor Telepon</Label><Input id="store_phone" value={settings.store_phone || ''} onChange={(e) => handleInputChange('store_phone', e.target.value)} className="bg-slate-800/50 border-slate-700 text-white" placeholder="Nomor telepon toko" /></div>
            <div><Label htmlFor="header_note" className="text-gray-300">Header Nota</Label><Input id="header_note" value={settings.header_note || ''} onChange={(e) => handleInputChange('header_note', e.target.value)} className="bg-slate-800/50 border-slate-700 text-white" placeholder="Teks atas nota" /></div>
            <div><Label htmlFor="footer_note" className="text-gray-300">Footer Nota</Label><Textarea id="footer_note" value={settings.footer_note || ''} onChange={(e) => handleInputChange('footer_note', e.target.value)} className="bg-slate-800/50 border-slate-700 text-white" placeholder="Teks bawah nota" rows={4} /><p className="text-xs text-gray-500 mt-1">Gunakan Enter untuk Baris Baru.</p></div>
            <Button onClick={handleSave} disabled={isSaving} className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700">
              {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />} Simpan Pengaturan
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default SettingsTab;