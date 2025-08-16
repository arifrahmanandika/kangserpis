import React, { useState } from "react";
import { motion } from "framer-motion";
import { Save, Plus, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/use-toast";
import { supabase } from "@/lib/customSupabaseClient";
import { useAuth } from "@/contexts/SupabaseAuthContext.jsx";

const InputTab = ({ onSaveSuccess }) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    customerName: "",
    deviceType: "",
    services: [{ name: "", modalPrice: "", sellPrice: "" }],
    notes: "Garansi 3 Bulan",
  });
  const [isSaving, setIsSaving] = useState(false);

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleServiceChange = (index, field, value) => {
    const updatedServices = [...formData.services];
    updatedServices[index][field] = value;
    setFormData((prev) => ({ ...prev, services: updatedServices }));
  };

  const addService = () => {
    setFormData((prev) => ({
      ...prev,
      services: [...prev.services, { name: "", modalPrice: "", sellPrice: "" }],
    }));
  };

  const removeService = (index) => {
    if (formData.services.length > 1) {
      const updatedServices = formData.services.filter((_, i) => i !== index);
      setFormData((prev) => ({ ...prev, services: updatedServices }));
    }
  };

  // Format angka ke Rupiah (hanya untuk tampilan)
  const formatCurrency = (value) => {
    if (!value && value !== 0) return "";
    const number = parseInt(value.toString().replace(/\D/g, "")) || 0;
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(number);
  };

  // Hanya ekstrak angka saat input
  const handleCurrencyInput = (index, field, value) => {
    const numericValue = value.replace(/\D/g, "");
    handleServiceChange(index, field, numericValue);
  };

  // 🔢 Hitung total
  const totalModal = formData.services.reduce(
    (sum, s) => sum + (parseInt(s.modalPrice) || 0),
    0
  );
  const totalSell = formData.services.reduce(
    (sum, s) => sum + (parseInt(s.sellPrice) || 0),
    0
  );
  const profit = totalSell - totalModal;

  const handleSave = async () => {
    if (!formData.customerName || !formData.deviceType) {
      toast({
        title: "Data Tidak Lengkap",
        description: "Nama konsumen dan type HP harus diisi",
        variant: "destructive",
      });
      return;
    }

    const hasEmptyService = formData.services.some(
      (s) => !s.name || !s.modalPrice || !s.sellPrice
    );
    if (hasEmptyService) {
      toast({
        title: "Data Service Tidak Lengkap",
        description: "Semua field service harus diisi",
        variant: "destructive",
      });
      return;
    }

    if (!user) {
      toast({
        title: "Error",
        description: "Anda harus login untuk menyimpan data.",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);

    const transactionData = {
      customer_name: formData.customerName,
      device_type: formData.deviceType,
      services: formData.services.map((s) => ({
        name: s.name,
        modalPrice: parseInt(s.modalPrice) || 0,
        sellPrice: parseInt(s.sellPrice) || 0,
      })),
      notes: formData.notes,
      created_by_user_id: user.id,
      created_by_user_email: user.email,
    };

    const { error } = await supabase
      .from("transactions")
      .insert([transactionData]);

    setIsSaving(false);

    if (error) {
      toast({
        title: "Gagal Menyimpan",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Data Berhasil Disimpan",
        description: "Transaksi telah ditambahkan ke database.",
      });
      setFormData({
        customerName: "",
        deviceType: "",
        services: [{ name: "", modalPrice: "", sellPrice: "" }],
        notes: "Garansi 3 Bulan",
      });
      if (onSaveSuccess) onSaveSuccess();
    }
  };

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="glass-effect border-slate-700/50">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 gradient-text">
              <Plus className="w-6 h-6" />
              <span>Input Data Transaksi</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div>
                <Input
                  id="customerName"
                  value={formData.customerName}
                  onChange={(e) =>
                    handleInputChange("customerName", e.target.value)
                  }
                  className="text-white bg-slate-800/50 border-slate-700"
                  placeholder="Jupri"
                />
              </div>
              <div>
                <Input
                  id="deviceType"
                  value={formData.deviceType}
                  onChange={(e) =>
                    handleInputChange("deviceType", e.target.value)
                  }
                  className="text-white bg-slate-800/50 border-slate-700"
                  placeholder="Oppo A3s"
                />
              </div>
            </div>

            {/* Daftar Services */}
            <div className="space-y-4">
              {formData.services.map((service, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  className="p-4 space-y-3 rounded-lg bg-slate-800/30"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-400">
                      Service #{index + 1}
                    </span>
                    {formData.services.length > 1 && (
                      <Button
                        onClick={() => removeService(index)}
                        size="sm"
                        variant="ghost"
                        className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>

                  <div>
                    <Input
                      value={service.name}
                      onChange={(e) =>
                        handleServiceChange(index, "name", e.target.value)
                      }
                      className="text-white bg-slate-700/50 border-slate-600"
                      placeholder="Ganti LCD"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-gray-300">Harga Modal</Label>
                      <Input
                        value={formatCurrency(service.modalPrice)}
                        type="tel"
                        onChange={(e) =>
                          handleCurrencyInput(
                            index,
                            "modalPrice",
                            e.target.value
                          )
                        }
                        className="text-white bg-slate-700/50 border-slate-600"
                        placeholder="Rp 0"
                      />
                    </div>
                    <div>
                      <Label className="text-gray-300">Harga Jual</Label>
                      <Input
                        value={formatCurrency(service.sellPrice)}
                        type="tel"
                        onChange={(e) =>
                          handleCurrencyInput(
                            index,
                            "sellPrice",
                            e.target.value
                          )
                        }
                        className="text-white bg-slate-700/50 border-slate-600"
                        placeholder="Rp 0"
                      />
                    </div>
                  </div>
                </motion.div>
              ))}

              {/* Tombol Tambah Service (hanya satu, di luar map) */}
              <Button
                onClick={addService}
                size="sm"
                variant="outline"
                className="text-white border-slate-600 hover:bg-slate-700"
              >
                <Plus className="w-4 h-4 mr-1" /> Tambah Service
              </Button>
            </div>

            {/* Ringkasan Total */}
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Total Harga:</span>
                <span className="text-lg font-bold text-blue-500">
                  {formatCurrency(totalSell)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Total Modal:</span>
                <span className="text-red-400">
                  {formatCurrency(totalModal)}
                </span>
              </div>
              <div className="flex justify-between pt-1 border-t border-slate-600">
                <span className="text-gray-300">Keuntungan:</span>
                <span
                  className={profit >= 0 ? "text-emerald-500" : "text-red-400"}
                >
                  {formatCurrency(profit)}
                </span>
              </div>
            </div>

            {/* Catatan */}
            <div>
              <Label htmlFor="notes" className="text-gray-300">
                Catatan / Keterangan
              </Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => handleInputChange("notes", e.target.value)}
                className="text-white bg-slate-800/50 border-slate-700"
                rows={3}
              />
            </div>

            {/* Tombol Simpan */}
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
            >
              {isSaving ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="w-5 h-5 border-2 border-white rounded-full border-t-transparent"
                />
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" /> Simpan Data
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default InputTab;
