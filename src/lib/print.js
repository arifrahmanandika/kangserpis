import { supabase } from '@/lib/customSupabaseClient';
import { toast } from '@/components/ui/use-toast';

const PAPER_WIDTH = 48;
// Perintah ESC/POS untuk memperbesar teks (double width + height)
const BIG_FONT_ON = '\x1b\x40' + // Reset printer
                       '\x1d\x21\x11'; // GS ! 0x11 -> font B, double width & height
const NORMAL_FONT = '\x1d\x21\x00'; // GS ! 0x00 -> normal size
    
const formatCurrency = (amount) => {
  const formatted = new Intl.NumberFormat('id-ID', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
  return `Rp ${formatted}`;
};
const formatDateTime = (dateString) => new Date(dateString).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' });

const l = (text, width) => String(text).padEnd(width);
const r = (text, width) => String(text).padStart(width);
const c = (text, width) => {
    const textStr = String(text);
    const len = textStr.length;
    if (len >= width) return textStr.substring(0, width);
    const pad = Math.floor((width - len) / 2);
    return ''.padStart(pad) + textStr + ''.padEnd(width - len - pad);
}
const line = (char = '-') => char.repeat(PAPER_WIDTH);

const getStoreSettings = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return {};

    const { data, error } = await supabase
        .from('settings')
        .select('*')
        .eq('user_id', user.id)
        .single();

    if (error && error.code === 'PGRST116') {
        return {}; 
    }
    if (error) {
        console.error('Error fetching settings:', error);
        return {};
    }
    return data || {};
};

const printViaBluetooth = async (content) => {
    try {
        toast({ title: 'Mencari printer Bluetooth...' });
        const device = await navigator.bluetooth.requestDevice({
            filters: [{ services: [0x18F0] }],
            optionalServices: ['000018f0-0000-1000-8000-00805f9b34fb']
        });

        toast({ title: 'Menghubungkan ke printer...' });
        const server = await device.gatt.connect();
        const service = await server.getPrimaryService('000018f0-0000-1000-8000-00805f9b34fb');
        const characteristic = await service.getCharacteristic('00002af1-0000-1000-8000-00805f9b34fb');
        
        toast({ title: 'Mengirim data untuk dicetak...' });
        const encoder = new TextEncoder("utf-8");
        const data = encoder.encode(content);
        
        const chunkSize = 100;
        for (let i = 0; i < data.length; i += chunkSize) {
            const chunk = data.slice(i, i + chunkSize);
            await characteristic.writeValueWithoutResponse(chunk);
        }

        toast({ title: 'Cetak Berhasil', description: 'Data telah dikirim ke printer.' });

    } catch (error) {
        console.error('Bluetooth printing error:', error);
        let description = 'Terjadi kesalahan.';
        if (error.name === 'NotFoundError') {
            description = 'Pemilihan printer dibatalkan atau tidak ada perangkat yang ditemukan.';
        } else if (error.name === 'SecurityError') {
            description = 'Akses Bluetooth tidak diizinkan.';
        }
        toast({ title: 'Gagal Mencetak', description, variant: 'destructive' });
    }
};

const buildHeader = (settings) => {
    let header = '\n';
    if (settings.store_name) header += BIG_FONT_ON + l(settings.store_name, PAPER_WIDTH) + NORMAL_FONT + '\n';
    if (settings.store_address) header += c(settings.store_address, PAPER_WIDTH) + '\n';
    if (settings.header_note) header += c(settings.header_note, PAPER_WIDTH) + '\n';
    if (settings.store_phone) header += c(settings.store_phone, PAPER_WIDTH) + '\n';
    return header;
};

const buildFooter = (settings) => {
    let footer = '';
    if (settings.footer_note) {
        const notes = settings.footer_note.split('\n');
        notes.forEach(note => {
            footer += c(note, PAPER_WIDTH) + '\n';
        });
    }
    return footer;
};

export const printReceipt = async (formData, receiptNumber, dateTime) => {
    const settings = await getStoreSettings();
    let content = buildHeader(settings) + line('=') + '\n';
    content += c('TANDA TERIMA', PAPER_WIDTH) + '\n' + line('=') + '\n';
    content += BIG_FONT_ON;
    content += `${l('No Nota', 12)}: ${receiptNumber}\n`;
    content += NORMAL_FONT;
    
    content += line() + '\n';
    content += `${l('Tanggal', 12)}: ${dateTime}\n`;
    content += `${l('Nama', 12)}: ${formData.customerName}\n`;
    content += `${l('No. HP', 12)}: ${formData.phoneNumber}\n`;
    content += `${l('Tipe HP', 12)}: ${formData.deviceType}\n`;
    if (formData.devicePin) {
        content += `${l('PIN/Pass', 12)}: ${formData.devicePin}\n`;
    }
    if (formData.description) {
        content += `${l('Kerusakan', 12)}: ${formData.description}\n`;
    }
    content += line('=') + '\n';
    content += buildFooter(settings) + '\n\n\n';

    await printViaBluetooth(content);
};

export const printTransactionReceipt = async (transaction) => {
    const settings = await getStoreSettings();
    const totalJual = transaction.services.reduce((sum, s) => sum + s.sellPrice, 0);

    let content = buildHeader(settings) + line('=') + '\n';
    content += c('NOTA PENJUALAN', PAPER_WIDTH) + '\n' + line('=') + '\n';
    content += `${l('No Nota', 12)}: ${transaction.id.substring(0, 8)}\n`;
    content += `${l('Tanggal', 12)}: ${formatDateTime(transaction.created_at)}\n`;
    content += `${l('Pelanggan', 12)}: ${transaction.customer_name}\n`;
    content += line() + '\n';
    content += `#  ${transaction.device_type}\n`
    transaction.services.forEach(service => {
        const serviceName = `- ${service.name}`;
        const price = `= ${formatCurrency(service.sellPrice)}`;
        const lineText = `${serviceName}`.padEnd(PAPER_WIDTH - price.length - 3) + price;
        content += lineText.substring(0, PAPER_WIDTH) + '\n';
    });
    content += `\n  ${transaction.notes}\n`
    content += line() + '\n';
    const totalText = 'TOTAL =';
    const totalAmount = formatCurrency(totalJual);
    content += `${l(totalText, PAPER_WIDTH - totalAmount.length - 6)}${totalAmount}\n`;
    content += line('=') + '\n';
    content += buildFooter(settings) + '\n';

    await printViaBluetooth(content);
};

export const printSalesReport = async (reportData, startDate, endDate) => {
    const settings = await getStoreSettings();

    let content = '\n' + c('LAPORAN PENJUALAN', PAPER_WIDTH) + '\n';
    if (settings.store_name) content += c(settings.store_name, PAPER_WIDTH) + '\n';
    content += line('=') + '\n';
    content += `Periode: ${new Date(startDate).toLocaleDateString('id-ID')} s/d ${new Date(endDate).toLocaleDateString('id-ID')}\n`;
    content += line() + '\n';

    const addRow = (label, value) => {
        const valStr = String(value);
        return `${l(label, PAPER_WIDTH - valStr.length)}${valStr}\n`;
    }
    
    content += addRow('Total Modal:', formatCurrency(reportData.totalModal));
    content += addRow('Total Penjualan:', formatCurrency(reportData.totalJual));
    content += addRow('Total Laba:', formatCurrency(reportData.totalProfit));
    content += addRow('Total Transaksi:', reportData.totalTransactions);
    content += line() + '\n';
    
    if (reportData.transactions.length > 0) {
        content += c('Detail Transaksi', PAPER_WIDTH) + '\n' + line('-') + '\n';
        reportData.transactions.forEach(t => {
            const total = t.services.reduce((sum, s) => sum + s.sellPrice, 0);
            const customer = t.customer_name.substring(0, 24);
            const amount = formatCurrency(total);
            content += `${l(customer, PAPER_WIDTH - amount.length)}${amount}\n`;
        });
    }

    content += line('=') + '\n\n\n';

    await printViaBluetooth(content);
};