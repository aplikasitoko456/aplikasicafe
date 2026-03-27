import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  LayoutDashboard, 
  ShoppingCart, 
  FileText, 
  Plus, 
  Trash2, 
  AlertCircle, 
  Wallet, 
  ChevronRight, 
  Settings, 
  User,
  Coffee,
  Utensils,
  TrendingUp,
  History,
  PieChart,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  X,
  ChevronLeft,
  MapPin,
  Printer,
  Clock,
  CheckCircle2
} from 'lucide-react';
import { cn } from './lib/utils';
import { CurrencyInput } from './components/ui/CurrencyInput';
import { 
  Item, 
  JournalEntry, 
  Account, 
  CartItem,
  ProfitLossReport, 
  BalanceSheetReport,
  Asset
} from './types';

const formatCurrency = (amount: number) => 
  new Intl.NumberFormat('id-ID', { 
    style: 'currency', 
    currency: 'IDR', 
    minimumFractionDigits: 0 
  }).format(amount);

const formatDate = (dateStr: string) => 
  new Date(dateStr).toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });

const FormatCurrencyReport = ({ amount, className, bold = true }: { amount: number, className?: string, bold?: boolean }) => {
  const isNegative = amount < 0;
  const formatted = formatCurrency(Math.abs(amount));
  return (
    <span className={cn(className, isNegative && "text-red-600", bold && "font-bold")}>
      {isNegative ? `(${formatted})` : formatted}
    </span>
  );
};


export default function App() {
  const [activeTab, setActiveTab] = useState<'kasir' | 'antrian' | 'kinerja' | 'laporan' | 'admin'>('kasir');
  const [laporanSubTab, setLaporanSubTab] = useState<'jurnal' | 'labarugi' | 'neraca'>('jurnal');
  const [adminSubTab, setAdminSubTab] = useState<'jurnal' | 'menu' | 'akun' | 'aset'>('jurnal');
  const [antrianTab, setAntrianTab] = useState<'proses' | 'selesai'>('proses');
  
  const [items, setItems] = useState<Item[]>([]);
  const [journal, setJournal] = useState<JournalEntry[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [plReport, setPlReport] = useState<ProfitLossReport | null>(null);
  const [bsReport, setBsReport] = useState<BalanceSheetReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [reportYear, setReportYear] = useState(new Date().getFullYear());
  
  // Pagination & Filters
  const [jurnalPage, setJurnalPage] = useState(1);
  const [jurnalDateFilter, setJurnalDateFilter] = useState('');
  const [asetPage, setAsetPage] = useState(1);
  const [asetSearch, setAsetSearch] = useState('');
  const [asetFilterYear, setAsetFilterYear] = useState(new Date().getFullYear());
  const [asetToDelete, setAsetToDelete] = useState<number | null>(null);

  const [lastOrder, setLastOrder] = useState<any | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);

  // Kasir States
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customerName, setCustomerName] = useState('');
  const [tableNumber, setTableNumber] = useState('');
  const [showItemPopup, setShowItemPopup] = useState<Item | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showPrintPopup, setShowPrintPopup] = useState(false);
  const [popupQty, setPopupQty] = useState(1);
  const [popupNote, setPopupNote] = useState('');

  // Kinerja States
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1);
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [turnoverData, setTurnoverData] = useState<{date: string, total: number}[]>([]);

  // Admin Form States
  const [journalRows, setJournalRows] = useState<{ account_name: string, debit: number, credit: number, search: string, showDropdown: boolean }[]>([
    { account_name: '', debit: 0, credit: 0, search: '', showDropdown: false },
    { account_name: '', debit: 0, credit: 0, search: '', showDropdown: false }
  ]);
  const [expDesc, setExpDesc] = useState('');
  const [newItem, setNewItem] = useState({ name: '', category: 'Makanan', price: 0 });
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [newAcc, setNewAcc] = useState({ category: 'Beban', sub_category: 'Beban Operasional', name: '' });
  const [newAsset, setNewAsset] = useState({ 
    name: '', 
    kelompok: '1', 
    purchase_date: new Date().toISOString().split('T')[0], 
    acquisition_cost: 0,
    jenis: 'Inventaris',
    payment_method: 'Kas'
  });

  const fetchData = async () => {
    try {
      const [iR, jR, aR, asR, oR] = await Promise.all([
        fetch('/api/items'), 
        fetch('/api/journal'), 
        fetch('/api/accounts'), 
        fetch('/api/assets'),
        fetch('/api/orders')
      ]);
      
      setItems(await iR.json()); 
      setJournal(await jR.json()); 
      setAccounts(await aR.json()); 
      setAssets(await asR.json());
      setOrders(await oR.json());
      fetchReports();
    } catch (err) { 
      console.error(err); 
    } finally { 
      setLoading(false); 
    }
  };

  const fetchReports = async () => {
    try {
      const [plR, bsR] = await Promise.all([
        fetch(`/api/reports/profit-loss?year=${reportYear}`), 
        fetch(`/api/reports/balance-sheet?year=${reportYear}`)
      ]);
      setPlReport(await plR.json()); 
      setBsReport(await bsR.json());
    } catch (err) {
      console.error(err);
    }
  };

  const fetchTurnover = async () => {
    try {
      const res = await fetch(`/api/turnover?month=${currentMonth}&year=${currentYear}`);
      setTurnoverData(await res.json());
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => { fetchData(); }, []);
  useEffect(() => { fetchTurnover(); }, [currentMonth, currentYear]);
  useEffect(() => { fetchReports(); }, [reportYear]);

  const handleAddToCart = () => {
    if (!showItemPopup) return;
    const newItem: CartItem = {
      item_id: showItemPopup.id,
      name: showItemPopup.name,
      quantity: popupQty,
      price: showItemPopup.price_per_portion,
      note: popupNote
    };
    setCart([...cart, newItem]);
    setShowItemPopup(null);
    setPopupQty(1);
    setPopupNote('');
  };

  const removeFromCart = (index: number) => {
    const newCart = [...cart];
    newCart.splice(index, 1);
    setCart(newCart);
  };

  const handleSale = async () => {
    if (cart.length === 0) return;
    const res = await fetch('/api/sale', { 
      method: 'POST', 
      headers: { 'Content-Type': 'application/json' }, 
      body: JSON.stringify({ cart, customer_name: customerName, table_number: tableNumber }) 
    });
    if (res.ok) { 
      const d = await res.json(); 
      setLastOrder(d.order);
      setCart([]); 
      setCustomerName('');
      setTableNumber('');
      fetchData(); 
      fetchTurnover();
      setShowPrintPopup(true);
    } else {
      const err = await res.json();
      alert(err.error || "Gagal memproses penjualan");
    }
  };

  const updateOrderStatus = async (id: number, status: string) => {
    const res = await fetch(`/api/orders/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
    if (res.ok) {
      fetchData();
    }
  };

  const handleExpense = async () => {
    const totalDebit = journalRows.reduce((s, r) => s + r.debit, 0);
    const totalCredit = journalRows.reduce((s, r) => s + r.credit, 0);
    
    if (Math.abs(totalDebit - totalCredit) > 0.01) {
      alert("Total Debit dan Kredit harus sama!");
      return;
    }
    
    if (totalDebit <= 0) {
      alert("Nominal harus lebih dari 0!");
      return;
    }

    const validEntries = journalRows.filter(r => r.account_name && (r.debit > 0 || r.credit > 0));
    if (validEntries.length < 2) {
      alert("Minimal harus ada 2 akun yang terisi!");
      return;
    }

    const res = await fetch('/api/journal/multi', { 
      method: 'POST', 
      headers: { 'Content-Type': 'application/json' }, 
      body: JSON.stringify({ 
        entries: validEntries,
        description: expDesc 
      }) 
    });
    
    if (res.ok) { 
      setExpDesc(''); 
      setJournalRows([
        { account_name: '', debit: 0, credit: 0, search: '', showDropdown: false },
        { account_name: '', debit: 0, credit: 0, search: '', showDropdown: false }
      ]);
      fetchData(); 
      alert("Jurnal berhasil dicatat"); 
    }
  };

  const handleAddItem = async () => {
    if (!newItem.name || newItem.price <= 0) return;
    const url = editingItem ? `/api/items/${editingItem.id}` : '/api/items';
    const method = editingItem ? 'PATCH' : 'POST';
    
    const res = await fetch(url, { 
      method, 
      headers: { 'Content-Type': 'application/json' }, 
      body: JSON.stringify({ name: newItem.name, category: newItem.category, price_per_portion: newItem.price }) 
    });
    if (res.ok) { 
      setNewItem({ name: '', category: 'Makanan', price: 0 }); 
      setEditingItem(null);
      fetchData(); 
    }
  };

  const handleAddAccount = async () => {
    if (!newAcc.name) return;
    const res = await fetch('/api/accounts', { 
      method: 'POST', 
      headers: { 'Content-Type': 'application/json' }, 
      body: JSON.stringify({ category: newAcc.category, sub_category: newAcc.sub_category, account_name: newAcc.name }) 
    });
    if (res.ok) { 
      setNewAcc({ ...newAcc, name: '' }); 
      fetchData(); 
    } else {
      alert("Gagal menambahkan akun");
    }
  };

  const handleAddAsset = async () => {
    if (!newAsset.name || newAsset.acquisition_cost <= 0) return;
    const res = await fetch('/api/assets', { 
      method: 'POST', 
      headers: { 'Content-Type': 'application/json' }, 
      body: JSON.stringify(newAsset) 
    });
    if (res.ok) { 
      setNewAsset({ 
        name: '', 
        kelompok: '1', 
        purchase_date: new Date().toISOString().split('T')[0], 
        acquisition_cost: 0,
        jenis: 'Inventaris',
        payment_method: 'Kas'
      }); 
      fetchData(); 
    } else {
      alert("Gagal menambahkan aset");
    }
  };

  const handleDeleteAsset = (id: number) => {
    setAsetToDelete(id);
  };

  const confirmDeleteAsset = async () => {
    if (!asetToDelete) return;
    const res = await fetch(`/api/assets/${asetToDelete}`, { method: 'DELETE' });
    if (res.ok) fetchData();
    setAsetToDelete(null);
  };

  const changeMonth = (dir: 'prev' | 'next') => {
    if (dir === 'prev') {
      if (currentMonth === 1) {
        setCurrentMonth(12);
        setCurrentYear(currentYear - 1);
      } else {
        setCurrentMonth(currentMonth - 1);
      }
    } else {
      if (currentMonth === 12) {
        setCurrentMonth(1);
        setCurrentYear(currentYear + 1);
      } else {
        setCurrentMonth(currentMonth + 1);
      }
    }
  };

  if (loading) return (
    <div className="flex h-screen items-center justify-center bg-cafe-cream">
      <div className="text-center">
        <Coffee className="w-12 h-12 text-cafe-olive animate-bounce mx-auto mb-4" />
        <h2 className="text-xl font-serif font-bold text-cafe-olive">Menyiapkan Cafe Bajibun...</h2>
      </div>
    </div>
  );

  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  return (
    <div className="min-h-screen flex flex-col bg-cafe-cream/30">
      {/* Top Header */}
      <header className="relative h-32 flex flex-col justify-center px-6 overflow-hidden shadow-md">
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&q=80&w=1000" 
            alt="Cafe Background" 
            className="w-full h-full object-cover opacity-30"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-cafe-olive/40 to-cafe-cream/80"></div>
        </div>
        <div className="relative z-10">
          <h1 className="text-3xl font-serif font-black text-cafe-olive tracking-tight">Cafe Bajibun</h1>
          <div className="flex items-center gap-1 text-cafe-olive/70 text-xs font-bold">
            <MapPin size={12} />
            <span>jalan Andi Tonro Gowa</span>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 p-4 pb-24 md:pb-10 max-w-4xl mx-auto w-full">
        <AnimatePresence mode="wait">
          {activeTab === 'kasir' && (
            <motion.div 
              key="kasir" 
              initial={{ opacity: 0, y: 20 }} 
              animate={{ opacity: 1, y: 0 }} 
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <div className="grid grid-cols-2 gap-3">
                {items.map(item => (
                  <button 
                    key={item.id}
                    onClick={() => {
                      setShowItemPopup(item);
                      setPopupQty(1);
                      setPopupNote('');
                    }}
                    className="p-4 rounded-2xl bg-white border border-cafe-olive/5 shadow-sm text-left active:scale-95 transition-all"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="p-2 bg-cafe-cream rounded-xl text-cafe-olive">
                        {item.category === 'Minuman' ? <Coffee size={18} /> : <Utensils size={18} />}
                      </div>
                    </div>
                    <h3 className="text-sm font-bold text-cafe-ink leading-tight mb-1">{item.name}</h3>
                    <p className="text-xs font-black text-cafe-accent">
                      {formatCurrency(item.price_per_portion)}
                    </p>
                  </button>
                ))}
              </div>

              {/* Order Summary */}
              <div className="bg-white p-6 rounded-[2rem] shadow-xl border border-cafe-olive/5">
                <h3 className="text-lg font-serif font-bold mb-4 flex items-center gap-2">
                  <ShoppingCart className="text-cafe-accent" size={20} /> Ringkasan Pesanan
                </h3>

                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-widest text-cafe-olive/50">Nama Pemesan</label>
                    <input 
                      type="text" 
                      value={customerName} 
                      onChange={e => setCustomerName(e.target.value)} 
                      placeholder="Opsional"
                      className="w-full border border-cafe-cream rounded-xl px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-cafe-olive bg-cafe-cream/10"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-widest text-cafe-olive/50">Meja</label>
                    <input 
                      type="text" 
                      value={tableNumber} 
                      onChange={e => setTableNumber(e.target.value)} 
                      placeholder="Opsional"
                      className="w-full border border-cafe-cream rounded-xl px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-cafe-olive bg-cafe-cream/10"
                    />
                  </div>
                </div>
                
                <div className="space-y-3 mb-6">
                  {cart.length === 0 ? (
                    <p className="text-center py-4 text-cafe-olive/40 text-sm italic">Belum ada pesanan</p>
                  ) : (
                    cart.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-start p-3 bg-cafe-cream/50 rounded-xl">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-black text-cafe-olive">{item.quantity}x</span>
                            <span className="text-sm font-bold text-cafe-ink">{item.name}</span>
                          </div>
                          {item.note && <p className="text-[10px] text-cafe-olive/60 italic mt-0.5 ml-6">"{item.note}"</p>}
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-bold">{formatCurrency(item.price * item.quantity)}</span>
                          <button onClick={() => removeFromCart(idx)} className="text-red-500 p-1"><Trash2 size={14} /></button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {cart.length > 0 && (
                  <div className="pt-4 border-t border-cafe-cream">
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-sm font-bold text-cafe-olive/60">Total Bayar</span>
                      <span className="text-2xl font-black text-cafe-accent">{formatCurrency(cartTotal)}</span>
                    </div>
                    <button 
                      onClick={handleSale}
                      className="w-full bg-cafe-olive text-white py-4 rounded-2xl font-black text-base hover:bg-cafe-ink transition-all shadow-lg"
                    >
                      PROSES TRANSAKSI
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {activeTab === 'antrian' && (
            <motion.div 
              key="antrian" 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              className="space-y-6"
            >
              <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
                {[
                  {id:'proses',label:'Proses', icon: Clock},
                  {id:'selesai',label:'Selesai', icon: CheckCircle2}
                ].map(s => (
                  <button 
                    key={s.id} 
                    onClick={() => setAntrianTab(s.id as any)} 
                    className={cn(
                      "px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap flex items-center gap-2", 
                      antrianTab === s.id ? "bg-cafe-olive text-white" : "bg-white text-cafe-olive/50 border border-cafe-olive/5"
                    )}
                  >
                    <s.icon size={14} />
                    {s.label}
                  </button>
                ))}
              </div>

              <div className="space-y-4">
                {orders
                  .filter(o => antrianTab === 'proses' ? o.status === 'processing' : o.status === 'completed')
                  .sort((a, b) => {
                    if (antrianTab === 'proses') {
                      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
                    } else {
                      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
                    }
                  })
                  .map(order => {
                    const items = JSON.parse(order.items_json || '[]');
                    return (
                      <motion.div 
                        key={order.id}
                        layout
                        onClick={() => {
                          if (order.status === 'processing') {
                            setSelectedOrder(order);
                            setShowDetails(false);
                          }
                        }}
                        className="bg-white p-4 rounded-2xl border border-cafe-olive/5 shadow-sm flex items-center justify-between cursor-pointer active:scale-[0.98] transition-all"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-cafe-cream rounded-xl flex items-center justify-center">
                            <span className="text-xl font-black text-cafe-olive">{order.queue_number}</span>
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-bold text-cafe-ink">{order.customer_name || 'Pelanggan'}</span>
                              {order.table_number && (
                                <span className="px-2 py-0.5 bg-cafe-accent/10 text-cafe-accent text-[10px] font-black rounded-md">
                                  Meja {order.table_number}
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] text-cafe-olive/60 mt-0.5 line-clamp-1">
                              {items.map((i: any) => `${i.name} (${i.quantity})`).join(', ')}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] text-cafe-olive/40 font-bold">{new Date(order.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</p>
                          {order.status === 'completed' && <CheckCircle2 size={16} className="text-green-500 ml-auto mt-1" />}
                        </div>
                      </motion.div>
                    );
                  })}
                {orders.filter(o => antrianTab === 'proses' ? o.status === 'processing' : o.status === 'completed').length === 0 && (
                  <div className="text-center py-20">
                    <Clock className="w-12 h-12 text-cafe-olive/10 mx-auto mb-4" />
                    <p className="text-sm font-bold text-cafe-olive/30 italic">Tidak ada antrian {antrianTab}</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {activeTab === 'kinerja' && (
            <motion.div 
              key="kinerja" 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              className="space-y-6"
            >
              <div className="flex items-center justify-between bg-white p-4 rounded-2xl shadow-sm border border-cafe-olive/5">
                <button onClick={() => changeMonth('prev')} className="p-2 hover:bg-cafe-cream rounded-xl transition-colors"><ChevronLeft /></button>
                <h3 className="text-lg font-serif font-bold text-cafe-olive">
                  {new Date(currentYear, currentMonth - 1).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}
                </h3>
                <button onClick={() => changeMonth('next')} className="p-2 hover:bg-cafe-cream rounded-xl transition-colors"><ChevronRight /></button>
              </div>

              <div className="bg-white rounded-[2rem] border border-cafe-olive/5 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-cafe-cream bg-cafe-cream/20">
                  <h3 className="text-base font-serif font-bold">Tabel Omset Harian</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-cafe-cream/50 text-cafe-olive/50 font-black uppercase tracking-widest">
                      <tr>
                        <th className="px-6 py-4">Tanggal</th>
                        <th className="px-6 py-4 text-right">Omset</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-cafe-cream">
                      {turnoverData.length === 0 ? (
                        <tr><td colSpan={2} className="px-6 py-10 text-center text-cafe-olive/40 italic">Tidak ada data di bulan ini</td></tr>
                      ) : (
                        turnoverData.map((d, i) => (
                          <tr key={i} className="hover:bg-cafe-cream/10">
                            <td className="px-6 py-4 font-medium text-cafe-olive/70">{formatDate(d.date)}</td>
                            <td className="px-6 py-4 text-right font-black text-cafe-ink">{formatCurrency(d.total)}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                    {turnoverData.length > 0 && (
                      <tfoot className="bg-cafe-cream/30 font-black">
                        <tr>
                          <td className="px-6 py-4">Total Sebulan</td>
                          <td className="px-6 py-4 text-right text-cafe-accent">
                            {formatCurrency(turnoverData.reduce((s, d) => s + parseFloat(d.total as any), 0))}
                          </td>
                        </tr>
                      </tfoot>
                    )}
                  </table>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'laporan' && (
            <motion.div key="laporan" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
                {[
                  {id:'jurnal',label:'Jurnal'},
                  {id:'labarugi',label:'Laba Rugi'},
                  {id:'neraca',label:'Neraca'}
                ].map(s => (
                  <button 
                    key={s.id} 
                    onClick={() => setLaporanSubTab(s.id as any)} 
                    className={cn(
                      "px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap", 
                      laporanSubTab === s.id ? "bg-cafe-olive text-white" : "bg-white text-cafe-olive/50 border border-cafe-olive/5"
                    )}
                  >
                    {s.label}
                  </button>
                ))}
              </div>

              {(laporanSubTab === 'labarugi' || laporanSubTab === 'neraca') && (
                <div className="flex items-center gap-3 bg-white p-3 rounded-2xl border border-cafe-olive/5 shadow-sm">
                  <span className="text-[10px] font-black uppercase text-cafe-olive/40">Pilih Tahun:</span>
                  <select 
                    value={reportYear} 
                    onChange={e => setReportYear(parseInt(e.target.value))}
                    className="bg-cafe-cream/20 border-none rounded-lg px-3 py-1 text-xs font-bold outline-none focus:ring-1 focus:ring-cafe-olive"
                  >
                    {Array.from({ length: new Date().getFullYear() - 2025 + 1 }, (_, i) => 2025 + i).map(y => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>
              )}

              {laporanSubTab === 'jurnal' && (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 bg-white p-3 rounded-2xl border border-cafe-olive/5 shadow-sm">
                    <span className="text-[10px] font-black uppercase text-cafe-olive/40">Filter Tanggal:</span>
                    <input 
                      type="date" 
                      value={jurnalDateFilter} 
                      onChange={e => {
                        setJurnalDateFilter(e.target.value);
                        setJurnalPage(1);
                      }}
                      className="bg-cafe-cream/20 border-none rounded-lg px-3 py-1 text-xs font-bold outline-none focus:ring-1 focus:ring-cafe-olive"
                    />
                    {jurnalDateFilter && (
                      <button onClick={() => setJurnalDateFilter('')} className="text-red-500 hover:bg-red-50 p-1 rounded-lg transition-colors">
                        <X size={14} />
                      </button>
                    )}
                  </div>
                  
                  <div className="bg-white rounded-2xl border border-cafe-olive/5 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-[10px]">
                        <thead className="bg-cafe-cream/50 text-cafe-olive/50 font-black uppercase">
                          <tr>
                            <th className="px-4 py-3">Tgl</th>
                            <th className="px-4 py-3">Akun</th>
                            <th className="px-4 py-3 text-right">Debit</th>
                            <th className="px-4 py-3 text-right">Kredit</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-cafe-cream">
                          {(() => {
                            const filtered = journal.filter(j => !jurnalDateFilter || j.date.startsWith(jurnalDateFilter));
                            const start = (jurnalPage - 1) * 10;
                            const paginated = filtered.slice(start, start + 10);
                            
                            if (paginated.length === 0) return <tr><td colSpan={4} className="px-4 py-10 text-center text-cafe-olive/40 italic">Tidak ada data</td></tr>;
                            
                            return paginated.map(j => (
                              <tr key={j.id}>
                                <td className="px-4 py-3 whitespace-nowrap">{new Date(j.date).toLocaleDateString('id-ID', {day:'2-digit', month:'2-digit'})}</td>
                                <td className="px-4 py-3 font-bold">{j.account_name}</td>
                                <td className="px-4 py-3 text-right text-green-600">{j.debit > 0 ? formatCurrency(j.debit) : '-'}</td>
                                <td className="px-4 py-3 text-right text-red-600">{j.credit > 0 ? formatCurrency(j.credit) : '-'}</td>
                              </tr>
                            ));
                          })()}
                        </tbody>
                      </table>
                    </div>
                    {/* Pagination Controls */}
                    <div className="p-3 border-t border-cafe-cream flex justify-between items-center">
                      <button 
                        disabled={jurnalPage === 1}
                        onClick={() => setJurnalPage(p => p - 1)}
                        className="p-1 disabled:opacity-30"
                      >
                        <ChevronLeft size={16} />
                      </button>
                      <span className="text-[10px] font-black text-cafe-olive/50">Halaman {jurnalPage}</span>
                      <button 
                        disabled={jurnalPage * 10 >= journal.filter(j => !jurnalDateFilter || j.date.startsWith(jurnalDateFilter)).length}
                        onClick={() => setJurnalPage(p => p + 1)}
                        className="p-1 disabled:opacity-30"
                      >
                        <ChevronRight size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {laporanSubTab === 'labarugi' && plReport && (
                <div className="bg-white p-6 rounded-2xl border border-cafe-olive/5 shadow-sm space-y-4">
                  <div className="text-center border-b pb-4">
                    <h2 className="font-serif font-bold text-lg">Laba Rugi</h2>
                    <p className="text-[10px] text-cafe-olive/60 font-bold">1 Januari s.d. 31 Desember {reportYear}</p>
                  </div>
                  <div className="flex justify-between text-sm font-bold"><span>Penjualan</span><FormatCurrencyReport amount={plReport.penjualan} /></div>
                  <div className="space-y-1 pl-2 border-l-2 border-cafe-olive/20">
                    <div className="flex justify-between text-xs text-cafe-olive/60 italic"><span>Persediaan Awal</span><FormatCurrencyReport amount={plReport.persediaanAwal} bold={false} /></div>
                    <div className="flex justify-between text-xs text-cafe-olive/60 italic"><span>Pembelian</span><FormatCurrencyReport amount={plReport.pembelian} bold={false} /></div>
                    <div className="flex justify-between text-xs text-cafe-olive/60 italic"><span>Persediaan Akhir</span><FormatCurrencyReport amount={-plReport.persediaanAkhir} bold={false} /></div>
                    <div className="flex justify-between text-xs font-bold text-cafe-olive/80"><span>HPP (Manual)</span><FormatCurrencyReport amount={plReport.hpp} /></div>
                  </div>
                  <div className="flex justify-between font-black bg-cafe-cream/30 p-2 rounded-lg"><span>Laba Kotor</span><FormatCurrencyReport amount={plReport.labaKotor} /></div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase text-cafe-olive/40">Beban Operasional</p>
                    {plReport.bebanOperasional.map((b, i) => (
                      <div key={i} className="flex justify-between text-xs"><span>{b.name}</span><FormatCurrencyReport amount={b.amount} bold={false} /></div>
                    ))}
                  </div>
                  <div className="flex justify-between font-black bg-cafe-accent text-white p-3 rounded-xl"><span>Laba Bersih</span><FormatCurrencyReport amount={plReport.labaBersih} /></div>
                </div>
              )}

              {laporanSubTab === 'neraca' && bsReport && (
                <div className="bg-white p-6 rounded-2xl border border-cafe-olive/5 shadow-sm space-y-6">
                  <div className="text-center border-b pb-4">
                    <h2 className="font-serif font-bold text-lg">Neraca</h2>
                    <p className="text-[10px] text-cafe-olive/60 font-bold">1 Januari s.d. 31 Desember {reportYear}</p>
                  </div>
                  <div className="space-y-4">
                    <h4 className="text-[10px] font-black uppercase text-cafe-olive border-b pb-1">Aktiva</h4>
                    {Object.entries(bsReport.asetGrouped || {}).map(([sub, assets]: [string, any]) => (
                      <div key={sub} className="space-y-2">
                        <h5 className="text-[9px] font-bold text-cafe-olive/60 pl-2">{sub}</h5>
                        {assets.map((a: any, i: number) => (
                          <div key={i} className="flex justify-between text-xs pl-4">
                            <span>{a.name}</span>
                            <FormatCurrencyReport amount={a.amount} />
                          </div>
                        ))}
                      </div>
                    ))}
                    <div className="flex justify-between font-black pt-2 border-t"><span>Total Aktiva</span><FormatCurrencyReport amount={bsReport.totalAset} /></div>
                  </div>
                  <div className="space-y-3">
                    <h4 className="text-[10px] font-black uppercase text-blue-600 border-b pb-1">Pasiva</h4>
                    {Object.entries(bsReport.kewajibanGrouped || {}).map(([sub, liabs]: [string, any]) => (
                      <div key={sub} className="space-y-2">
                        <h5 className="text-[9px] font-bold text-blue-600/60 pl-2">{sub}</h5>
                        {liabs.map((k: any, i: number) => (
                          <div key={i} className="flex justify-between text-xs pl-4">
                            <span>{k.name}</span>
                            <FormatCurrencyReport amount={k.amount} />
                          </div>
                        ))}
                      </div>
                    ))}
                    <div className="space-y-2">
                      <h5 className="text-[9px] font-bold text-blue-600/60 pl-2">Ekuitas</h5>
                      {bsReport.ekuitas.map((e, i) => (
                        <div key={i} className="flex justify-between text-xs pl-4">
                          <span>{e.name}</span>
                          <FormatCurrencyReport amount={e.amount} />
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-between font-black pt-2 border-t"><span>Total Pasiva</span><FormatCurrencyReport amount={bsReport.totalPasiva} /></div>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'admin' && (
            <motion.div key="admin" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
                {[
                  {id:'jurnal',label:'Jurnal'},
                  {id:'menu',label:'Menu'},
                  {id:'aset',label:'Aset'},
                  {id:'akun',label:'Akun'}
                ].map(s => (
                  <button 
                    key={s.id} 
                    onClick={() => setAdminSubTab(s.id as any)} 
                    className={cn(
                      "px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap", 
                      adminSubTab === s.id ? "bg-cafe-olive text-white" : "bg-white text-cafe-olive/50 border border-cafe-olive/5"
                    )}
                  >
                    {s.label}
                  </button>
                ))}
              </div>

              {adminSubTab === 'jurnal' && (
                <div className="space-y-6">
                  <div className="bg-white p-6 rounded-2xl border border-cafe-olive/5 shadow-sm space-y-4">
                    <div className="space-y-4">
                      {journalRows.map((row, index) => (
                        <div key={index} className="grid grid-cols-12 gap-2 items-end">
                          <div className="col-span-5 relative">
                            <label className="text-[8px] font-black uppercase text-cafe-olive/50">Akun</label>
                            <input 
                              type="text"
                              placeholder="Cari akun..."
                              value={row.search || row.account_name}
                              onFocus={() => {
                                const newRows = [...journalRows];
                                newRows[index].showDropdown = true;
                                newRows[index].search = '';
                                setJournalRows(newRows);
                              }}
                              onBlur={() => setTimeout(() => {
                                const newRows = [...journalRows];
                                newRows[index].showDropdown = false;
                                setJournalRows(newRows);
                              }, 200)}
                              onChange={(e) => {
                                const newRows = [...journalRows];
                                newRows[index].search = e.target.value;
                                newRows[index].showDropdown = true;
                                setJournalRows(newRows);
                              }}
                              className="w-full border rounded-xl px-3 py-2 text-[10px] bg-cafe-cream/20 outline-none focus:ring-1 focus:ring-cafe-olive"
                            />
                            {row.showDropdown && (
                              <div className="absolute z-50 left-0 right-0 mt-1 bg-white border border-cafe-cream rounded-xl shadow-xl max-h-40 overflow-y-auto">
                                {accounts
                                  .filter(a => a.account_name.toLowerCase().includes(row.search.toLowerCase()))
                                  .map(a => (
                                    <button 
                                      key={a.id}
                                      onClick={() => {
                                        const newRows = [...journalRows];
                                        newRows[index].account_name = a.account_name;
                                        newRows[index].search = a.account_name;
                                        newRows[index].showDropdown = false;
                                        setJournalRows(newRows);
                                      }}
                                      className="w-full text-left px-3 py-2 text-[10px] hover:bg-cafe-cream transition-colors border-b border-cafe-cream last:border-0"
                                    >
                                      {a.account_name} <span className="text-[8px] text-cafe-olive/40 italic">({a.category})</span>
                                    </button>
                                  ))}
                              </div>
                            )}
                          </div>
                          <div className="col-span-3">
                            <label className="text-[8px] font-black uppercase text-cafe-olive/50">Debit</label>
                            <CurrencyInput 
                              value={row.debit} 
                              onChange={(v) => {
                                const newRows = [...journalRows];
                                newRows[index].debit = v;
                                if (v > 0) newRows[index].credit = 0;
                                setJournalRows(newRows);
                              }} 
                              className="w-full bg-cafe-cream/20 py-2 text-[10px]" 
                            />
                          </div>
                          <div className="col-span-3">
                            <label className="text-[8px] font-black uppercase text-cafe-olive/50">Kredit</label>
                            <CurrencyInput 
                              value={row.credit} 
                              onChange={(v) => {
                                const newRows = [...journalRows];
                                newRows[index].credit = v;
                                if (v > 0) newRows[index].debit = 0;
                                setJournalRows(newRows);
                              }} 
                              className="w-full bg-cafe-cream/20 py-2 text-[10px]" 
                            />
                          </div>
                          <div className="col-span-1">
                            <button 
                              onClick={() => {
                                if (journalRows.length > 2) {
                                  setJournalRows(journalRows.filter((_, i) => i !== index));
                                }
                              }}
                              className="w-full h-9 flex items-center justify-center text-red-500 hover:bg-red-50 rounded-xl"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      ))}
                      <button 
                        onClick={() => setJournalRows([...journalRows, { account_name: '', debit: 0, credit: 0, search: '', showDropdown: false }])}
                        className="w-full py-2 border-2 border-dashed border-cafe-olive/20 rounded-xl text-[10px] font-bold text-cafe-olive/40 hover:bg-cafe-cream/50 transition-all"
                      >
                        + TAMBAH BARIS
                      </button>
                      <div className="flex justify-between px-2 text-[10px] font-black text-cafe-olive">
                        <span>Total:</span>
                        <div className="space-x-4">
                          <span className="text-red-600">D: {formatCurrency(journalRows.reduce((s, r) => s + r.debit, 0))}</span>
                          <span className="text-green-600">K: {formatCurrency(journalRows.reduce((s, r) => s + r.credit, 0))}</span>
                        </div>
                      </div>
                    </div>
                    <textarea value={expDesc} onChange={e => setExpDesc(e.target.value)} placeholder="Keterangan..." className="w-full border rounded-xl px-3 py-2 text-xs bg-cafe-cream/20 h-20 resize-none" />
                    <button onClick={handleExpense} className="w-full bg-red-500 text-white py-3 rounded-xl font-black text-xs">SIMPAN JURNAL</button>
                  </div>

                  <div className="bg-white rounded-2xl border border-cafe-olive/5 shadow-sm overflow-hidden">
                    <div className="p-4 border-b border-cafe-cream bg-cafe-cream/10">
                      <h4 className="text-[10px] font-black uppercase text-cafe-olive">Transaksi Jurnal Terakhir (Hari Ini)</h4>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-[9px]">
                        <thead className="bg-cafe-cream/50 text-cafe-olive/50 font-black uppercase">
                          <tr>
                            <th className="px-3 py-2">Tanggal</th>
                            <th className="px-3 py-2">Keterangan</th>
                            <th className="px-3 py-2">Debit</th>
                            <th className="px-3 py-2">Kredit</th>
                            <th className="px-3 py-2 text-right">Nominal</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-cafe-cream">
                          {journal
                            .filter(j => {
                              const isToday = new Date(j.date).toDateString() === new Date().toDateString();
                              return isToday && (j.transaction_id.startsWith('T-EXP-') || j.transaction_id.startsWith('T-SALE-') || j.transaction_id.startsWith('T-JRN-'));
                            })
                            .reduce((acc: any[], curr) => {
                              const existing = acc.find(a => a.transaction_id === curr.transaction_id);
                              if (existing) {
                                if (curr.debit > 0) existing.debit_acc = existing.debit_acc ? `${existing.debit_acc}, ${curr.account_name}` : curr.account_name;
                                if (curr.credit > 0) existing.credit_acc = existing.credit_acc ? `${existing.credit_acc}, ${curr.account_name}` : curr.account_name;
                              } else {
                                acc.push({
                                  transaction_id: curr.transaction_id,
                                  date: curr.date,
                                  description: curr.description,
                                  amount: curr.debit > 0 ? curr.debit : curr.credit,
                                  debit_acc: curr.debit > 0 ? curr.account_name : '',
                                  credit_acc: curr.credit > 0 ? curr.account_name : ''
                                });
                              }
                              return acc;
                            }, [])
                            .slice(0, 15)
                            .map((t, i) => (
                              <tr key={i}>
                                <td className="px-3 py-2 whitespace-nowrap">{new Date(t.date).toLocaleTimeString('id-ID', {hour:'2-digit', minute:'2-digit'})}</td>
                                <td className="px-3 py-2">{t.description}</td>
                                <td className="px-3 py-2 font-bold text-red-600">{t.debit_acc}</td>
                                <td className="px-3 py-2 font-bold text-green-600">{t.credit_acc}</td>
                                <td className="px-3 py-2 text-right font-black">{formatCurrency(t.amount)}</td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {adminSubTab === 'menu' && (
                <div className="space-y-6">
                  <div className="bg-white p-5 rounded-2xl border border-cafe-olive/5 shadow-sm space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <input value={newItem.name} onChange={e => setNewItem({...newItem, name: e.target.value})} placeholder="Nama Menu" className="w-full border rounded-xl px-3 py-2 text-xs bg-cafe-cream/20" />
                      <select value={newItem.category} onChange={e => setNewItem({...newItem, category: e.target.value})} className="w-full border rounded-xl px-3 py-2 text-xs bg-cafe-cream/20">
                        <option value="Makanan">Makanan</option><option value="Minuman">Minuman</option>
                      </select>
                    </div>
                    <CurrencyInput value={newItem.price} onChange={(v:number) => setNewItem({...newItem, price: v})} placeholder="Harga Jual" className="w-full bg-cafe-cream/20 py-2 text-xs" />
                    <div className="flex gap-2">
                      {editingItem && (
                        <button 
                          onClick={() => {
                            setEditingItem(null);
                            setNewItem({ name: '', category: 'Makanan', price: 0 });
                          }} 
                          className="flex-1 bg-cafe-cream text-cafe-olive py-3 rounded-xl font-bold text-xs"
                        >
                          BATAL
                        </button>
                      )}
                      <button onClick={handleAddItem} className="flex-[2] bg-cafe-accent text-white py-3 rounded-xl font-black text-xs">
                        {editingItem ? 'EDIT MENU' : 'TAMBAH MENU'}
                      </button>
                    </div>
                  </div>
                  <div className="bg-white rounded-2xl border border-cafe-olive/5 shadow-sm overflow-hidden">
                    <table className="w-full text-left text-[10px]">
                      <thead className="bg-cafe-cream/50 text-cafe-olive/50 font-black uppercase"><tr><th className="px-4 py-3">Nama</th><th className="px-4 py-3 text-right">Harga</th></tr></thead>
                      <tbody className="divide-y divide-cafe-cream">
                        {items.map(i => (
                          <tr 
                            key={i.id} 
                            onClick={() => {
                              setEditingItem(i);
                              setNewItem({ name: i.name, category: i.category, price: i.price_per_portion });
                            }}
                            className="hover:bg-cafe-cream/10 cursor-pointer active:bg-cafe-cream/20"
                          >
                            <td className="px-4 py-3 font-bold">{i.name}</td>
                            <td className="px-4 py-3 text-right font-black">{formatCurrency(i.price_per_portion)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {adminSubTab === 'aset' && (
                <div className="space-y-6">
                  <div className="bg-white p-6 rounded-2xl border border-cafe-olive/5 shadow-sm space-y-4">
                    <h3 className="text-base font-serif font-bold">Tambah Aset Baru</h3>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[8px] font-black uppercase text-cafe-olive/50">Nama Aset</label>
                        <input value={newAsset.name} onChange={e => setNewAsset({...newAsset, name: e.target.value})} placeholder="Nama Aset" className="w-full border rounded-xl px-4 py-2 text-xs bg-cafe-cream/20 outline-none focus:ring-1 focus:ring-cafe-olive" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[8px] font-black uppercase text-cafe-olive/50">Kelompok</label>
                        <select value={newAsset.kelompok} onChange={e => setNewAsset({...newAsset, kelompok: e.target.value})} className="w-full border rounded-xl px-4 py-2 text-xs bg-cafe-cream/20 outline-none focus:ring-1 focus:ring-cafe-olive">
                          <option value="1">Kelompok 1 (4 Thn)</option>
                          <option value="2">Kelompok 2 (8 Thn)</option>
                          <option value="3">Kelompok 3 (16 Thn)</option>
                          <option value="4">Kelompok 4 (20 Thn)</option>
                          <option value="Bangunan Permanen">Bangunan Permanen (20 Thn)</option>
                          <option value="Bangunan Tidak Permanen">Bangunan Tidak Permanen (10 Thn)</option>
                        </select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[8px] font-black uppercase text-cafe-olive/50">Jenis Aset</label>
                        <select value={newAsset.jenis} onChange={e => setNewAsset({...newAsset, jenis: e.target.value})} className="w-full border rounded-xl px-4 py-2 text-xs bg-cafe-cream/20 outline-none focus:ring-1 focus:ring-cafe-olive">
                          <option value="Tanah dan/atau bangunan">Tanah dan/atau bangunan</option>
                          <option value="Kendaraan">Kendaraan</option>
                          <option value="Inventaris">Inventaris</option>
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[8px] font-black uppercase text-cafe-olive/50">Metode Bayar</label>
                        <select value={newAsset.payment_method} onChange={e => setNewAsset({...newAsset, payment_method: e.target.value})} className="w-full border rounded-xl px-4 py-2 text-xs bg-cafe-cream/20 outline-none focus:ring-1 focus:ring-cafe-olive">
                          <option value="Kas">Kas</option>
                          <option value="Bank">Bank</option>
                          <option value="Utang Lancar Lainnya">Utang Lancar Lainnya</option>
                        </select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[8px] font-black uppercase text-cafe-olive/50">Tanggal Beli</label>
                        <input type="date" value={newAsset.purchase_date} onChange={e => setNewAsset({...newAsset, purchase_date: e.target.value})} className="w-full border rounded-xl px-4 py-2 text-xs bg-cafe-cream/20 outline-none focus:ring-1 focus:ring-cafe-olive" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[8px] font-black uppercase text-cafe-olive/50">Harga Perolehan</label>
                        <CurrencyInput value={newAsset.acquisition_cost} onChange={(v:number) => setNewAsset({...newAsset, acquisition_cost: v})} placeholder="Harga Perolehan" className="w-full bg-cafe-cream/20 py-2 text-xs" />
                      </div>
                    </div>
                    <button onClick={handleAddAsset} className="w-full bg-cafe-olive text-white py-4 rounded-xl font-black text-sm hover:bg-cafe-ink transition-all shadow-lg shadow-cafe-olive/20">TAMBAH ASET</button>
                  </div>

                  <div className="bg-white rounded-2xl border border-cafe-olive/5 shadow-sm overflow-hidden">
                    <div className="p-4 border-b border-cafe-cream bg-cafe-cream/10 flex justify-between items-center gap-4">
                      <div className="flex items-center gap-3">
                        <h4 className="text-[10px] font-black uppercase text-cafe-olive whitespace-nowrap">Daftar Aset</h4>
                        <select 
                          value={asetFilterYear}
                          onChange={e => {
                            setAsetFilterYear(parseInt(e.target.value));
                            setAsetPage(1);
                          }}
                          className="px-2 py-1 border rounded-lg text-[10px] bg-white outline-none focus:ring-1 focus:ring-cafe-olive font-bold"
                        >
                          {Array.from({ length: new Date().getFullYear() - 2025 + 1 }, (_, i) => 2025 + i).map(y => (
                            <option key={y} value={y}>{y}</option>
                          ))}
                        </select>
                      </div>
                      <div className="relative flex-1 max-w-[200px]">
                        <input 
                          type="text" 
                          placeholder="Cari aset..." 
                          value={asetSearch}
                          onChange={e => {
                            setAsetSearch(e.target.value);
                            setAsetPage(1);
                          }}
                          className="w-full pl-8 pr-3 py-1 border rounded-lg text-[10px] bg-white outline-none focus:ring-1 focus:ring-cafe-olive"
                        />
                        <LayoutDashboard size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-cafe-olive/40" />
                      </div>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-[8px]">
                        <thead className="bg-cafe-cream/50 text-cafe-olive/50 font-black uppercase">
                          <tr>
                            <th className="px-3 py-3">Aset</th>
                            <th className="px-3 py-3">Jenis</th>
                            <th className="px-3 py-3">Klp</th>
                            <th className="px-3 py-3">Tgl Beli</th>
                            <th className="px-3 py-3 text-right">Perolehan</th>
                            <th className="px-3 py-3 text-right">Buku Awal</th>
                            <th className="px-3 py-3 text-right">Peny. Thn Ini</th>
                            <th className="px-3 py-3 text-right">Buku Akhir</th>
                            <th className="px-3 py-3 text-right">Akum. Peny.</th>
                            <th className="px-3 py-3 text-center">Aksi</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-cafe-cream">
                          {(() => {
                            const filtered = assets.filter(a => 
                              a.name.toLowerCase().includes(asetSearch.toLowerCase()) &&
                              new Date(a.purchase_date).getFullYear() <= asetFilterYear
                            );
                            const start = (asetPage - 1) * 10;
                            const paginated = filtered.slice(start, start + 10);
                            
                            if (paginated.length === 0) return <tr><td colSpan={10} className="px-3 py-10 text-center text-cafe-olive/40 italic">Tidak ada aset</td></tr>;
                            
                            return paginated.map(a => {
                              const rates: { [key: string]: number } = { '1': 0.25, '2': 0.125, '3': 0.0625, '4': 0.05, 'Bangunan Permanen': 0.05, 'Bangunan Tidak Permanen': 0.10 };
                              const rate = rates[a.kelompok] || 0;
                              const cost = parseFloat(a.acquisition_cost as any);
                              const pDate = new Date(a.purchase_date);
                              
                              const currentYear = asetFilterYear;
                              const now = new Date();
                              const currentMonth = currentYear < now.getFullYear() ? 12 : (currentYear === now.getFullYear() ? (now.getMonth() + 1) : 12);
                              
                              const monthlyDep = (cost * rate) / 12;
                              
                              // Months before this year
                              const monthsBeforeThisYear = Math.max(0, (currentYear - pDate.getFullYear()) * 12 - pDate.getMonth());
                              const accDepStartYear = Math.min(cost, monthlyDep * monthsBeforeThisYear);
                              const bookValueStartYear = cost - accDepStartYear;
                              
                              // Months this year
                              const monthsThisYear = pDate.getFullYear() < currentYear ? currentMonth : Math.max(0, currentMonth - pDate.getMonth());
                              const depThisYear = Math.min(bookValueStartYear, monthlyDep * monthsThisYear);
                              
                              const bookValueEndYear = bookValueStartYear - depThisYear;
                              const accDepTotal = accDepStartYear + depThisYear;

                              return (
                                <tr key={a.id} className="hover:bg-cafe-cream/5">
                                  <td className="px-3 py-3 font-bold">{a.name}</td>
                                  <td className="px-3 py-3">{a.jenis}</td>
                                  <td className="px-3 py-3">{a.kelompok}</td>
                                  <td className="px-3 py-3 whitespace-nowrap">{formatDate(a.purchase_date)}</td>
                                  <td className="px-3 py-3 text-right">{formatCurrency(cost)}</td>
                                  <td className="px-3 py-3 text-right">{formatCurrency(bookValueStartYear)}</td>
                                  <td className="px-3 py-3 text-right text-red-500">{formatCurrency(depThisYear)}</td>
                                  <td className="px-3 py-3 text-right font-bold">{formatCurrency(bookValueEndYear)}</td>
                                  <td className="px-3 py-3 text-right text-red-600">{formatCurrency(accDepTotal)}</td>
                                  <td className="px-3 py-3 text-center">
                                    <button onClick={() => handleDeleteAsset(a.id)} className="text-red-500 hover:bg-red-50 p-1 rounded-lg transition-colors">
                                      <Trash2 size={12} />
                                    </button>
                                  </td>
                                </tr>
                              );
                            });
                          })()}
                        </tbody>
                      </table>
                    </div>
                    {/* Pagination Controls */}
                    <div className="p-3 border-t border-cafe-cream flex justify-between items-center">
                      <button 
                        disabled={asetPage === 1}
                        onClick={() => setAsetPage(p => p - 1)}
                        className="p-1 disabled:opacity-30"
                      >
                        <ChevronLeft size={16} />
                      </button>
                      <span className="text-[10px] font-black text-cafe-olive/50">Halaman {asetPage}</span>
                      <button 
                        disabled={asetPage * 10 >= assets.filter(a => 
                          a.name.toLowerCase().includes(asetSearch.toLowerCase()) &&
                          new Date(a.purchase_date).getFullYear() <= asetFilterYear
                        ).length}
                        onClick={() => setAsetPage(p => p + 1)}
                        className="p-1 disabled:opacity-30"
                      >
                        <ChevronRight size={16} />
                      </button>
                    </div>
                  </div>

                  {/* Contoh Penjurnalan Penyusutan */}
                  <div className="bg-white p-6 rounded-2xl border border-cafe-olive/5 shadow-sm space-y-4">
                    <h4 className="text-[10px] font-black uppercase text-cafe-olive border-b pb-1">Contoh Penjurnalan Penyusutan</h4>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-[9px] border-collapse">
                        <thead className="bg-cafe-cream/50 text-cafe-olive/50 font-black uppercase">
                          <tr>
                            <th className="px-3 py-2 border border-cafe-cream">Tanggal</th>
                            <th className="px-3 py-2 border border-cafe-cream">Debit</th>
                            <th className="px-3 py-2 border border-cafe-cream">Kredit</th>
                            <th className="px-3 py-2 border border-cafe-cream text-right">Nominal</th>
                            <th className="px-3 py-2 border border-cafe-cream">Keterangan</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(() => {
                            const now = new Date();
                            const currentYear = asetFilterYear;
                            const currentMonth = currentYear < now.getFullYear() ? 12 : (currentYear === now.getFullYear() ? (now.getMonth() + 1) : 12);
                            
                            let totalDepreciationThisYear = 0;
                            const rates: { [key: string]: number } = { '1': 0.25, '2': 0.125, '3': 0.0625, '4': 0.05, 'Bangunan Permanen': 0.05, 'Bangunan Tidak Permanen': 0.10 };
                            
                            assets.filter((a: any) => new Date(a.purchase_date).getFullYear() <= asetFilterYear).forEach((a: any) => {
                              const pDate = new Date(a.purchase_date);
                              const rate = rates[a.kelompok] || 0;
                              const cost = parseFloat(a.acquisition_cost as any);
                              const monthlyDep = (cost * rate) / 12;
                              
                              // Months before this year
                              const monthsBeforeThisYear = Math.max(0, (currentYear - pDate.getFullYear()) * 12 - pDate.getMonth());
                              const accDepStartYear = Math.min(cost, monthlyDep * monthsBeforeThisYear);
                              const bookValueStartYear = cost - accDepStartYear;
                              
                              // Months this year
                              const monthsThisYear = pDate.getFullYear() < currentYear ? currentMonth : Math.max(0, currentMonth - pDate.getMonth());
                              const depThisYear = Math.min(bookValueStartYear, monthlyDep * monthsThisYear);
                              
                              totalDepreciationThisYear += depThisYear;
                            });

                            return (
                              <tr className="hover:bg-cafe-cream/10">
                                <td className="px-3 py-2 border border-cafe-cream whitespace-nowrap">31 Des {currentYear}</td>
                                <td className="px-3 py-2 border border-cafe-cream font-bold">Biaya Penyusutan</td>
                                <td className="px-3 py-2 border border-cafe-cream font-bold">Akumulasi Penyusutan</td>
                                <td className="px-3 py-2 border border-cafe-cream text-right font-black text-red-600">{formatCurrency(totalDepreciationThisYear)}</td>
                                <td className="px-3 py-2 border border-cafe-cream italic">Penyusutan {currentYear}</td>
                              </tr>
                            );
                          })()}
                        </tbody>
                      </table>
                    </div>
                    <p className="text-[8px] text-cafe-olive/40 italic">* Tabel di atas adalah simulasi nilai penyusutan yang harus dijurnalkan secara manual di akhir tahun.</p>
                  </div>
                </div>
              )}

              {adminSubTab === 'akun' && (
                <div className="space-y-6">
                  <div className="bg-white p-6 rounded-2xl border border-cafe-olive/5 shadow-sm space-y-4">
                    <select value={newAcc.category} onChange={e => setNewAcc({...newAcc, category: e.target.value})} className="w-full border rounded-xl px-4 py-3 text-sm bg-cafe-cream/20">
                      <option value="Aset">Aset</option>
                      <option value="Kewajiban">Kewajiban</option>
                      <option value="Ekuitas">Ekuitas</option>
                      <option value="Pendapatan">Pendapatan</option>
                      <option value="Beban">Beban</option>
                    </select>
                    <select value={newAcc.sub_category} onChange={e => setNewAcc({...newAcc, sub_category: e.target.value})} className="w-full border rounded-xl px-4 py-3 text-sm bg-cafe-cream/20">
                      <option value="Aset Lancar">Aset Lancar</option>
                      <option value="Aset Tetap">Aset Tetap</option>
                      <option value="Kewajiban Lancar">Kewajiban Lancar</option>
                      <option value="Kewajiban Jangka Panjang">Kewajiban Jangka Panjang</option>
                      <option value="Modal">Modal</option>
                      <option value="Pendapatan Usaha">Pendapatan Usaha</option>
                      <option value="Beban Operasional">Beban Operasional</option>
                      <option value="Harga Pokok Penjualan">Harga Pokok Penjualan</option>
                    </select>
                    <input value={newAcc.name} onChange={e => setNewAcc({...newAcc, name: e.target.value})} placeholder="Nama Akun" className="w-full border rounded-xl px-4 py-3 text-sm bg-cafe-cream/20" />
                    <button onClick={handleAddAccount} className="w-full bg-cafe-olive text-white py-4 rounded-xl font-black text-sm">TAMBAH AKUN</button>
                  </div>
                  <div className="bg-white rounded-2xl border border-cafe-olive/5 shadow-sm overflow-hidden">
                    <table className="w-full text-left text-[10px]">
                      <thead className="bg-cafe-cream/50 text-cafe-olive/50 font-black uppercase">
                        <tr>
                          <th className="px-4 py-3">Kategori</th>
                          <th className="px-4 py-3">Sub Kategori</th>
                          <th className="px-4 py-3">Nama Akun</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-cafe-cream">
                        {accounts.map(a => (
                          <tr key={a.id}>
                            <td className="px-4 py-3 text-cafe-olive/60">{a.category}</td>
                            <td className="px-4 py-3 text-cafe-olive/40 italic">{a.sub_category}</td>
                            <td className="px-4 py-3 font-bold">{a.account_name}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Item Popup Modal */}
      <AnimatePresence>
        {showItemPopup && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              onClick={() => setShowItemPopup(null)}
              className="absolute inset-0 bg-cafe-ink/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, y: 20, opacity: 0 }} 
              animate={{ scale: 1, y: 0, opacity: 1 }} 
              exit={{ scale: 0.9, y: 20, opacity: 0 }}
              className="relative w-full max-w-sm bg-white rounded-[2.5rem] p-8 shadow-2xl"
            >
              <h3 className="text-2xl font-serif font-bold text-cafe-ink mb-1">{showItemPopup.name}</h3>
              <p className="text-sm font-bold text-cafe-accent mb-6">{formatCurrency(showItemPopup.price_per_portion)}</p>
              
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-cafe-olive/50">Jumlah</label>
                  <div className="flex items-center justify-between bg-cafe-cream rounded-2xl p-2">
                    <button onClick={() => setPopupQty(Math.max(1, popupQty - 1))} className="w-12 h-12 rounded-xl bg-white flex items-center justify-center font-bold text-xl shadow-sm">-</button>
                    <span className="text-2xl font-black">{popupQty}</span>
                    <button onClick={() => setPopupQty(popupQty + 1)} className="w-12 h-12 rounded-xl bg-white flex items-center justify-center font-bold text-xl shadow-sm">+</button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-cafe-olive/50">Keterangan (Opsional)</label>
                  <textarea 
                    value={popupNote} 
                    onChange={e => setPopupNote(e.target.value)} 
                    placeholder="Contoh: Tanpa gula, pedas sedang..." 
                    className="w-full border-2 border-cafe-cream rounded-2xl px-4 py-3 outline-none focus:ring-2 focus:ring-cafe-olive bg-cafe-cream/20 text-sm h-24 resize-none"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button onClick={() => setShowItemPopup(null)} className="flex-1 py-4 rounded-2xl font-bold text-cafe-olive/60 hover:bg-cafe-cream transition-all">Batal</button>
                  <button onClick={handleAddToCart} className="flex-[2] bg-cafe-olive text-white py-4 rounded-2xl font-black shadow-lg shadow-cafe-olive/20">TAMBAHKAN</button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Order Management Popup (Queue) */}
      <AnimatePresence>
        {selectedOrder && (
          <div className="fixed inset-0 z-[105] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              onClick={() => setSelectedOrder(null)}
              className="absolute inset-0 bg-cafe-ink/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, y: 20, opacity: 0 }} 
              animate={{ scale: 1, y: 0, opacity: 1 }} 
              exit={{ scale: 0.9, y: 20, opacity: 0 }}
              className="relative w-full max-w-sm bg-white rounded-[2.5rem] p-8 shadow-2xl"
            >
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-cafe-cream rounded-full flex items-center justify-center mx-auto mb-4 text-cafe-olive">
                  <Clock size={32} />
                </div>
                <h3 className="text-2xl font-serif font-bold text-cafe-ink">Antrian #{selectedOrder.queue_number}</h3>
                <p className="text-sm text-cafe-olive/60 mt-1">{selectedOrder.customer_name || 'Pelanggan'}</p>
              </div>

              <AnimatePresence>
                {showDetails && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="mb-6 overflow-hidden"
                  >
                    <div className="bg-cafe-cream/30 rounded-2xl p-4 space-y-2 text-xs">
                      {JSON.parse(selectedOrder.items_json || '[]').map((item: any, i: number) => (
                        <div key={i} className="border-b border-cafe-cream/50 last:border-0 pb-2 last:pb-0">
                          <div className="flex justify-between font-bold">
                            <span>{item.name} x{item.quantity}</span>
                          </div>
                          {item.note && (
                            <p className="text-[10px] text-cafe-olive/60 italic mt-0.5">
                              Note: {item.note}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="space-y-3">
                <button 
                  onClick={() => {
                    setLastOrder(selectedOrder);
                    setShowPrintPopup(true);
                    setSelectedOrder(null);
                  }}
                  className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl font-black text-sm bg-cafe-cream text-cafe-olive hover:bg-cafe-olive hover:text-white transition-all"
                >
                  <Printer size={18} /> CETAK STRUK
                </button>

                <button 
                  onClick={() => setShowDetails(!showDetails)}
                  className={cn(
                    "w-full flex items-center justify-center gap-3 py-4 rounded-2xl font-black text-sm transition-all",
                    showDetails ? "bg-cafe-olive text-white" : "bg-cafe-cream text-cafe-olive hover:bg-cafe-olive hover:text-white"
                  )}
                >
                  <FileText size={18} /> {showDetails ? 'TUTUP RINCIAN' : 'RINCIAN'}
                </button>
                
                <button 
                  onClick={() => {
                    updateOrderStatus(selectedOrder.id, 'completed');
                    setSelectedOrder(null);
                  }}
                  className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl font-black text-sm bg-cafe-olive text-white shadow-lg shadow-cafe-olive/20"
                >
                  <CheckCircle2 size={18} /> SELESAI
                </button>

                <button 
                  onClick={() => setSelectedOrder(null)} 
                  className="w-full py-4 rounded-2xl font-bold text-cafe-olive/40 text-sm"
                >
                  Batal
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Print Receipt Popup */}
      <AnimatePresence>
        {showPrintPopup && lastOrder && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              className="absolute inset-0 bg-cafe-ink/80 backdrop-blur-md"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }} 
              animate={{ scale: 1, opacity: 1 }} 
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-sm bg-white rounded-[2.5rem] overflow-hidden shadow-2xl"
            >
              <div className="p-8">
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-cafe-cream rounded-full flex items-center justify-center mx-auto mb-4 text-cafe-olive">
                    <Printer size={32} />
                  </div>
                  <h3 className="text-xl font-serif font-bold text-cafe-ink">Cetak Struk?</h3>
                  <p className="text-xs text-cafe-olive/60 mt-1">Pesanan #{lastOrder.queue_number} berhasil diproses</p>
                </div>

                {/* Receipt Preview */}
                <div className="bg-cafe-cream/30 border-2 border-dashed border-cafe-cream rounded-2xl p-6 font-mono text-[10px] text-cafe-ink space-y-2 mb-6">
                  <div className="text-center font-bold text-xs mb-1">CAFE BAJIBUN</div>
                  <div className="text-center text-[8px] opacity-60 mb-2">Jalan Andi Tonro Gowa</div>
                  <div className="border-t border-dashed border-cafe-ink/20 pt-2">
                    <div className="flex justify-between"><span>Antrian:</span><span>#{lastOrder.queue_number}</span></div>
                    <div className="flex justify-between"><span>Nama:</span><span>{lastOrder.customer_name || '-'}</span></div>
                    <div className="flex justify-between"><span>Meja:</span><span>{lastOrder.table_number || '-'}</span></div>
                    <div className="flex justify-between"><span>Waktu:</span><span>{new Date(lastOrder.created_at).toLocaleString('id-ID')}</span></div>
                  </div>
                  <div className="border-t border-dashed border-cafe-ink/20 pt-2 space-y-1">
                    {JSON.parse(lastOrder.items_json).map((item: any, i: number) => (
                      <div key={i} className="flex justify-between">
                        <span>{item.name} x{item.quantity}</span>
                        <span>{formatCurrency(item.price * item.quantity)}</span>
                      </div>
                    ))}
                  </div>
                  <div className="border-t border-dashed border-cafe-ink/20 pt-2 flex justify-between font-bold text-xs">
                    <span>TOTAL</span>
                    <span>{formatCurrency(lastOrder.total_amount)}</span>
                  </div>
                  <div className="border-t border-dashed border-cafe-ink/20 pt-4 text-center italic opacity-60">
                    Terima kasih atas kunjungan anda
                  </div>
                </div>

                <div className="flex gap-3">
                  <button 
                    onClick={() => setShowPrintPopup(false)} 
                    className="flex-1 py-4 rounded-2xl font-bold text-cafe-olive/60 hover:bg-cafe-cream transition-all"
                  >
                    Tutup
                  </button>
                  <button 
                    onClick={() => {
                      window.print();
                      setShowPrintPopup(false);
                    }} 
                    className="flex-[2] bg-cafe-olive text-white py-4 rounded-2xl font-black shadow-lg flex items-center justify-center gap-2"
                  >
                    <Printer size={18} /> CETAK STRUK
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {asetToDelete && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-cafe-ink/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white rounded-[32px] w-full max-w-sm overflow-hidden shadow-2xl border border-cafe-olive/10"
            >
              <div className="p-8 text-center space-y-6">
                <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto ring-8 ring-red-50/50">
                  <AlertCircle size={40} className="text-red-500" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-black text-cafe-ink uppercase tracking-tight">Peringatan..!</h3>
                  <p className="text-sm text-cafe-olive/70 leading-relaxed px-4">
                    Apakah anda ingin menghapus aset ini? <br/>
                    <span className="font-bold text-red-500">Pastikan juga untuk menghapus jurnalnya.</span>
                  </p>
                </div>
                <div className="flex gap-3 pt-2">
                  <button 
                    onClick={() => setAsetToDelete(null)} 
                    className="flex-1 py-4 rounded-2xl font-bold text-cafe-olive/60 hover:bg-cafe-cream transition-all"
                  >
                    Batal
                  </button>
                  <button 
                    onClick={confirmDeleteAsset} 
                    className="flex-[2] bg-red-500 text-white py-4 rounded-2xl font-black shadow-lg shadow-red-500/20 hover:bg-red-600 transition-all"
                  >
                    HAPUS ASET
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-cafe-cream flex justify-around p-2 shadow-[0_-10px_20px_rgba(0,0,0,0.05)]">
        {[
          { id: 'kasir', icon: ShoppingCart, label: 'Kasir' },
          { id: 'antrian', icon: Clock, label: 'Antrian' },
          { id: 'kinerja', icon: TrendingUp, label: 'Omset' },
          { id: 'laporan', icon: FileText, label: 'Laporan' },
          { id: 'admin', icon: Settings, label: 'Admin' }
        ].map(t => (
          <button 
            key={t.id} 
            onClick={() => setActiveTab(t.id as any)} 
            className={cn(
              "flex flex-col items-center gap-1 p-2 rounded-xl transition-all",
              activeTab === t.id ? "text-cafe-accent" : "text-cafe-olive/40"
            )}
          >
            <t.icon size={20} className={cn(activeTab === t.id && "scale-110")} />
            <span className="text-[9px] font-black uppercase tracking-tighter">{t.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
