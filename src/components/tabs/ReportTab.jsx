import React, { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  TrendingUp,
  Calendar,
  Printer,
  DollarSign,
  Percent,
  Target,
  Loader2,
  ArrowRightLeft,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/use-toast";
import { supabase } from "@/lib/customSupabaseClient";
import { printSalesReport } from "@/lib/print";

const ReportTab = () => {
  const [startDate, setStartDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [endDate, setEndDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [reportData, setReportData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const generateReport = useCallback(async () => {
    setIsLoading(true);
    const { data: transactions, error } = await supabase
      .from("transactions")
      .select("*")
      .gte("created_at", new Date(startDate).toISOString())
      .lte("created_at", new Date(endDate + "T23:59:59.999Z").toISOString());

    setIsLoading(false);
    if (error) {
      toast({
        title: "Gagal memuat laporan",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    let totalModal = 0;
    let totalJual = 0;
    transactions.forEach((t) => {
      t.services.forEach((s) => {
        totalModal += s.modalPrice || 0;
        totalJual += s.sellPrice || 0;
      });
    });

    const totalProfit = totalJual - totalModal;
    const profitMargin =
      totalJual > 0 ? ((totalProfit / totalJual) * 100).toFixed(2) : 0;

    setReportData({
      totalModal,
      totalJual,
      totalProfit,
      profitMargin,
      totalTransactions: transactions.length,
      transactions,
    });
  }, [startDate, endDate]);

  useEffect(() => {
    generateReport();
  }, [generateReport]);

  const formatCurrency = (amount) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);

  const handlePrintReport = () => {
    if (reportData && reportData.transactions.length > 0) {
      printSalesReport(reportData, startDate, endDate);
    } else {
      toast({
        title: "Tidak ada data",
        description: "Tidak ada data untuk dicetak pada periode ini.",
        variant: "destructive",
      });
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
              <TrendingUp className="w-6 h-6" />
              <span>Rekap Laba Rugi</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-gray-300">Tanggal Awal</Label>
                <div className="relative">
                  <Calendar className="absolute w-4 h-4 text-gray-400 transform -translate-y-1/2 left-3 top-1/2" />
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="pl-10 text-white bg-slate-800/50 border-slate-700"
                  />
                </div>
              </div>
              <div>
                <Label className="text-gray-300">Tanggal Akhir</Label>
                <div className="relative">
                  <Calendar className="absolute w-4 h-4 text-gray-400 transform -translate-y-1/2 left-3 top-1/2" />
                  <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="pl-10 text-white bg-slate-800/50 border-slate-700"
                  />
                </div>
              </div>
            </div>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
              </div>
            ) : (
              reportData && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  className="space-y-4"
                >
                  <div className="grid grid-cols-1 gap-4">
                    <div className="p-4 border rounded-lg bg-gradient-to-br from-blue-500/20 to-blue-600/20 border-blue-500/30">
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-blue-500/20">
                          <TrendingUp className="w-5 h-5 text-blue-400" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-400">Total OMZET</p>
                        </div>
                      </div>
                      <p className="text-lg font-bold text-blue-400">
                        {formatCurrency(reportData.totalJual)}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 border rounded-lg bg-gradient-to-br from-red-500/20 to-red-600/20 border-red-500/30">
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-red-500/20">
                          <Target className="w-5 h-5 text-red-400" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-400">Total Modal</p>
                        </div>
                      </div>
                      <p className="text-lg font-bold text-red-400">
                        {formatCurrency(reportData.totalModal)}
                      </p>
                    </div>

                    <div className="p-4 border rounded-lg bg-gradient-to-br from-green-500/20 to-green-600/20 border-green-500/30">
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-green-500/20">
                          <DollarSign className="w-5 h-5 text-green-400" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-400">Total Laba</p>
                        </div>
                      </div>
                      <p className="text-lg font-bold text-green-400">
                        {formatCurrency(reportData.totalProfit)}
                      </p>
                    </div>

                    <div className="p-4 border rounded-lg bg-gradient-to-br from-orange-500/20 to-orange-600/20 border-orange-500/30">
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-orange-500/20">
                          <ArrowRightLeft className="w-5 h-5 text-orange-400" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-400">
                            Total Transaksi
                          </p>
                        </div>
                      </div>
                      <p className="text-lg font-bold text-orange-400">
                        {reportData.totalTransactions} Transaksi
                      </p>
                    </div>

                    <div className="p-4 border rounded-lg bg-gradient-to-br from-purple-500/20 to-purple-600/20 border-purple-500/30">
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-purple-500/20">
                          <Percent className="w-5 h-5 text-purple-400" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-400">Margin Laba</p>
                        </div>
                      </div>
                      <p className="text-lg font-bold text-purple-400">
                        {reportData.profitMargin}%
                      </p>
                    </div>
                  </div>

                  <Button
                    onClick={handlePrintReport}
                    className="w-full bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700"
                  >
                    <Printer className="w-4 h-4 mr-2" />
                    Cetak Laporan
                  </Button>
                </motion.div>
              )
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default ReportTab;
