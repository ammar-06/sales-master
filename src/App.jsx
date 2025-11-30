import React, { useState, useEffect, useMemo, useRef } from 'react';
import { initializeApp } from 'firebase/app';
import {
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut
} from 'firebase/auth';
import {
  getFirestore,
  collection,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
  serverTimestamp,
  runTransaction,
  writeBatch,
  addDoc
} from 'firebase/firestore';
import {
  LayoutDashboard,
  Shirt,
  ShoppingCart,
  Users,
  Handshake,
  Plus,
  Trash2,
  CreditCard,
  CheckCircle,
  Banknote,
  Layers,
  CalendarCheck,
  TrendingUp,
  Search,
  Edit,
  Loader2,
  XCircle,
  Moon,
  Sun,
  AlertTriangle,
  X,
  Menu,
  LogOut,
  Lock,
  Mail,
  Eye,
  EyeOff,
  Package,
  MinusCircle,
  Wallet,
  History,
  Receipt,
  ShoppingBag,
  Undo2,
  ShieldCheck,
  RefreshCcw
} from 'lucide-react';

// --- 🔴 FIREBASE CONFIG (Aapki Keys) ---
const firebaseConfig = {
  apiKey: "AIzaSyDYh-3At6q9nmvD3LLvFABalwF9NosTAsc",
  authDomain: "ammar-hub.firebaseapp.com",
  projectId: "ammar-hub",
  storageBucket: "ammar-hub.firebasestorage.app",
  messagingSenderId: "414558735096",
  appId: "1:414558735096:web:4fae978a5253017613090d"
};

// --- App Initialization ---
const app = Object.keys(firebaseConfig).length > 0 ? initializeApp(firebaseConfig) : null;
const auth = app ? getAuth(app) : null;
const db = app ? getFirestore(app) : null;
const appId = "ammar-shop-1";

const ADMIN_ACCESS_CODE = "78601";

// --- SOUND EFFECTS ---
const playSound = (type) => {
  const soundUrls = {
    pop: 'https://assets.mixkit.co/sfx/preview/mixkit-modern-technology-select-3124.mp3',
    success: 'https://assets.mixkit.co/sfx/preview/mixkit-software-interface-start-2574.mp3',
    error: 'https://assets.mixkit.co/sfx/preview/mixkit-simple-game-countdown-921.mp3',
    delete: 'https://assets.mixkit.co/sfx/preview/mixkit-interface-option-select-2573.mp3'
  };
  try {
    const audio = new Audio(soundUrls[type]);
    audio.volume = 0.5;
    audio.play().catch(() => {});
  } catch (e) {}
};

// --- Helper Functions ---
const formatCurrency = (amount) => {
  const safeAmount = Number(amount) || 0;
  return new Intl.NumberFormat('en-PK', {
    style: 'currency',
    currency: 'PKR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(safeAmount).replace('PKR', 'Rs');
};

const getFriendlyErrorMessage = (errorCode) => {
  switch (errorCode) {
    case 'auth/invalid-email': return "Invalid email format.";
    case 'auth/user-not-found': return "Account not found.";
    case 'auth/wrong-password': return "Incorrect password.";
    case 'auth/email-already-in-use': return "Email already used.";
    case 'auth/weak-password': return "Password too short.";
    default: return "Connection error. Please retry.";
  }
};

const chunkArray = (array, size) => {
  const chunked = [];
  for (let i = 0; i < array.length; i += size) {
    chunked.push(array.slice(i, i + size));
  }
  return chunked;
};

const handleNumberInput = (e) => {
  if (['e', 'E', '+', '-'].includes(e.key)) {
    e.preventDefault();
  }
};

// --- UI Components ---
const ToastContainer = ({ toasts, removeToast }) => (
  <div className="fixed bottom-4 right-4 z-[150] flex flex-col gap-2 w-full max-w-xs px-4 md:px-0 pointer-events-none">
    {toasts.map(toast => (
      <div key={toast.id} className={`pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl text-white transform transition-all duration-300 animate-slide-in ${toast.type === 'error' ? 'bg-red-600' : 'bg-emerald-600'}`}>
        {toast.type === 'error' ? <XCircle size={20} className="shrink-0" /> : <CheckCircle size={20} className="shrink-0" />}
        <p className="text-sm font-medium flex-1">{toast.message}</p>
        <button onClick={() => removeToast(toast.id)} className="ml-2 opacity-80 hover:opacity-100"><X size={16}/></button>
      </div>
    ))}
  </div>
);

const ConfirmationModal = ({ isOpen, onClose, onConfirm, title, message, isDanger, darkMode }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
      <div className={`p-6 rounded-2xl shadow-2xl w-[95%] max-w-sm transform transition-all scale-100 ${darkMode ? 'bg-slate-900 border border-slate-700' : 'bg-white'}`}>
        <div className="flex flex-col items-center text-center">
          <div className={`p-4 rounded-full mb-4 ${isDanger ? (darkMode ? 'bg-red-900/30 text-red-500' : 'bg-red-100 text-red-600') : (darkMode ? 'bg-blue-900/30 text-blue-500' : 'bg-blue-100 text-blue-600')}`}>
            {isDanger ? <Trash2 size={32} /> : <Undo2 size={32} />}
          </div>
          <h3 className={`text-xl font-bold mb-2 ${darkMode ? 'text-white' : 'text-slate-800'}`}>{title}</h3>
          <p className={`text-sm mb-6 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>{message}</p>
          <div className="flex flex-col sm:flex-row gap-3 w-full">
            <button onClick={onClose} className={`flex-1 py-3 rounded-xl font-bold transition-colors ${darkMode ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>Cancel</button>
            <button onClick={onConfirm} className={`flex-1 py-3 rounded-xl font-bold text-white shadow-lg transition-all active:scale-95 ${isDanger ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'}`}>{isDanger ? 'Confirm' : 'Proceed'}</button>
          </div>
        </div>
      </div>
    </div>
  );
};

const Card = ({ title, value, subtext, icon: Icon, colorClass, darkMode }) => (
  <div className={`p-5 rounded-2xl shadow-sm border flex items-start justify-between transition-all duration-300 hover:shadow-md hover:-translate-y-1 ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100'}`}>
    <div className="flex-1 min-w-0">
      <p className={`text-[10px] font-bold uppercase tracking-wider mb-1 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>{title}</p>
      <h3 className={`text-lg md:text-2xl font-black truncate ${darkMode ? 'text-white' : 'text-slate-800'}`}>{value}</h3>
      {subtext && <p className={`text-[10px] md:text-xs mt-1 truncate ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>{subtext}</p>}
    </div>
    <div className={`p-3 rounded-xl shadow-sm ${colorClass} shrink-0 ml-2`}><Icon size={22} /></div>
  </div>
);

const LoadingSpinner = () => <div className="flex items-center justify-center p-4 h-full"><Loader2 className="animate-spin text-blue-600" size={32} /></div>;

// --- Main App ---
export default function App() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Login
  const [isLoginView, setIsLoginView] = useState(true);
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authCode, setAuthCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Theme & Data
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('theme') === 'dark');
  const [toasts, setToasts] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [sales, setSales] = useState([]);
  const [payments, setPayments] = useState([]);
  
  // UI States
  const [inventorySearch, setInventorySearch] = useState('');
  const [showAvailableOnly, setShowAvailableOnly] = useState(false);
  const [customerSearch, setCustomerSearch] = useState('');
  const [selectedMamaSales, setSelectedMamaSales] = useState([]);
  const [editingItem, setEditingItem] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [modalConfig, setModalConfig] = useState({ isOpen: false, type: null, id: null, title: '', message: '', isDanger: false });
  const [mamaTab, setMamaTab] = useState('pending');
  
  const [viewingCustomer, setViewingCustomer] = useState(null);
  const [customerModalTab, setCustomerModalTab] = useState('payments');

  // POS Cart State
  const [cart, setCart] = useState([]);
  const [itemSearchQuery, setItemSearchQuery] = useState('');

  // Payment Selection State
  const [paymentCustomerSearch, setPaymentCustomerSearch] = useState('');
  const [showCustomerSuggestions, setShowCustomerSuggestions] = useState(false);

  // Sale Selection State
  const [showSaleCustomerSuggestions, setShowSaleCustomerSuggestions] = useState(false);

  // Forms
  const [dressForm, setDressForm] = useState({ suitIds: '', brand: '', orgPrice: '', salePrice: '' });
  const [saleForm, setSaleForm] = useState({ customerName: '', paidAmount: '' });
  const [paymentForm, setPaymentForm] = useState({ customerId: '', amount: '' });

  // Refs
  const inventorySearchInput = useRef(null);
  const idsInputRef = useRef(null); 

  // Effects
  useEffect(() => { document.title = "Sales Master"; }, []);
  
  useEffect(() => {
    if (darkMode) { document.documentElement.classList.add('dark'); localStorage.setItem('theme', 'dark'); }
    else { document.documentElement.classList.remove('dark'); localStorage.setItem('theme', 'light'); }
  }, [darkMode]);

  useEffect(() => {
    if (!auth) return;
    const unsubscribe = onAuthStateChanged(auth, (u) => { setUser(u); setAuthLoading(false); });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user || !db) return;
    const userPath = `artifacts/${appId}/users/${user.uid}`;
    
    const unsubInv = onSnapshot(collection(db, `${userPath}/inventory`), 
      (s) => setInventory(s.docs.map(d => ({ id: d.id, ...d.data() }))),
      (err) => console.error("Inv Error", err)
    );
    const unsubCust = onSnapshot(collection(db, `${userPath}/customers`), 
      (s) => setCustomers(s.docs.map(d => ({ id: d.id, ...d.data() }))),
      (err) => console.error("Cust Error", err)
    );
    const unsubSales = onSnapshot(collection(db, `${userPath}/sales`), 
      (s) => setSales(s.docs.map(d => ({ id: d.id, ...d.data() })).sort((a,b) => (b.date?.seconds || 0) - (a.date?.seconds || 0))),
      (err) => console.error("Sales Error", err)
    );
    const unsubPayments = onSnapshot(collection(db, `${userPath}/payments`), 
      (s) => setPayments(s.docs.map(d => ({ id: d.id, ...d.data() })).sort((a,b) => (b.date?.seconds || 0) - (a.date?.seconds || 0))),
      (err) => console.error("Payments Error", err)
    );
    return () => { unsubInv(); unsubCust(); unsubSales(); unsubPayments(); };
  }, [user]);

  useEffect(() => {
    if (idsInputRef.current) {
      idsInputRef.current.style.height = 'auto';
      idsInputRef.current.style.height = idsInputRef.current.scrollHeight + 'px';
    }
  }, [dressForm.suitIds]);

  const showToast = (message, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    playSound(type === 'error' ? 'error' : 'success');
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000);
  };
  const removeToast = (id) => setToasts(prev => prev.filter(t => t.id !== id));

  const openLogoutModal = () => {
    playSound('pop');
    setModalConfig({ isOpen: true, type: 'LOGOUT', title: 'Confirm Logout', message: 'Are you sure you want to end your session?', isDanger: true });
  };

  const openDeleteModal = (id, type) => {
    playSound('pop');
    setModalConfig({ isOpen: true, type: type === 'inventory' ? 'DELETE_INVENTORY' : 'DELETE_CUSTOMER', id, title: 'Confirm Deletion', message: 'This action cannot be undone.', isDanger: true });
  };

  const openReturnModal = (saleItem) => {
    playSound('pop');
    setModalConfig({ 
        isOpen: true, 
        type: 'RETURN_ITEM', 
        id: saleItem.id, 
        title: 'Return Item?', 
        message: `Return ${saleItem.suitId}? Inventory and Customer Bill will be restored.`, 
        isDanger: true,
        extraData: saleItem 
    });
  };

  const handleConfirmAction = async () => {
    const { type, id, extraData } = modalConfig;
    try {
      if (type === 'LOGOUT') {
        await signOut(auth);
        setInventory([]); setSales([]); setCustomers([]); setPayments([]);
        showToast("Logged out successfully");
      } else if (type === 'RETURN_ITEM') {
        await runTransaction(db, async (t) => {
            const userRef = `artifacts/${appId}/users/${user.uid}`;
            const saleRef = doc(db, `${userRef}/sales`, id);
            const invRef = doc(db, `${userRef}/inventory`, extraData.dressDocId);
            const custRef = doc(db, `${userRef}/customers`, extraData.customerId);
            
            const custSnap = await t.get(custRef);
            if (!custSnap.exists()) throw new Error("Customer not found!");
            
            const currentBill = custSnap.data().totalBill || 0;
            const newBill = Math.max(0, currentBill - extraData.salePrice);

            t.update(invRef, { qty: 1 });
            t.update(custRef, { totalBill: newBill, lastUpdated: serverTimestamp() });
            t.delete(saleRef);
        });
        showToast("Item Returned & Stock Restored");
        playSound('delete');

      } else {
        const path = type === 'DELETE_INVENTORY' ? 'inventory' : 'customers';
        await deleteDoc(doc(db, `artifacts/${appId}/users/${user.uid}/${path}`, id));
        showToast("Item Removed");
        playSound('delete');
      }
    } catch (error) { 
        console.error(error);
        showToast("Action Failed", 'error'); 
    }
    finally { setModalConfig({ ...modalConfig, isOpen: false }); }
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    const email = authEmail.trim(); const password = authPassword;
    if (!email || !password) { showToast("Email and Password are required", 'error'); return; }
    
    if (!isLoginView && authCode !== ADMIN_ACCESS_CODE) {
        showToast("Invalid Admin Access Code!", 'error');
        playSound('error');
        return;
    }

    setIsSubmitting(true);
    try {
      if (isLoginView) { await signInWithEmailAndPassword(auth, email, password); showToast("Welcome back!"); }
      else { await createUserWithEmailAndPassword(auth, email, password); showToast("Account Created!"); }
      playSound('success');
    } catch (err) { showToast(getFriendlyErrorMessage(err.code), 'error'); }
    finally { setIsSubmitting(false); }
  };

  // --- Data Logic ---
  const handleAddDress = async (e) => {
    e.preventDefault();
    if (!user || isSubmitting) return;
    
    if (!dressForm.suitIds.trim()) { showToast("Product IDs are missing!", 'error'); playSound('error'); return; }
    if (!dressForm.brand.trim()) { showToast("Brand name is required!", 'error'); playSound('error'); return; }
    if (!dressForm.orgPrice || Number(dressForm.orgPrice) <= 0) { showToast("Cost Price must be > 0", 'error'); playSound('error'); return; }
    if (!dressForm.salePrice || Number(dressForm.salePrice) <= 0) { showToast("Sale Price must be > 0", 'error'); playSound('error'); return; }

    if (Number(dressForm.salePrice) < Number(dressForm.orgPrice)) {
        showToast("Sale Price cannot be less than Cost!", 'error');
        playSound('error');
        return;
    }

    setIsSubmitting(true);
    const newSuitIds = dressForm.suitIds.split(/[\s,]+/).map(s => s.trim().toUpperCase()).filter(s => s !== "");
    
    const uniqueInputIds = new Set(newSuitIds);
    if (newSuitIds.length === 0) { showToast("Invalid ID format", 'error'); setIsSubmitting(false); return; }
    if (uniqueInputIds.size !== newSuitIds.length) { showToast("Duplicate IDs in input!", 'error'); setIsSubmitting(false); playSound('error'); return; }

    const duplicates = newSuitIds.filter(id => inventory.some(i => i.suitId === id));
    if (duplicates.length > 0) { showToast(`Exists: ${duplicates.join(', ')}`, 'error'); setIsSubmitting(false); playSound('error'); return; }

    try {
      const batches = chunkArray(newSuitIds, 450); 
      
      for (const chunk of batches) {
          const batch = writeBatch(db);
          chunk.forEach(id => {
              const docRef = doc(collection(db, `artifacts/${appId}/users/${user.uid}/inventory`));
              batch.set(docRef, {
                suitId: id, 
                brand: dressForm.brand.trim(), 
                qty: 1, 
                orgPrice: Math.round(Number(dressForm.orgPrice)), 
                salePrice: Math.round(Number(dressForm.salePrice)), 
                createdAt: serverTimestamp()
              });
          });
          await batch.commit();
      }
      
      setDressForm({ suitIds: '', brand: '', orgPrice: '', salePrice: '' }); 
      showToast(`Stock Added! (${newSuitIds.length} items)`); 
      playSound('success');
    } catch (err) { 
        console.error(err);
        showToast("Failed to add stock", 'error'); 
    } finally { 
        setIsSubmitting(false); 
    }
  };

  const handleUpdateItem = async (e) => {
      e.preventDefault();
      if(!user || !editingItem) return;
      
      if (!editingItem.brand.trim()) { showToast("Brand required", 'error'); return; }
      if (Number(editingItem.orgPrice) <= 0) { showToast("Cost must be > 0", 'error'); return; }
      if (Number(editingItem.salePrice) <= 0) { showToast("Sale must be > 0", 'error'); return; }
      if (Number(editingItem.salePrice) < Number(editingItem.orgPrice)) { showToast("Sale Price too low!", 'error'); return; }

      try {
        await updateDoc(doc(db, `artifacts/${appId}/users/${user.uid}/inventory`, editingItem.id), {
          brand: editingItem.brand, orgPrice: Math.round(Number(editingItem.orgPrice)), salePrice: Math.round(Number(editingItem.salePrice))
        });
        setEditingItem(null); showToast("Updated!"); playSound('success');
      } catch (error) { showToast("Failed", 'error'); }
  };

  const addToCart = (item) => { setCart([...cart, item]); setItemSearchQuery(''); playSound('pop'); };
  const removeFromCart = (id) => { setCart(cart.filter(c => c.id !== id)); playSound('delete'); };
  
  const availableItems = useMemo(() => {
    if (!itemSearchQuery) return [];
    const lowerQuery = itemSearchQuery.toLowerCase();
    const matches = inventory.filter(i =>
      i.qty > 0 &&
      !cart.some(c => c.id === i.id) &&
      (i.suitId.toLowerCase().includes(lowerQuery) ||
       i.brand.toLowerCase().includes(lowerQuery))
    );
    return matches.sort((a, b) => a.suitId.localeCompare(b.suitId, undefined, { numeric: true, sensitivity: 'base' })).slice(0, 5);
  }, [inventory, itemSearchQuery, cart]);

  const handleProcessSale = async (e) => {
    e.preventDefault();
    if (!user || isSubmitting) return;
    if (cart.length === 0) { showToast("Cart is empty!", 'error'); return; }
    if (!saleForm.customerName.trim()) { showToast("Customer name required", 'error'); return; }
    
    setIsSubmitting(true);
    try {
      await runTransaction(db, async (t) => {
        const userRef = `artifacts/${appId}/users/${user.uid}`;
        const itemsToSell = [];
        
        for (const cartItem of cart) {
           const itemRef = doc(db, `${userRef}/inventory/${cartItem.id}`);
           const itemSnap = await t.get(itemRef);
           if (!itemSnap.exists() || itemSnap.data().qty < 1) {
               throw new Error(`Item ${cartItem.suitId} is no longer available!`);
           }
           itemsToSell.push({ ref: itemRef, data: itemSnap.data(), id: cartItem.id });
        }
        
        let custRef, existing = customers.find(c => c.name.toLowerCase().trim() === saleForm.customerName.trim().toLowerCase());
        if (existing) custRef = doc(db, `${userRef}/customers/${existing.id}`);
        else custRef = doc(collection(db, `${userRef}/customers`));
        
        const custSnap = await t.get(custRef);
        const totalSale = itemsToSell.reduce((s, i) => s + i.data.salePrice, 0);
        const paid = Number(saleForm.paidAmount) || 0;

        let updateData = { 
            totalBill: (custSnap.exists() ? (custSnap.data().totalBill || 0) : 0) + totalSale, 
            totalPaid: (custSnap.exists() ? (custSnap.data().totalPaid || 0) : 0) + paid, 
            lastUpdated: serverTimestamp() 
        };
        
        if (paid > 0) { updateData.lastPaymentDate = serverTimestamp(); }

        if (custSnap.exists()) t.update(custRef, updateData);
        else t.set(custRef, { name: saleForm.customerName, ...updateData, joinedAt: serverTimestamp() });

        if (paid > 0) {
            const paymentRef = doc(collection(db, `${userRef}/payments`));
            t.set(paymentRef, {
                customerId: custRef.id,
                amount: paid,
                date: serverTimestamp(),
                type: 'Sale Initial'
            });
        }

        for (const item of itemsToSell) {
          t.update(item.ref, { qty: 0 });
          const profit = item.data.salePrice - item.data.orgPrice;
          t.set(doc(collection(db, `${userRef}/sales`)), {
            customerId: custRef.id, 
            customerName: saleForm.customerName, 
            suitId: item.data.suitId, 
            dressDocId: item.id, 
            brand: item.data.brand,
            orgPrice: item.data.orgPrice, 
            salePrice: item.data.salePrice, 
            profit, 
            mamaShare: Math.max(0, Math.round(profit*0.2)), 
            mamaPaid: false, 
            date: serverTimestamp()
          });
        }
      });
      setCart([]); setSaleForm({ customerName: '', paidAmount: '' }); showToast(`Sold ${cart.length} items successfully!`); playSound('success');
    } catch (err) { showToast(err.message, 'error'); playSound('error'); } finally { setIsSubmitting(false); }
  };

  // New helper for Payment Customer Selection
  const paymentCustomerMatches = useMemo(() => {
    if (!paymentCustomerSearch) return [];
    const lower = paymentCustomerSearch.toLowerCase();
    return customers.filter(c => c.name.toLowerCase().includes(lower)).slice(0, 5);
  }, [customers, paymentCustomerSearch]);

  const selectPaymentCustomer = (c) => {
    setPaymentForm({ ...paymentForm, customerId: c.id });
    setPaymentCustomerSearch(c.name);
    setShowCustomerSuggestions(false);
  };

  // New helper for Sale Customer Selection
  const saleCustomerMatches = useMemo(() => {
    if (!saleForm.customerName) return [];
    const lower = saleForm.customerName.toLowerCase();
    return customers.filter(c => c.name.toLowerCase().includes(lower)).slice(0, 5);
  }, [customers, saleForm.customerName]);

  const handleAddPayment = async (e) => {
      e.preventDefault();
      if (!user) return;
      const cust = customers.find(c => c.id === paymentForm.customerId);
      
      if (!cust) { showToast("Select a valid customer from list", 'error'); return; }
      
      const pending = (cust?.totalBill || 0) - (cust?.totalPaid || 0);
      const amountToAdd = Number(paymentForm.amount);

      if (!amountToAdd || amountToAdd <= 0) { showToast("Amount must be positive", 'error'); return; }
      if (amountToAdd > pending) { showToast(`Max payment allowed: Rs ${pending}`, 'error'); return; }
      
      try {
        await updateDoc(doc(db, `artifacts/${appId}/users/${user.uid}/customers`, paymentForm.customerId), {
          totalPaid: (cust.totalPaid||0) + amountToAdd, lastPaymentDate: serverTimestamp()
        });
        
        await addDoc(collection(db, `artifacts/${appId}/users/${user.uid}/payments`), {
            customerId: paymentForm.customerId,
            amount: amountToAdd,
            date: serverTimestamp(),
            type: 'Payment'
        });

        setPaymentForm({ customerId: '', amount: '' }); 
        setPaymentCustomerSearch(''); // Clear search
        showToast("Payment Recorded!"); playSound('success');
      } catch (err) { showToast("Error adding payment", 'error'); }
  };

  // NEW: Handle Refund Action
  const handleRefund = async (e) => {
      e.preventDefault();
      if (!user) return;
      const cust = customers.find(c => c.id === paymentForm.customerId);
      
      if (!cust) { showToast("Select a customer first", 'error'); return; }
      
      const amountToRefund = Number(paymentForm.amount);

      if (!amountToRefund || amountToRefund <= 0) { showToast("Amount must be positive", 'error'); return; }
      
      try {
        // Reduce totalPaid
        const newPaid = Math.max(0, (cust.totalPaid || 0) - amountToRefund);

        await updateDoc(doc(db, `artifacts/${appId}/users/${user.uid}/customers`, paymentForm.customerId), {
          totalPaid: newPaid
        });
        
        await addDoc(collection(db, `artifacts/${appId}/users/${user.uid}/payments`), {
            customerId: paymentForm.customerId,
            amount: amountToRefund,
            date: serverTimestamp(),
            type: 'Refund' // Mark as Refund
        });

        setPaymentForm({ customerId: '', amount: '' }); 
        setPaymentCustomerSearch(''); 
        showToast("Refund Processed!"); playSound('delete'); // Different sound for refund
      } catch (err) { showToast("Error processing refund", 'error'); }
  };
 
  const handleMarkMamaPaid = async (status) => {
      try {
        const batch = writeBatch(db);
        selectedMamaSales.forEach(id => batch.update(doc(db, `artifacts/${appId}/users/${user.uid}/sales`, id), { mamaPaid: status, mamaPaidAt: status ? serverTimestamp() : null }));
        await batch.commit(); setSelectedMamaSales([]); showToast("Payment Status Updated!"); playSound('success');
      } catch (err) { showToast("Error updating status", 'error'); }
  };

  const toggleMamaSelection = (saleId) => {
    setSelectedMamaSales(prev => prev.includes(saleId) ? prev.filter(id => id !== saleId) : [...prev, saleId]);
  };

  const handleSelectAllMama = () => {
    const pendingMamaSales = sales.filter(s => !s.mamaPaid);
    const allSelected = pendingMamaSales.length > 0 && pendingMamaSales.every(s => selectedMamaSales.includes(s.id));
    
    if (allSelected) {
        setSelectedMamaSales([]);
    } else {
        setSelectedMamaSales(pendingMamaSales.map(s => s.id));
    }
  };

  const stats = useMemo(() => {
    const safeVal = (v) => Number(v) || 0;
    const stockVal = inventory.reduce((a, i) => i.qty > 0 ? a + safeVal(i.orgPrice) : a, 0);
    const soldCost = sales.reduce((a, s) => a + safeVal(s.orgPrice), 0);
    const realizedProfit = sales.reduce((a, s) => a + safeVal(s.profit), 0);
    const potentialProfit = inventory.reduce((a, i) => i.qty > 0 ? a + (safeVal(i.salePrice) - safeVal(i.orgPrice)) : a, 0);
    const mamaShare = sales.reduce((a, s) => a + safeVal(s.mamaShare), 0);
    const mamaPaid = sales.filter(s => s.mamaPaid).reduce((a, s) => a + safeVal(s.mamaShare), 0);
    
    const received = customers.reduce((a, c) => a + safeVal(c.totalPaid), 0);

    return {
      capital: stockVal + soldCost, stock: stockVal, profit: realizedProfit + potentialProfit,
      receivable: customers.reduce((a, c) => a + (safeVal(c.totalBill) - safeVal(c.totalPaid)), 0),
      mamaTotal: mamaShare, mamaPaid, mamaPending: mamaShare - mamaPaid, available: inventory.filter(i => i.qty > 0).length,
      received: received
    };
  }, [inventory, sales, customers]);

  const filteredInv = useMemo(() => {
    const upperSearch = inventorySearch.toUpperCase();
    const lowerSearch = inventorySearch.toLowerCase();
    const d = inventory.filter(i => (i.suitId.includes(upperSearch) || i.brand.toLowerCase().includes(lowerSearch)) && (!showAvailableOnly || i.qty > 0));
    return d.sort((a, b) => a.suitId.localeCompare(b.suitId, undefined, { numeric: true, sensitivity: 'base' }));
  }, [inventory, inventorySearch, showAvailableOnly]);

  const filteredCust = useMemo(() => customers.filter(c => c.name.toLowerCase().includes(customerSearch.toLowerCase())).sort((a, b) => ((b.totalBill||0)-(b.totalPaid||0)) - ((a.totalBill||0)-(a.totalPaid||0))), [customers, customerSearch]);
  const filteredInventoryValue = useMemo(() => filteredInv.reduce((acc, item) => acc + (Number(item.orgPrice)||0), 0), [filteredInv]);

  const customerHistory = useMemo(() => {
      if (!viewingCustomer) return [];
      return payments.filter(p => p.customerId === viewingCustomer.id);
  }, [payments, viewingCustomer]);

  const customerPurchases = useMemo(() => {
      if (!viewingCustomer) return [];
      return sales.filter(s => s.customerId === viewingCustomer.id);
  }, [sales, viewingCustomer]);

  // --- NEW SORTING LOGIC FOR PARTNER SHARE ---
  const sortedPendingMamaSales = useMemo(() => {
    // Sort ONLY for the pending list view
    return sales
      .filter(s => !s.mamaPaid)
      .sort((a, b) => a.suitId.localeCompare(b.suitId, undefined, { numeric: true, sensitivity: 'base' }));
  }, [sales]);

  // ADDED: Sorting for Paid History as well
  const sortedPaidMamaSales = useMemo(() => {
    return sales
      .filter(s => s.mamaPaid)
      .sort((a, b) => a.suitId.localeCompare(b.suitId, undefined, { numeric: true, sensitivity: 'base' }));
  }, [sales]);

  if (authLoading) return <div className={`h-screen flex items-center justify-center ${darkMode ? 'bg-slate-900' : 'bg-slate-50'}`}><LoadingSpinner /></div>;

  // LOGIN SCREEN
  if (!user) {
    return (
      <div className={`h-screen flex flex-col items-center justify-center p-4 ${darkMode ? 'bg-slate-900 text-white' : 'bg-gradient-to-br from-slate-100 to-blue-50 text-slate-800'}`}>
        <ToastContainer toasts={toasts} removeToast={removeToast} />
        <div className={`w-full max-w-md p-8 rounded-2xl shadow-2xl ${darkMode ? 'bg-slate-800 border border-slate-700' : 'bg-white/80 border border-white'}`}>
          <div className="text-center mb-8">
            {/* Updated to Shirt Icon */}
            <div className="flex justify-center mb-4 bg-blue-600/20 p-4 rounded-full w-fit mx-auto text-blue-600"><Shirt size={40}/></div>
            <h1 className="text-4xl font-black tracking-tighter mb-2 text-blue-600">Sales Master</h1>
            <p className="text-xs font-bold uppercase opacity-50 tracking-widest">Retail Management System</p>
          </div>
          <form onSubmit={handleAuth} className="space-y-4">
            <div className={`flex items-center px-4 py-3 rounded-xl border transition-all focus-within:ring-2 focus-within:ring-blue-500 ${darkMode ? 'bg-slate-900 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
               <Mail size={18} className="opacity-50 mr-3" />
               <input type="email" required className="bg-transparent outline-none flex-1 text-sm" placeholder="Email" value={authEmail} onChange={e => setAuthEmail(e.target.value)} />
            </div>
            <div className={`flex items-center px-4 py-3 rounded-xl border transition-all focus-within:ring-2 focus-within:ring-blue-500 ${darkMode ? 'bg-slate-900 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
               <Lock size={18} className="opacity-50 mr-3" />
               <input type={showPassword?"text":"password"} required className="bg-transparent outline-none flex-1 text-sm" placeholder="Password" value={authPassword} onChange={e => setAuthPassword(e.target.value)} />
               <button type="button" onClick={() => setShowPassword(!showPassword)}><Eye size={18} className="opacity-50"/></button>
            </div>
            {!isLoginView && (
                <div className={`flex items-center px-4 py-3 rounded-xl border transition-all focus-within:ring-2 focus-within:ring-blue-500 ${darkMode ? 'bg-slate-900 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                    <ShieldCheck size={18} className="opacity-50 mr-3 text-red-500" />
                    <input type="text" required className="bg-transparent outline-none flex-1 text-sm" placeholder="Admin Access Code" value={authCode} onChange={e => setAuthCode(e.target.value)} />
                </div>
            )}

            <button type="submit" disabled={isSubmitting} className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-bold shadow-lg disabled:opacity-50 transition-transform active:scale-95">
               {isSubmitting ? <Loader2 className="animate-spin mx-auto"/> : (isLoginView ? "Login" : "Sign Up")}
            </button>
          </form>
          <button onClick={() => setIsLoginView(!isLoginView)} className="w-full text-center mt-4 text-xs font-bold text-blue-500 hover:underline">{isLoginView ? "Create Account" : "Back to Login"}</button>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex h-screen font-sans overflow-hidden ${darkMode ? 'bg-slate-900 text-slate-100' : 'bg-slate-50 text-slate-800'}`}>
      <ToastContainer toasts={toasts} removeToast={removeToast} />
      <ConfirmationModal isOpen={modalConfig.isOpen} onClose={() => setModalConfig({...modalConfig, isOpen: false})} onConfirm={handleConfirmAction} title={modalConfig.title} message={modalConfig.message} isDanger={modalConfig.isDanger} darkMode={darkMode} />
      
      {/* Sidebar */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-30 md:hidden" onClick={() => setMobileMenuOpen(false)}></div>
      )}
      
      <div className={`fixed inset-y-0 left-0 w-64 transform ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} md:relative md:translate-x-0 transition-transform duration-300 z-40 flex flex-col shadow-2xl ${darkMode ? 'bg-slate-950' : 'bg-slate-900 text-white'}`}>
        <div onClick={() => { setActiveTab('dashboard'); setMobileMenuOpen(false); }} className="p-6 border-b border-slate-800 flex items-center gap-3 cursor-pointer">
           <Shirt className="text-blue-500"/>
           <div><h1 className="text-xl font-bold text-white tracking-tight">Sales Master</h1><p className="text-[10px] text-slate-400 font-mono">v1.3</p></div>
           <button onClick={(e) => { e.stopPropagation(); setMobileMenuOpen(false); }} className="md:hidden text-white ml-auto hover:bg-white/10 rounded-full p-1"><X/></button>
        </div>
        <nav className="flex-1 p-4 space-y-2">
           {[{id:'dashboard', icon:LayoutDashboard, label:'Dashboard'}, {id:'inventory', icon:Shirt, label:'Inventory'}, {id:'sales', icon:ShoppingCart, label:'Sales'}, {id:'customers', icon:Users, label:'Customers'}, {id:'mama', icon:Handshake, label:'Partner Share'}].map(i => (
             <button key={i.id} onClick={() => {setActiveTab(i.id); setMobileMenuOpen(false)}} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${activeTab === i.id ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' : 'hover:bg-white/5 text-slate-400 hover:text-white'}`}>
               <i.icon size={20} /> <span className="capitalize font-medium">{i.label}</span>
             </button>
           ))}
        </nav>
        <div className="p-4 border-t border-slate-800 space-y-2">
           <button onClick={() => setDarkMode(!darkMode)} className="w-full flex justify-center gap-2 py-2 rounded-xl bg-slate-800 text-white text-xs font-bold hover:bg-slate-700 transition-colors">{darkMode ? <Sun size={14}/> : <Moon size={14}/>} Mode</button>
           <button onClick={openLogoutModal} className="w-full flex justify-center gap-2 py-2 rounded-xl bg-red-900/20 text-red-500 text-xs font-bold hover:bg-red-900/30 transition-colors"><LogOut size={14}/> Logout</button>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
          {/* Mobile Header */}
         <div className="md:hidden flex shrink-0 justify-between items-center p-4 border-b border-slate-200/10">
            <button onClick={() => setMobileMenuOpen(true)} className="p-2 bg-blue-600 text-white rounded-lg shadow-lg active:scale-95 transition-transform"><Menu/></button>
            <h2 className="font-bold uppercase tracking-wider text-sm">{activeTab === 'mama' ? "PARTNER SHARE" : activeTab}</h2><div className="w-8"></div>
         </div>

         <div className="flex-1 overflow-y-auto p-4 md:p-8 scroll-smooth">

         {/* DASHBOARD */}
         {activeTab === 'dashboard' && (
           <div className="space-y-6 animate-fade-in">
             <div className="grid grid-cols-2 md:grid-cols-5 gap-4"> 
                <Card darkMode={darkMode} title="Capital" value={formatCurrency(stats.capital)} icon={Layers} colorClass="bg-blue-100 text-blue-600"/>
                <Card darkMode={darkMode} title="Profit" value={formatCurrency(stats.profit)} icon={TrendingUp} colorClass="bg-green-100 text-green-600"/>
                <Card darkMode={darkMode} title="Pending" value={formatCurrency(stats.receivable)} icon={CreditCard} colorClass="bg-orange-100 text-orange-600"/>
                <Card darkMode={darkMode} title="Received" value={formatCurrency(stats.received)} icon={Wallet} colorClass="bg-teal-100 text-teal-600"/>
                <Card darkMode={darkMode} title="Stock" value={formatCurrency(stats.stock)} icon={Package} colorClass="bg-purple-100 text-purple-600"/>
             </div>
             <div className={`p-6 rounded-2xl border shadow-sm ${darkMode?'bg-slate-800 border-slate-700':'bg-white border-slate-100'}`}>
                <h3 className="font-bold mb-4 text-lg">Recent Sales</h3>
                <div className="space-y-2">
                   {sales.slice(0,5).map(s => (
                     <div key={s.id} className={`flex justify-between p-4 rounded-xl transition-colors ${darkMode?'bg-slate-700/30 hover:bg-slate-700/50':'bg-slate-50 hover:bg-slate-100'}`}>
                       <div><p className="font-bold text-sm">{s.customerName}</p><p className="text-xs opacity-50 font-mono">{s.suitId}</p></div>
                       <div className="text-right"><p className="font-bold text-green-500 text-sm">+{formatCurrency(s.salePrice)}</p></div>
                     </div>
                   ))}
                </div>
             </div>
           </div>
         )}

         {/* INVENTORY */}
         {activeTab === 'inventory' && (
           <div className="flex flex-col lg:flex-row gap-6 h-full animate-fade-in">
              <div className={`p-6 rounded-2xl shadow-lg border h-fit w-full lg:w-80 shrink-0 ${darkMode?'bg-slate-800 border-slate-700':'bg-white border-slate-100'}`}>
                 <h3 className="font-bold mb-6 flex gap-2 items-center text-lg"><Plus size={20} className="text-blue-500"/> Add Stock</h3>
                 <form onSubmit={handleAddDress} className="space-y-4">
                   <div><label className="text-xs font-bold opacity-50 uppercase tracking-wider">IDs (Comma/Space Separated)</label><textarea ref={idsInputRef} required className={`w-full p-3 border rounded-xl bg-transparent outline-none text-sm focus:ring-2 focus:ring-blue-500 transition-all resize-none overflow-hidden ${darkMode?'border-slate-600':'border-slate-200'}`} rows="1" value={dressForm.suitIds} onChange={e=>setDressForm({...dressForm, suitIds:e.target.value})} placeholder="A1, A2 A3..."/></div>
                   <div><label className="text-xs font-bold opacity-50 uppercase tracking-wider">Brand</label><input required className={`w-full p-3 border rounded-xl bg-transparent outline-none text-sm focus:ring-2 focus:ring-blue-500 transition-all ${darkMode?'border-slate-600':'border-slate-200'}`} value={dressForm.brand} onChange={e=>setDressForm({...dressForm, brand:e.target.value})}/></div>
                   <div className="grid grid-cols-2 gap-3">
                      <div><label className="text-xs font-bold opacity-50 uppercase tracking-wider">Cost</label><input inputMode="numeric" type="number" onKeyDown={handleNumberInput} className={`w-full p-3 border rounded-xl bg-transparent outline-none text-sm focus:ring-2 focus:ring-blue-500 transition-all ${darkMode?'border-slate-600':'border-slate-200'}`} value={dressForm.orgPrice} onChange={e=>setDressForm({...dressForm, orgPrice:e.target.value})}/></div>
                      <div><label className="text-xs font-bold opacity-50 uppercase tracking-wider">Sale</label><input inputMode="numeric" type="number" onKeyDown={handleNumberInput} className={`w-full p-3 border rounded-xl bg-transparent outline-none text-sm focus:ring-2 focus:ring-blue-500 transition-all ${darkMode?'border-slate-600':'border-slate-200'}`} value={dressForm.salePrice} onChange={e=>setDressForm({...dressForm, salePrice:e.target.value})}/></div>
                   </div>
                   <button disabled={isSubmitting} className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold text-sm shadow-lg shadow-blue-500/30 hover:bg-blue-700 transition-all active:scale-95">Add Stock</button>
                 </form>
              </div>
              <div className="flex-1 flex flex-col overflow-hidden">
                 <div className={`rounded-2xl border flex flex-col h-full shadow-sm ${darkMode?'bg-slate-800 border-slate-700':'bg-white border-slate-100'}`}>
                    <div className="p-4 border-b flex shrink-0 gap-3 items-center border-slate-200/10"><Search size={18} className="opacity-50"/><input ref={inventorySearchInput} className="bg-transparent outline-none flex-1 text-sm font-medium" placeholder="Search stock..." value={inventorySearch} onChange={e=>setInventorySearch(e.target.value)}/></div>
                    <div className={`px-6 py-3 shrink-0 text-xs font-bold uppercase tracking-wider flex justify-between ${darkMode ? 'bg-slate-900/50 text-slate-400' : 'bg-slate-50 text-slate-500'}`}><span>{filteredInv.length} Items</span><span>Val: {formatCurrency(filteredInventoryValue)}</span></div>
                    
                    <div className="flex-1 overflow-auto">
                       <table className="w-full text-left text-sm table-fixed min-w-[600px]">
                          <thead className={`text-xs uppercase font-bold sticky top-0 z-10 backdrop-blur-md ${darkMode ? 'bg-slate-800/90 text-slate-400' : 'bg-white/90 text-slate-500'} shadow-sm`}>
                            <tr><th className="p-4 w-1/6 whitespace-nowrap">ID</th><th className="w-1/4 whitespace-nowrap">Brand</th><th className="text-right w-1/6 whitespace-nowrap">Cost</th><th className="text-right w-1/6 whitespace-nowrap">Sale</th><th className="text-center w-1/6 whitespace-nowrap">Status</th><th className="text-center w-1/6 whitespace-nowrap">Act</th></tr>
                          </thead>
                          <tbody className="divide-y divide-slate-200/10">
                             {filteredInv.length === 0 ? (
                                <tr><td colSpan="6" className="p-12 text-center opacity-40 text-sm">No items found.</td></tr>
                             ) : (
                                filteredInv.map(i => (
                                   <tr key={i.id} className={`transition-colors ${darkMode ? 'hover:bg-slate-700/50' : 'hover:bg-slate-50'}`}>
                                      <td className="p-4 font-mono text-blue-500 font-bold truncate">{i.suitId}</td><td className="truncate">{i.brand}</td><td className="text-right opacity-60">{i.orgPrice}</td><td className="text-right font-bold">{i.salePrice}</td>
                                      <td className="text-center">{i.qty>0?<span className="text-[10px] bg-emerald-500/10 text-emerald-500 px-2 py-1 rounded-full font-bold">Stock</span>:<span className="text-[10px] bg-rose-500/10 text-rose-500 px-2 py-1 rounded-full font-bold">Sold</span>}</td>
                                      <td className="text-center flex justify-center gap-2 py-4">{i.qty>0 && <><button onClick={()=>setEditingItem(i)} className="hover:text-blue-500 p-2 hover:bg-blue-500/10 rounded"><Edit size={16}/></button><button onClick={()=>openDeleteModal(i.id, 'inventory')} className="hover:text-red-500 p-2 hover:bg-red-500/10 rounded"><Trash2 size={16}/></button></>}</td>
                                   </tr>
                                ))
                             )}
                          </tbody>
                       </table>
                    </div>
                 </div>
              </div>
           </div>
         )}

         {/* SALES (POS) */}
         {activeTab === 'sales' && (
            <div className="max-w-2xl mx-auto animate-fade-in">
               <div className={`p-8 rounded-3xl shadow-xl border ${darkMode?'bg-slate-800 border-slate-700':'bg-white border-slate-100'}`}>
                  <h2 className="text-xl font-black text-center mb-8 tracking-tight">POS TERMINAL</h2>
                  
                  {/* Item Search & Add */}
                  <div className="relative mb-8">
                     <label className="text-xs font-bold opacity-50 block mb-2 uppercase tracking-wider">Search Product</label>
                     <div className={`flex items-center p-4 border rounded-2xl transition-all focus-within:ring-2 focus-within:ring-blue-500 ${darkMode?'border-slate-600 bg-slate-900':'border-slate-200 bg-slate-50'}`}>
                        <Search size={20} className="opacity-50 mr-3"/>
                        <input
                          autoFocus
                          className="bg-transparent outline-none flex-1 font-medium"
                          placeholder="Type ID (e.g. A1)..."
                          value={itemSearchQuery}
                          onChange={e => setItemSearchQuery(e.target.value)}
                        />
                     </div>
                     {availableItems.length > 0 && (
                       <div className={`absolute w-full mt-2 rounded-2xl border shadow-2xl z-20 overflow-hidden ${darkMode?'bg-slate-800 border-slate-600':'bg-white border-slate-200'}`}>
                          {availableItems.map(item => (
                            <div key={item.id} onClick={() => addToCart(item)} className={`p-4 flex justify-between items-center cursor-pointer hover:bg-blue-500 hover:text-white transition-colors border-b last:border-0 ${darkMode?'border-slate-700':'border-slate-100'}`}>
                               <span className="font-bold font-mono">{item.suitId}</span>
                               <span className="text-sm">{item.brand}</span>
                               <span className="text-sm font-bold">{formatCurrency(item.salePrice)}</span>
                            </div>
                          ))}
                       </div>
                     )}
                  </div>

                  {/* Cart Display */}
                  <div className={`mb-8 rounded-2xl border overflow-hidden ${darkMode?'border-slate-700 bg-slate-900/30':'border-slate-200 bg-slate-50'}`}>
                     <div className="p-4 border-b opacity-50 text-xs font-bold uppercase flex justify-between bg-black/5">
                        <span>Selected Items ({cart.length})</span>
                        <span>Total</span>
                     </div>
                     {cart.length === 0 ? (
                       <div className="p-10 text-center opacity-40 text-sm font-medium">Cart is empty</div>
                     ) : (
                       <div className="divide-y divide-slate-200/10">
                          {cart.map(item => (
                            <div key={item.id} className="p-4 flex justify-between items-center animate-slide-in">
                               <div>
                                  <p className="font-bold text-sm">{item.suitId}</p>
                                  <p className="text-xs opacity-60">{item.brand}</p>
                               </div>
                               <div className="flex items-center gap-4">
                                  <span className="font-bold text-sm">{formatCurrency(item.salePrice)}</span>
                                  <button onClick={() => removeFromCart(item.id)} className="text-red-500 hover:bg-red-500/10 p-2 rounded-full transition-colors"><MinusCircle size={18}/></button>
                               </div>
                            </div>
                          ))}
                       </div>
                     )}
                     <div className={`p-5 border-t flex justify-between items-center font-black text-xl ${darkMode?'bg-slate-800 border-slate-700':'bg-white border-slate-200'}`}>
                        <span>Total Bill</span>
                        <span className="text-green-500">{formatCurrency(cart.reduce((s,i)=>s+i.salePrice,0))}</span>
                     </div>
                  </div>

                  {/* Finalize Sale */}
                  <div className="space-y-5">
                     <div><label className="text-xs font-bold opacity-50 uppercase tracking-wider mb-2 block">Customer Name</label>
                     
                     {/* SMART SEARCH FOR SALES CUSTOMER */}
                     <div className="relative">
                        <input
                           type="text"
                           required
                           className={`w-full p-4 border rounded-xl bg-transparent outline-none font-medium focus:ring-2 focus:ring-blue-500 transition-all ${darkMode?'border-slate-600':'border-slate-200'}`}
                           placeholder="Type name..."
                           value={saleForm.customerName}
                           onChange={(e) => {
                              setSaleForm({...saleForm, customerName: e.target.value});
                              setShowSaleCustomerSuggestions(true);
                           }}
                           onFocus={() => setShowSaleCustomerSuggestions(true)}
                           onBlur={() => setTimeout(() => setShowSaleCustomerSuggestions(false), 200)}
                        />
                        {showSaleCustomerSuggestions && saleForm.customerName && saleCustomerMatches.length > 0 && (
                           <div className={`absolute top-full left-0 w-full mt-1 rounded-xl border shadow-xl z-50 overflow-hidden ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100'}`}>
                              {saleCustomerMatches.map(c => (
                                 <div
                                    key={c.id}
                                    onClick={() => {
                                       setSaleForm({...saleForm, customerName: c.name});
                                       setShowSaleCustomerSuggestions(false);
                                    }}
                                    className={`p-3 text-sm cursor-pointer hover:bg-blue-500 hover:text-white transition-colors ${darkMode ? 'border-slate-700' : 'border-slate-100'} border-b last:border-0`}
                                 >
                                    {c.name}
                                 </div>
                              ))}
                           </div>
                        )}
                     </div>
                     
                     </div>
                     <div><label className="text-xs font-bold opacity-50 uppercase tracking-wider mb-2 block">Paid Amount</label><input inputMode="numeric" type="number" onKeyDown={handleNumberInput} className={`w-full p-4 border rounded-xl bg-transparent outline-none font-medium focus:ring-2 focus:ring-blue-500 transition-all ${darkMode?'border-slate-600':'border-slate-200'}`} value={saleForm.paidAmount} onChange={e=>setSaleForm({...saleForm, paidAmount:e.target.value})}/></div>
                     <button onClick={handleProcessSale} disabled={isSubmitting || cart.length===0} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-4 rounded-xl font-bold shadow-lg shadow-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95">CONFIRM SALE</button>
                  </div>
               </div>
            </div>
         )}

         {/* CUSTOMERS */}
         {activeTab === 'customers' && (
            <div className="flex flex-col h-full overflow-hidden gap-6 animate-fade-in">
               <div className={`shrink-0 p-6 rounded-2xl shadow-sm border flex flex-col md:flex-row gap-6 items-center ${darkMode?'bg-slate-800 border-slate-700':'bg-white border-slate-100'}`}>
                  <div className="flex-1 w-full">
                     <h3 className="font-bold mb-3 text-lg flex items-center gap-2"><Wallet size={20} className="text-blue-500"/> Quick Payment</h3>
                     <div className="flex flex-col sm:flex-row gap-3 items-start w-full">
                        {/* SMART SEARCHABLE INPUT (REPLACES OLD SELECT) */}
                        <div className="relative flex-1 w-full">
                           <input
                              type="text"
                              placeholder="Search Customer..."
                              className={`w-full p-3 rounded-xl bg-transparent border text-sm outline-none focus:ring-2 focus:ring-blue-500 ${darkMode ? 'border-slate-600' : 'border-slate-200'}`}
                              value={paymentCustomerSearch}
                              onChange={(e) => {
                                 setPaymentCustomerSearch(e.target.value);
                                 setShowCustomerSuggestions(true);
                                 setPaymentForm(prev => ({ ...prev, customerId: '' })); // Reset selection on type
                              }}
                              onFocus={() => setShowCustomerSuggestions(true)}
                              onBlur={() => setTimeout(() => setShowCustomerSuggestions(false), 200)}
                           />
                           {showCustomerSuggestions && paymentCustomerSearch && paymentCustomerMatches.length > 0 && (
                              <div className={`absolute top-full left-0 w-full mt-1 rounded-xl border shadow-xl z-50 overflow-hidden ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100'}`}>
                                 {paymentCustomerMatches.map(c => (
                                    <div
                                       key={c.id}
                                       onClick={() => selectPaymentCustomer(c)}
                                       className={`p-3 text-sm cursor-pointer hover:bg-blue-500 hover:text-white transition-colors ${darkMode ? 'border-slate-700' : 'border-slate-100'} border-b last:border-0`}
                                    >
                                       {c.name}
                                    </div>
                                 ))}
                              </div>
                           )}
                        </div>
                        
                        <input inputMode="numeric" type="number" onKeyDown={handleNumberInput} placeholder="Amount" className={`p-3 rounded-xl bg-transparent border w-full sm:w-32 text-sm focus:ring-2 focus:ring-blue-500 outline-none ${darkMode ? 'border-slate-600' : 'border-slate-200'}`} value={paymentForm.amount} onChange={e=>setPaymentForm({...paymentForm, amount:e.target.value})}/>
                        <div className="flex gap-2 w-full sm:w-auto">
                           <button onClick={handleAddPayment} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl text-sm font-bold shadow-lg shadow-blue-500/30 transition-all active:scale-95 flex-1">Add</button>
                           {/* ADDED REFUND BUTTON */}
                           <button onClick={handleRefund} className="bg-rose-600 hover:bg-rose-700 text-white px-4 py-3 rounded-xl text-sm font-bold shadow-lg shadow-rose-500/30 transition-all active:scale-95" title="Refund Amount"><RefreshCcw size={20}/></button>
                        </div>
                     </div>
                  </div>
               </div>
               
               <div className="flex-1 overflow-y-auto">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pb-4">
                     {filteredCust.map(c => {
                        const bal = (c.totalBill||0)-(c.totalPaid||0);
                        return (
                           <div key={c.id} onClick={() => {setViewingCustomer(c); setCustomerModalTab('payments');}} className={`p-5 rounded-2xl border shadow-sm h-fit cursor-pointer transition-all duration-200 hover:shadow-lg hover:-translate-y-1 ${darkMode?'bg-slate-800 border-slate-700 hover:border-blue-500/50':'bg-white border-slate-100 hover:border-blue-200'}`}>
                              <div className="flex justify-between mb-3"><h4 className={`font-bold text-lg truncate ${darkMode?'text-white':'text-slate-800'}`}>{c.name}</h4><span className="text-xs bg-blue-500/10 text-blue-500 px-3 py-1 rounded-full font-bold">{formatCurrency(c.totalBill||0)}</span></div>
                              <div className="text-sm space-y-2 opacity-80"><div className="flex justify-between"><span>Rem:</span><b>{formatCurrency(bal)}</b></div><div className="flex justify-between"><span>Paid:</span><b className="text-green-500">{formatCurrency(c.totalPaid||0)}</b></div></div>
                              <div className={`h-px my-3 ${darkMode ? 'bg-slate-700' : 'bg-slate-100'}`}></div>
                              <div className="flex justify-between items-center text-xs opacity-60">
                                 <span className="flex items-center gap-1"><CalendarCheck size={12}/> Last:</span>
                                 <span>{c.lastPaymentDate ? new Date(c.lastPaymentDate.seconds*1000).toLocaleDateString() : 'N/A'}</span>
                              </div>
                              {bal===0 && <button onClick={(e)=>{e.stopPropagation(); openDeleteModal(c.id, 'customer')}} className="w-full mt-4 text-xs text-red-500 border border-red-500/20 py-2 rounded-lg hover:bg-red-500/10 transition-colors">Remove Customer</button>}
                           </div>
                        )
                     })}
                  </div>
               </div>
            </div>
         )}

         {/* MAMA (Renamed to PARTNER SHARE in UI) */}
         {activeTab === 'mama' && (
            <div className="space-y-6 h-full flex flex-col animate-fade-in">
               <div className="grid grid-cols-3 gap-4 shrink-0">
                  <div className={`p-5 text-center rounded-2xl border shadow-sm ${darkMode?'bg-slate-800 border-slate-700':'bg-white border-slate-100'}`}><p className="text-xs font-bold opacity-50 uppercase mb-1">Total</p><p className="text-xl font-black text-blue-500">{formatCurrency(stats.mamaTotal)}</p></div>
                  <div className={`p-5 text-center rounded-2xl border shadow-sm ${darkMode?'bg-slate-800 border-slate-700':'bg-white border-slate-100'}`}><p className="text-xs font-bold opacity-50 uppercase mb-1">Pending</p><p className="text-xl font-black text-rose-500">{formatCurrency(stats.mamaPending)}</p></div>
                  <div className={`p-5 text-center rounded-2xl border shadow-sm ${darkMode?'bg-slate-800 border-slate-700':'bg-white border-slate-100'}`}><p className="text-xs font-bold opacity-50 uppercase mb-1">Paid</p><p className="text-xl font-black text-emerald-500">{formatCurrency(stats.mamaPaid)}</p></div>
               </div>
               
               <div className="flex gap-3 shrink-0">
                  <button 
                     onClick={() => setMamaTab('pending')}
                     className={`flex-1 py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all active:scale-95 ${mamaTab === 'pending' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' : 'bg-gray-100 text-gray-500 dark:bg-slate-800 dark:text-slate-400 hover:bg-gray-200 dark:hover:bg-slate-700'}`}
                  >
                     <AlertTriangle size={18} /> Pending Payments
                  </button>
                  <button 
                     onClick={() => setMamaTab('paid')}
                     className={`flex-1 py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all active:scale-95 ${mamaTab === 'paid' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/30' : 'bg-gray-100 text-gray-500 dark:bg-slate-800 dark:text-slate-400 hover:bg-gray-200 dark:hover:bg-slate-700'}`}
                  >
                     <History size={18} /> Payment History
                  </button>
               </div>
               
               <div className={`rounded-2xl border flex flex-col flex-1 overflow-hidden shadow-sm ${darkMode?'bg-slate-800 border-slate-700':'bg-white border-slate-100'}`}>
                  <div className="p-5 border-b flex shrink-0 justify-between items-center">
                     <h3 className="font-bold flex gap-2 items-center text-lg">
                        {mamaTab === 'pending' ? <><AlertTriangle size={20} className="text-rose-500"/> Pending Items</> : <><History size={20} className="text-emerald-500"/> Paid Items List</>}
                     </h3>
                     {mamaTab === 'pending' && selectedMamaSales.length > 0 && <button onClick={()=>handleMarkMamaPaid(true)} className="bg-rose-500 text-white px-5 py-2 rounded-xl text-xs font-bold shadow-lg shadow-rose-500/30 transition-all active:scale-95">Pay Selected ({selectedMamaSales.length})</button>}
                  </div>

                  <div className="flex-1 overflow-auto">
                     <table className="w-full text-left text-sm table-fixed min-w-[500px]">
                        <thead className={`text-xs uppercase font-bold sticky top-0 z-10 backdrop-blur-md ${darkMode ? 'bg-slate-800/90 text-slate-400' : 'bg-white/90 text-slate-500'} shadow-sm`}>
                            <tr>
                                {mamaTab === 'pending' && (
                                   <th className="p-4 w-16 text-center">
                                       <input 
                                           type="checkbox" 
                                           checked={sales.filter(s => !s.mamaPaid).length > 0 && sales.filter(s => !s.mamaPaid).every(s => selectedMamaSales.includes(s.id))} 
                                           onChange={handleSelectAllMama}
                                           className="cursor-pointer w-4 h-4 accent-blue-500"
                                       />
                                   </th>
                                )}
                                <th className="p-4">Item Details</th>
                                {mamaTab === 'paid' && <th className="text-center">Paid Date</th>}
                                <th className="text-right w-32 p-4">Share Amount</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200/10">
                           {/* MODIFIED MAPPING: Now uses sortedPendingMamaSales for 'pending' view */}
                           {mamaTab === 'pending' ? (
                              sortedPendingMamaSales.length === 0 ? (
                                <tr><td colSpan="4" className="p-12 text-center opacity-40 text-sm border-2 border-dashed rounded-xl m-4">No pending payments</td></tr>
                              ) : (
                                sortedPendingMamaSales.map(s => (
                                   <tr key={s.id} className={`cursor-pointer transition-colors ${selectedMamaSales.includes(s.id) ? 'bg-rose-500/10' : (darkMode ? 'hover:bg-slate-700/30' : 'hover:bg-slate-50')}`} onClick={() => toggleMamaSelection(s.id)}>
                                      <td className="p-4 text-center"><input type="checkbox" checked={selectedMamaSales.includes(s.id)} readOnly className="w-4 h-4 accent-rose-500 pointer-events-none"/></td>
                                      <td className="truncate font-medium">{s.suitId} <span className="opacity-50 text-xs font-normal ml-2">({s.brand})</span></td>
                                      <td className="text-right font-bold text-rose-500 p-4">{s.mamaShare}</td>
                                   </tr>
                                ))
                              )
                           ) : (
                              // UPDATED: Using sortedPaidMamaSales instead of raw filter
                              sortedPaidMamaSales.length === 0 ? (
                                <tr><td colSpan="4" className="p-12 text-center opacity-40 text-sm border-2 border-dashed rounded-xl m-4">No payment history</td></tr>
                              ) : (
                                sortedPaidMamaSales.map(s => (
                                   <tr key={s.id} className={`transition-colors ${darkMode ? 'hover:bg-slate-700/30' : 'hover:bg-slate-50'}`}>
                                      <td className="p-4 truncate font-medium">{s.suitId} <span className="opacity-50 text-xs font-normal ml-2">({s.brand})</span></td>
                                      <td className="text-center text-xs opacity-60">
                                         {s.mamaPaidAt ? new Date(s.mamaPaidAt.seconds * 1000).toLocaleDateString() : (s.date ? new Date(s.date.seconds * 1000).toLocaleDateString() : '-')}
                                      </td>
                                      <td className="text-right font-bold text-emerald-500 p-4">{s.mamaShare}</td>
                                   </tr>
                                ))
                              )
                           )}
                        </tbody>
                     </table>
                  </div>
               </div>
            </div>
         )}

         {/* Edit Modal */}
         {editingItem && (
           <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[120] p-4 transition-opacity">
              <div className={`p-8 rounded-3xl w-full max-w-sm shadow-2xl transform transition-all scale-100 ${darkMode?'bg-slate-900 border border-slate-700':'bg-white'}`}>
                 <h3 className="font-bold text-xl mb-6 text-center">Edit Inventory Item</h3>
                 <form onSubmit={handleUpdateItem} className="space-y-4">
                   <div><label className="text-xs font-bold opacity-50 uppercase tracking-wider">Brand</label><input className={`w-full p-3 border rounded-xl bg-transparent outline-none font-medium focus:ring-2 focus:ring-blue-500 ${darkMode?'border-slate-600':'border-slate-200'}`} value={editingItem.brand} onChange={e=>setEditingItem({...editingItem, brand:e.target.value})}/></div>
                   <div className="grid grid-cols-2 gap-4">
                      <div><label className="text-xs font-bold opacity-50 uppercase tracking-wider">Cost</label><input inputMode="numeric" type="number" onKeyDown={handleNumberInput} className={`w-full p-3 border rounded-xl bg-transparent outline-none font-medium focus:ring-2 focus:ring-blue-500 ${darkMode?'border-slate-600':'border-slate-200'}`} value={editingItem.orgPrice} onChange={e=>setEditingItem({...editingItem, orgPrice:e.target.value})}/></div>
                      <div><label className="text-xs font-bold opacity-50 uppercase tracking-wider">Sale</label><input inputMode="numeric" type="number" onKeyDown={handleNumberInput} className={`w-full p-3 border rounded-xl bg-transparent outline-none font-medium focus:ring-2 focus:ring-blue-500 ${darkMode?'border-slate-600':'border-slate-200'}`} value={editingItem.salePrice} onChange={e=>setEditingItem({...editingItem, salePrice:e.target.value})}/></div>
                   </div>
                   <div className="flex gap-3 mt-6"><button type="button" onClick={()=>setEditingItem(null)} className={`flex-1 py-3 rounded-xl font-bold transition-colors ${darkMode ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>Cancel</button><button className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-lg shadow-blue-500/20">Save Changes</button></div>
                 </form>
              </div>
           </div>
         )}

         {/* CUSTOMER HISTORY MODAL */}
         {viewingCustomer && (
           <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[120] flex items-center justify-center p-4 animate-fade-in">
              <div className={`w-full max-w-lg max-h-[85vh] flex flex-col rounded-2xl shadow-2xl transform transition-all scale-100 ${darkMode ? 'bg-slate-900 border border-slate-700' : 'bg-white'}`}>
                 {/* Modal Header */}
                 <div className={`p-6 border-b flex justify-between items-start ${darkMode ? 'border-slate-800' : 'border-slate-100'}`}>
                    <div>
                       <h2 className="text-2xl font-black flex items-center gap-2"><Users className="text-blue-500"/> {viewingCustomer.name}</h2>
                       <p className="text-xs opacity-50 font-bold uppercase tracking-wider mt-1">Customer Account History</p>
                    </div>
                    <button onClick={() => setViewingCustomer(null)} className="p-2 hover:bg-gray-500/10 rounded-full transition-colors"><X size={24}/></button>
                 </div>
                 
                 {/* Modal Content */}
                 <div className="flex-1 overflow-y-auto p-6">
                    {/* Stats Cards */}
                    <div className="grid grid-cols-3 gap-3 mb-8">
                       <div className={`p-4 rounded-2xl border text-center ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                          <p className="text-[10px] font-bold opacity-50 uppercase tracking-wider">Total Bill</p>
                          <p className="text-lg font-black text-blue-500">{formatCurrency(viewingCustomer.totalBill)}</p>
                       </div>
                       <div className={`p-4 rounded-2xl border text-center ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                          <p className="text-[10px] font-bold opacity-50 uppercase tracking-wider">Paid</p>
                          <p className="text-lg font-black text-emerald-500">{formatCurrency(viewingCustomer.totalPaid)}</p>
                       </div>
                       <div className={`p-4 rounded-2xl border text-center ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                          <p className="text-[10px] font-bold opacity-50 uppercase tracking-wider">Balance</p>
                          <p className="text-lg font-black text-rose-500">{formatCurrency((viewingCustomer.totalBill||0) - (viewingCustomer.totalPaid||0))}</p>
                       </div>
                    </div>

                    {/* Tabs for History */}
                    <div className="flex gap-3 mb-6 p-1 bg-gray-100/50 dark:bg-slate-800/50 rounded-xl">
                       <button 
                          onClick={() => setCustomerModalTab('payments')}
                          className={`flex-1 py-2.5 rounded-lg text-xs font-bold uppercase flex items-center justify-center gap-2 transition-all duration-200 ${customerModalTab === 'payments' ? 'bg-white dark:bg-slate-700 shadow-sm text-blue-600' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'}`}
                       >
                          <Receipt size={16} /> Payments
                       </button>
                       <button 
                          onClick={() => setCustomerModalTab('purchases')}
                          className={`flex-1 py-2.5 rounded-lg text-xs font-bold uppercase flex items-center justify-center gap-2 transition-all duration-200 ${customerModalTab === 'purchases' ? 'bg-white dark:bg-slate-700 shadow-sm text-purple-600' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'}`}
                       >
                          <ShoppingBag size={16} /> Purchases
                       </button>
                    </div>

                    {/* List Content */}
                    <div className="space-y-3">
                       {customerModalTab === 'payments' ? (
                          customerHistory.length > 0 ? (
                             customerHistory.map((record) => (
                                <div key={record.id} className={`p-4 rounded-xl flex justify-between items-center border transition-colors ${darkMode ? 'bg-slate-800/50 border-slate-700 hover:bg-slate-800' : 'bg-white border-slate-100 hover:border-slate-200'}`}>
                                   <div className="flex items-center gap-4">
                                      <div className={`p-3 rounded-full ${record.type === 'Refund' ? 'bg-rose-500/10 text-rose-500' : 'bg-emerald-500/10 text-emerald-500'}`}>
                                        {record.type === 'Refund' ? <RefreshCcw size={18}/> : <Receipt size={18}/>}
                                      </div>
                                      <div>
                                         <p className="font-bold text-sm">{record.type || 'Payment'}</p>
                                         <p className="text-xs opacity-50">{record.date ? new Date(record.date.seconds * 1000).toLocaleDateString() : 'Unknown Date'}</p>
                                      </div>
                                   </div>
                                   <span className={`font-bold ${record.type === 'Refund' ? 'text-rose-500' : 'text-emerald-500'}`}>
                                    {record.type === 'Refund' ? '-' : '+'}{formatCurrency(record.amount)}
                                   </span>
                                </div>
                             ))
                          ) : (
                             <div className="text-center py-12 opacity-40 text-sm border-2 border-dashed rounded-xl">No payment history found</div>
                          )
                       ) : (
                          customerPurchases.length > 0 ? (
                             customerPurchases.map((item) => (
                                <div key={item.id} className={`p-4 rounded-xl flex justify-between items-center border transition-colors ${darkMode ? 'bg-slate-800/50 border-slate-700 hover:bg-slate-800' : 'bg-white border-slate-100 hover:border-slate-200'}`}>
                                   <div className="flex items-center gap-4">
                                      <div className="p-3 rounded-full bg-purple-500/10 text-purple-500"><ShoppingBag size={18}/></div>
                                      <div className="overflow-hidden">
                                         <p className="font-bold text-sm truncate w-40 sm:w-auto">{item.suitId} <span className="opacity-50 font-normal">({item.brand})</span></p>
                                         <p className="text-xs opacity-50">{item.date ? new Date(item.date.seconds * 1000).toLocaleDateString() : 'Unknown Date'}</p>
                                      </div>
                                   </div>
                                   <div className="flex items-center gap-2">
                                       <span className="font-bold text-purple-500">{formatCurrency(item.salePrice)}</span>
                                       {/* RETURN BUTTON */}
                                       <button 
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            openReturnModal(item);
                                        }}
                                        className="p-2 text-rose-500 hover:bg-rose-500/10 rounded-full transition-colors"
                                        title="Return Item"
                                      >
                                        <Undo2 size={16}/>
                                      </button>
                                   </div>
                                </div>
                             ))
                          ) : (
                             <div className="text-center py-12 opacity-40 text-sm border-2 border-dashed rounded-xl">No purchases found</div>
                          )
                       )}
                    </div>
                 </div>
              </div>
           </div>
         )}

         </div>
      </div>
    </div>
  );
}