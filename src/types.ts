export interface Item {
  id: number;
  name: string;
  category: string;
  price_per_portion: number;
}

export interface JournalEntry {
  id: number;
  transaction_id: string;
  account_name: string;
  description: string;
  debit: number;
  credit: number;
  date: string;
}

export interface Account {
  id: number;
  category: string;
  sub_category: string;
  account_name: string;
}

export interface CartItem {
  item_id: number;
  name: string;
  quantity: number;
  price: number;
  note: string;
}

export interface ProfitLossReport {
  penjualan: number;
  persediaanAwal: number;
  pembelian: number;
  persediaanAkhir: number;
  hpp: number;
  labaKotor: number;
  bebanOperasional: { name: string; amount: number }[];
  totalBeban: number;
  labaBersih: number;
}

export interface BalanceSheetReport {
  asetGrouped: { [key: string]: { name: string; amount: number }[] };
  kewajibanGrouped: { [key: string]: { name: string; amount: number }[] };
  ekuitas: { name: string; amount: number }[];
  totalAset: number;
  totalPasiva: number;
  isBalanced: boolean;
}

export interface Asset {
  id: number;
  name: string;
  kelompok: string;
  purchase_date: string;
  acquisition_cost: number;
}
