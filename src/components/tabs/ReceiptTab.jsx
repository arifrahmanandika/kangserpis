import React, { useState } from "react";
import { motion } from "framer-motion";
import { Printer, Lock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/use-toast";
import { printReceipt } from "@/lib/print";

const ReceiptTab = () => {
  const [formData, setFormData] = useState({
    customerName: "",
    phoneNumber: "",
    deviceType: "",
    devicePin: "",
    description: "",
  });

  const generateReceiptNumber = () => {
    const now = new Date();
    const day = String(now.getDate()).padStart(2, "0");
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const sequence = String(Math.floor(100 + Math.random() * 900)); // 3-digit random number
    return `${month}${day}${sequence}`;
  };

  const [receiptNumber] = useState(generateReceiptNumber());
  const currentDateTime = new Date().toLocaleString("id-ID", {
    dateStyle: "short",
    timeStyle: "short",
  });

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handlePrint = async () => {
    if (
      !formData.customerName ||
      !formData.phoneNumber ||
      !formData.deviceType
    ) {
      toast({
        title: "Data Tidak Lengkap",
        description: "Mohon lengkapi semua data yang diperlukan",
        variant: "destructive",
      });
      return;
    }

    await printReceipt(formData, receiptNumber, currentDateTime);
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
              <Printer className="w-6 h-6" />
              <span>Cetak Nota Tanda Terima</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 p-4 rounded-lg bg-slate-800/30">
              <div>
                <Label className="text-gray-300">No. Nota</Label>
                <p className="font-mono font-bold text-blue-400">
                  {receiptNumber}
                </p>
              </div>
              <div>
                <Label className="text-gray-300">Tanggal & Jam</Label>
                <p className="font-mono text-blue-400">{currentDateTime}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                {/*   <Label htmlFor="customerName" className="text-gray-300">Nama Konsumen *</Label> */}
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
                {/*  <Label htmlFor="phoneNumber" className="text-gray-300">Nomor HP *</Label> */}
                <Input
                  id="phoneNumber"
                  type="tel"
                  value={formData.phoneNumber}
                  onChange={(e) =>
                    handleInputChange("phoneNumber", e.target.value)
                  }
                  className="text-white bg-slate-800/50 border-slate-700"
                  placeholder="081234567891"
                />
              </div>

              <div>
                {/*} <Label htmlFor="deviceType" className="text-gray-300">Type HP *</Label> */}
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

              <div>
                {/* <Label htmlFor="devicePin" className="flex items-center text-gray-300">
                  <Lock className="w-3 h-3 mr-2" />
                  PIN / Pola (Opsional)
                </Label> */}
                <Input
                  id="devicePin"
                  value={formData.devicePin}
                  onChange={(e) =>
                    handleInputChange("devicePin", e.target.value)
                  }
                  className="text-white bg-slate-800/50 border-slate-700"
                  placeholder="PIN atau Password"
                />
              </div>

              <div>
                {/* <Label htmlFor="description" className="text-gray-300">Keterangan</Label> */}
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    handleInputChange("description", e.target.value)
                  }
                  className="text-white bg-slate-800/50 border-slate-700"
                  placeholder="Kendala / Kerusakan"
                  rows={3}
                />
              </div>
            </div>

            <div className="flex pt-4">
              <Button
                onClick={handlePrint}
                className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
              >
                <Printer className="w-4 h-4 mr-2" />
                Cetak Nota
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default ReceiptTab;
