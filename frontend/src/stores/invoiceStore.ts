import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

export interface Invoice {
  id: number;
  filename: string;
  status: string;
  upload_date: string;
  created_at: string;
  updated_at?: string;
  extracted_data?: any;
  blob_url?: string;
  user_id?: number;
  owner?: string;
}

interface InvoiceState {
  invoices: Invoice[];
  loading: boolean;
  error: string | null;
  
  // Acciones
  setInvoices: (invoices: Invoice[]) => void;
  updateInvoice: (id: number, updates: Partial<Invoice>) => void;
  addInvoice: (invoice: Invoice) => void;
  removeInvoice: (id: number) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  
  // Selectores computados
  getInvoiceById: (id: number) => Invoice | undefined;
  getInvoicesByStatus: (status: string) => Invoice[];
  getPendingInvoices: () => Invoice[];
  getCompletedInvoices: () => Invoice[];
}

export const useInvoiceStore = create<InvoiceState>()(
  devtools(
    (set, get) => ({
      invoices: [],
      loading: false,
      error: null,

      setInvoices: (invoices) => set({ invoices, error: null }),
      
      updateInvoice: (id, updates) =>
        set((state) => ({
          invoices: state.invoices.map((invoice) =>
            invoice.id === id
              ? { ...invoice, ...updates, updated_at: new Date().toISOString() }
              : invoice
          ),
        })),

      addInvoice: (invoice) =>
        set((state) => ({
          invoices: [invoice, ...state.invoices],
        })),

      removeInvoice: (id) =>
        set((state) => ({
          invoices: state.invoices.filter((invoice) => invoice.id !== id),
        })),

      setLoading: (loading) => set({ loading }),
      setError: (error) => set({ error }),

      // Selectores computados
      getInvoiceById: (id) => {
        const state = get();
        return state.invoices.find((invoice) => invoice.id === id);
      },

      getInvoicesByStatus: (status) => {
        const state = get();
        return state.invoices.filter((invoice) => invoice.status === status);
      },

      getPendingInvoices: () => {
        const state = get();
        return state.invoices.filter((invoice) => 
          invoice.status === 'pending' || invoice.status === 'processing'
        );
      },

      getCompletedInvoices: () => {
        const state = get();
        return state.invoices.filter((invoice) => invoice.status === 'completed');
      },
    }),
    {
      name: 'invoice-store',
    }
  )
);
