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
  getDoc,
  setDoc,
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
  User,
  UserCircle,
  Package,
  MinusCircle,
  Wallet,
  History,
  Receipt,
  ShoppingBag,
  Undo2,
  ShieldCheck,
  RefreshCcw,
  BarChart3,
  AlertCircle,
  Trophy,
  Archive,
  RotateCcw
} from 'lucide-react';

// --- 🔴 FIREBASE CONFIG ---
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
          <div className={`p-4 rounded-full mb-4 ${isDanger ? (darkMode ? 'bg-red-900/30 text-red-500' : 'bg-red-50 text-red-600') : (darkMode ? 'bg-blue-900/30 text-blue-500' : 'bg-blue-50 text-blue-600')}`}>
            {isDanger ? <Trash2 size={32} /> : <RotateCcw size={32} />}
          </div>
          <h3 className={`text-xl font-bold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>{title}</h3>
          <p className={`text-sm mb-6 ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>{message}</p>
          <div className="flex flex-col sm:flex-row gap-3 w-full">
            <button onClick={onClose} className={`flex-1 py-3 rounded-xl font-bold transition-colors ${darkMode ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>Cancel</button>
            <button onClick={onConfirm} className={`flex-1 py-3 rounded-xl font-bold text-white shadow-lg transition-all active:scale-95 ${isDanger ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'}`}>{isDanger ? 'Confirm' : 'Proceed'}</button>
          </div>
        </div>
      </div>
    </div>
  );
};

// RESPONSIVE CARD COMPONENT (Fix for Dashboard Numbers)
const Card = ({ title, value, subtext, icon: Icon, colorClass, darkMode, iconBgClass, iconTextClass }) => (
  <div className={`p-4 sm:p-5 rounded-2xl shadow-sm border flex flex-col justify-between transition-all duration-300 ease-out hover:scale-[1.03] hover:shadow-xl active:scale-95 cursor-default h-full ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
    <div className="flex justify-between items-start mb-3 sm:mb-4">
       <div className={`p-2 sm:p-3 rounded-xl shadow-sm ${darkMode ? colorClass : iconBgClass}`}>
          <Icon size={20} className={`${darkMode ? 'text-white' : iconTextClass}`} />
       </div>
    </div>
    <div>
       <p className={`text-[10px] font-bold uppercase tracking-wider mb-1 ${darkMode ? 'text-slate-400' : 'text-gray-400'}`}>{title}</p>
       {/* FIX: Reduced mobile font size to avoid overflow on 6 digits */}
       <h3 className={`text-xl sm:text-3xl font-black break-words leading-tight ${darkMode ? 'text-white' : 'text-gray-900'}`}>{value}</h3>
       {subtext && <p className={`text-[10px] sm:text-xs mt-2 font-medium ${darkMode ? 'text-slate-500' : 'text-gray-400'}`}>{subtext}</p>}
    </div>
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
  const [authName, setAuthName] = useState(''); 
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
  const [userProfileName, setUserProfileName] = useState(''); 
  
  // UI States
  const [inventorySearch, setInventorySearch] = useState('');
  const [showAvailableOnly, setShowAvailableOnly] = useState(false);
  const [customerSearch, setCustomerSearch] = useState('');
  const [selectedMamaSales, setSelectedMamaSales] = useState([]);
  const [editingItem, setEditingItem] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [modalConfig, setModalConfig] = useState({ isOpen: false, type: null, id: null, title: '', message: '', isDanger: false });
  const [mamaTab, setMamaTab] = useState('pending');
  // NEW: State for Insights Widget
  const [insightView, setInsightView] = useState(null); // 'risk' | 'highVol' | null
  
  const [viewingCustomer, setViewingCustomer] = useState(null);
  const [customerModalTab, setCustomerModalTab] = useState('payments');
  const [modalAmount, setModalAmount] = useState(''); 

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

  // --- INJECT CUSTOM CSS FOR SMOOTH ANIMATIONS ---
  useEffect(() => {
    const style = document.createElement('style');
    style.innerHTML = `
      @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      .animate-fade-in { animation: fadeIn 0.4s cubic-bezier(0.4, 0, 0.2, 1) forwards; }
      
      @keyframes slideIn { from { opacity: 0; transform: translateX(-20px); } to { opacity: 1; transform: translateX(0); } }
      .animate-slide-in { animation: slideIn 0.3s ease-out forwards; }

      /* Custom Scrollbar for a cleaner look */
      ::-webkit-scrollbar { width: 4px; height: 4px; }
      ::-webkit-scrollbar-track { background: transparent; }
      ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
      .dark ::-webkit-scrollbar-thumb { background: #334155; }
      ::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
    `;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  // Effects
  useEffect(() => { document.title = "Sales Master"; }, []);
  
  useEffect(() => {
    if (darkMode) { document.documentElement.classList.add('dark'); localStorage.setItem('theme', 'dark'); }
    else { document.documentElement.classList.remove('dark'); localStorage.setItem('theme', 'light'); }
  }, [darkMode]);

  useEffect(() => {
    if (!auth) return;
    const unsubscribe = onAuthStateChanged(auth, (u) => { 
        setUser(u); 
        setAuthLoading(false);
        setAuthEmail('');
        setAuthPassword('');
        setAuthName('');
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user || !db) {
        setUserProfileName('');
        return;
    }
    const fetchProfile = async () => {
        try {
            const profileRef = doc(db, `artifacts/${appId}/users/${user.uid}/account/info`);
            const docSnap = await getDoc(profileRef);
            if (docSnap.exists()) {
                setUserProfileName(docSnap.data().name);
            } else {
                setUserProfileName("User"); 
            }
        } catch (e) {
            console.error("Profile fetch error", e);
        }
    };
    fetchProfile();
  }, [user]);

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
    setModalConfig({ 
        isOpen: true, 
        type: type === 'inventory' ? 'DELETE_INVENTORY' : 'ARCHIVE_CUSTOMER',
        id, 
        title: type === 'inventory' ? 'Confirm Deletion' : 'Remove Customer?',
        message: type === 'inventory' ? 'This action cannot be undone.' : 'Customer will be moved to Deleted Customers tab.', 
        isDanger: true 
    });
  };

  const openRestoreModal = (id) => {
    playSound('pop');
    setModalConfig({ 
        isOpen: true, 
        type: 'RESTORE_CUSTOMER', 
        id, 
        title: 'Restore Customer?',
        message: 'This customer will appear in the main list again.', 
        isDanger: false 
    });
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

      } else if (type === 'ARCHIVE_CUSTOMER') {
        await updateDoc(doc(db, `artifacts/${appId}/users/${user.uid}/customers`, id), {
            status: 'deleted'
        });
        showToast("Customer Removed");
        playSound('delete');
        
      } else if (type === 'RESTORE_CUSTOMER') {
        await updateDoc(doc(db, `artifacts/${appId}/users/${user.uid}/customers`, id), {
            status: 'active'
        });
        showToast("Customer Restored");
        playSound('success');

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
    
    if (!isLoginView && !authName.trim()) { showToast("Name is required", 'error'); return; }
    if (!email || !password) { showToast("Email and Password are required", 'error'); return; }
    
    if (!isLoginView && authCode !== ADMIN_ACCESS_CODE) {
        showToast("Invalid Admin Access Code!", 'error');
        playSound('error');
        return;
    }

    setIsSubmitting(true);
    try {
      if (isLoginView) { 
          await signInWithEmailAndPassword(auth, email, password); 
          showToast("Welcome back!"); 
      } else { 
          const userCred = await createUserWithEmailAndPassword(auth, email, password); 
          await setDoc(doc(db, `artifacts/${appId}/users/${userCred.user.uid}/account/info`), {
              name: authName.trim(),
              email: email,
              joinedAt: serverTimestamp()
          });
          showToast("Account Created!"); 
      }
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
        
        let custRef, existing = customers.find(c => c.name.toLowerCase().trim() === saleForm.customerName.trim().toLowerCase() && c.status !== 'deleted'); 
        if (existing) custRef = doc(db, `${userRef}/customers/${existing.id}`);
        else custRef = doc(collection(db, `${userRef}/customers`));
        
        const custSnap = await t.get(custRef);
        const totalSale = itemsToSell.reduce((s, i) => s + i.data.salePrice, 0);
        const paid = Number(saleForm.paidAmount) || 0;

        let updateData = { 
            totalBill: (custSnap.exists() ? (custSnap.data().totalBill || 0) : 0) + totalSale, 
            totalPaid: (custSnap.exists() ? (custSnap.data().totalPaid || 0) : 0) + paid, 
            lastUpdated: serverTimestamp(),
            status: 'active'
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
    return customers.filter(c => c.name.toLowerCase().includes(lower) && c.status !== 'deleted').slice(0, 5);
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
    return customers.filter(c => c.name.toLowerCase().includes(lower) && c.status !== 'deleted').slice(0, 5);
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
        setPaymentCustomerSearch(''); 
        showToast("Payment Recorded!"); playSound('success');
      } catch (err) { showToast("Error adding payment", 'error'); }
  };

  const handleRefund = async (e) => {
      e.preventDefault();
      if (!user) return;
      const cust = customers.find(c => c.id === paymentForm.customerId);
      
      if (!cust) { showToast("Select a customer first", 'error'); return; }
      
      const amountToRefund = Number(paymentForm.amount);

      if (!amountToRefund || amountToRefund <= 0) { showToast("Amount must be positive", 'error'); return; }
      
      try {
        const newPaid = Math.max(0, (cust.totalPaid || 0) - amountToRefund);

        await updateDoc(doc(db, `artifacts/${appId}/users/${user.uid}/customers`, paymentForm.customerId), {
          totalPaid: newPaid
        });
        
        await addDoc(collection(db, `artifacts/${appId}/users/${user.uid}/payments`), {
            customerId: paymentForm.customerId,
            amount: amountToRefund,
            date: serverTimestamp(),
            type: 'Refund' 
        });

        setPaymentForm({ customerId: '', amount: '' }); 
        setPaymentCustomerSearch(''); 
        showToast("Refund Processed!"); playSound('delete'); 
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

  // --- NEW INSIGHTS CALCULATION (Only Active Customers) ---
  const riskCustomers = useMemo(() => {
    const now = new Date();
    return customers.filter(c => {
        if (c.status === 'deleted') return false; 
        const balance = (c.totalBill || 0) - (c.totalPaid || 0);
        if (balance <= 0) return false; 
        
        if (!c.lastPaymentDate) return true; 

        const lastDate = new Date(c.lastPaymentDate.seconds * 1000);
        const diffTime = Math.abs(now - lastDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays > 30;
    });
  }, [customers]);

  const highVolumeCustomers = useMemo(() => {
    return customers.filter(c => c.status !== 'deleted' && ((c.totalBill || 0) - (c.totalPaid || 0)) > 10000);
  }, [customers]);


  const filteredInv = useMemo(() => {
    const upperSearch = inventorySearch.toUpperCase();
    const lowerSearch = inventorySearch.toLowerCase();
    const d = inventory.filter(i => (i.suitId?.includes(upperSearch) || i.brand?.toLowerCase().includes(lowerSearch)) && (!showAvailableOnly || i.qty > 0));
    return d.sort((a, b) => (a.suitId || '').localeCompare(b.suitId || '', undefined, { numeric: true, sensitivity: 'base' }));
  }, [inventory, inventorySearch, showAvailableOnly]);

  const filteredCust = useMemo(() => {
    return customers
      .filter(c => c.status !== 'deleted' && (c.name || '').toLowerCase().includes(customerSearch.toLowerCase()))
      .sort((a, b) => {
        const balA = (a.totalBill || 0) - (a.totalPaid || 0);
        const balB = (b.totalBill || 0) - (b.totalPaid || 0);
        const isPaidA = balA <= 0;
        const isPaidB = balB <= 0;

        if (isPaidA !== isPaidB) {
            return isPaidA ? 1 : -1; 
        }
        return (a.name || '').localeCompare(b.name || '', undefined, { sensitivity: 'base' });
      });
  }, [customers, customerSearch]);

  const deletedCust = useMemo(() => {
    return customers.filter(c => c.status === 'deleted');
  }, [customers]);

  const filteredInventoryValue = useMemo(() => filteredInv.reduce((acc, item) => acc + (Number(item.orgPrice)||0), 0), [filteredInv]);

  const activeCustomer = useMemo(() => {
      return customers.find(c => c.id === viewingCustomer?.id) || viewingCustomer;
  }, [customers, viewingCustomer]);

  const handleModalPayment = async () => {
    if (!activeCustomer || !modalAmount || Number(modalAmount) <= 0) return;
    
    const amountToAdd = Number(modalAmount);
    const currentPaid = activeCustomer.totalPaid || 0;
    const pending = (activeCustomer.totalBill || 0) - currentPaid;

    if (amountToAdd > pending) { showToast(`Max payment allowed: Rs ${pending}`, 'error'); return; }

    try {
      await updateDoc(doc(db, `artifacts/${appId}/users/${user.uid}/customers`, activeCustomer.id), {
        totalPaid: currentPaid + amountToAdd, 
        lastPaymentDate: serverTimestamp()
      });
      
      await addDoc(collection(db, `artifacts/${appId}/users/${user.uid}/payments`), {
          customerId: activeCustomer.id,
          amount: amountToAdd,
          date: serverTimestamp(),
          type: 'Payment'
      });

      setModalAmount('');
      showToast("Payment Recorded!"); 
      playSound('success');
    } catch (err) { showToast("Error adding payment", 'error'); }
  };

  const handleModalRefund = async () => {
    if (!activeCustomer || !modalAmount || Number(modalAmount) <= 0) return;
    
    const amountToRefund = Number(modalAmount);
    const currentPaid = activeCustomer.totalPaid || 0;
    
    if (amountToRefund > currentPaid) { showToast("Cannot refund more than paid amount!", 'error'); return; }
    
    try {
      const newPaid = Math.max(0, currentPaid - amountToRefund);

      await updateDoc(doc(db, `artifacts/${appId}/users/${user.uid}/customers`, activeCustomer.id), {
        totalPaid: newPaid
      });
      
      await addDoc(collection(db, `artifacts/${appId}/users/${user.uid}/payments`), {
          customerId: activeCustomer.id,
          amount: amountToRefund,
          date: serverTimestamp(),
          type: 'Refund'
      });

      setModalAmount('');
      showToast("Refund Processed!"); 
      playSound('delete');
    } catch (err) { showToast("Error processing refund", 'error'); }
  };

  const customerHistory = useMemo(() => {
      if (!activeCustomer) return [];
      return payments.filter(p => p.customerId === activeCustomer.id);
  }, [payments, activeCustomer]);

  const customerPurchases = useMemo(() => {
      if (!activeCustomer) return [];
      return sales.filter(s => s.customerId === activeCustomer.id);
  }, [sales, activeCustomer]);

  const sortedPendingMamaSales = useMemo(() => {
    return sales
      .filter(s => !s.mamaPaid)
      .sort((a, b) => (a.suitId || '').localeCompare(b.suitId || '', undefined, { numeric: true, sensitivity: 'base' }));
  }, [sales]);

  const sortedPaidMamaSales = useMemo(() => {
    return sales
      .filter(s => s.mamaPaid)
      .sort((a, b) => (a.suitId || '').localeCompare(b.suitId || '', undefined, { numeric: true, sensitivity: 'base' }));
  }, [sales]);

  if (authLoading) return <div className={`h-screen flex items-center justify-center ${darkMode ? 'bg-slate-900' : 'bg-gray-50'}`}><LoadingSpinner /></div>;

  // LOGIN SCREEN
  if (!user) {
    return (
      <div className={`h-screen flex flex-col items-center justify-center p-4 ${darkMode ? 'bg-slate-900 text-white' : 'bg-gray-50 text-slate-800'}`}>
        <ToastContainer toasts={toasts} removeToast={removeToast} />
        <div className={`w-full max-w-md p-8 rounded-3xl shadow-2xl transition-all ${darkMode ? 'bg-slate-800 border border-slate-700' : 'bg-white border border-gray-100 shadow-slate-200/50'}`}>
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4 bg-blue-600 p-4 rounded-2xl w-fit mx-auto text-white shadow-lg shadow-blue-600/30"><Shirt size={32}/></div>
            <h1 className="text-4xl font-black tracking-tighter mb-2">Sales Master</h1>
            <p className="text-xs font-bold uppercase opacity-50 tracking-widest">Retail Management System</p>
          </div>
          <form onSubmit={handleAuth} className="space-y-4">
            
            {!isLoginView && (
                <div className={`flex items-center px-4 py-3 rounded-xl border transition-all focus-within:ring-2 focus-within:ring-blue-500 ${darkMode ? 'bg-slate-900 border-slate-700' : 'bg-gray-50 border-gray-200'}`}>
                    <User size={18} className="opacity-50 mr-3" />
                    <input 
                        type="text" 
                        required 
                        autoComplete="off" 
                        className="bg-transparent outline-none flex-1 text-sm font-medium" 
                        placeholder="Full Name" 
                        value={authName} 
                        onChange={e => setAuthName(e.target.value)} 
                    />
                </div>
            )}

            <div className={`flex items-center px-4 py-3 rounded-xl border transition-all focus-within:ring-2 focus-within:ring-blue-500 ${darkMode ? 'bg-slate-900 border-slate-700' : 'bg-gray-50 border-gray-200'}`}>
               <Mail size={18} className="opacity-50 mr-3" />
               <input 
                   type="email" 
                   required 
                   autoComplete="off" 
                   className="bg-transparent outline-none flex-1 text-sm font-medium" 
                   placeholder="Email" 
                   value={authEmail} 
                   onChange={e => setAuthEmail(e.target.value)} 
                />
            </div>
            <div className={`flex items-center px-4 py-3 rounded-xl border transition-all focus-within:ring-2 focus-within:ring-blue-500 ${darkMode ? 'bg-slate-900 border-slate-700' : 'bg-gray-50 border-gray-200'}`}>
               <Lock size={18} className="opacity-50 mr-3" />
               <input 
                   type={showPassword?"text":"password"} 
                   required 
                   autoComplete="new-password" 
                   className="bg-transparent outline-none flex-1 text-sm font-medium" 
                   placeholder="Password" 
                   value={authPassword} 
                   onChange={e => setAuthPassword(e.target.value)} 
                />
               <button type="button" onClick={() => setShowPassword(!showPassword)}><Eye size={18} className="opacity-50 hover:opacity-100 transition-opacity"/></button>
            </div>
            {!isLoginView && (
                <div className={`flex items-center px-4 py-3 rounded-xl border transition-all focus-within:ring-2 focus-within:ring-blue-500 ${darkMode ? 'bg-slate-900 border-slate-700' : 'bg-gray-50 border-gray-200'}`}>
                    <ShieldCheck size={18} className="opacity-50 mr-3 text-red-500" />
                    <input type="text" required autoComplete="off" className="bg-transparent outline-none flex-1 text-sm font-medium" placeholder="Admin Access Code" value={authCode} onChange={e => setAuthCode(e.target.value)} />
                </div>
            )}

            <button type="submit" disabled={isSubmitting} className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-bold shadow-lg shadow-blue-500/20 disabled:opacity-50 transition-all active:scale-95">
               {isSubmitting ? <Loader2 className="animate-spin mx-auto"/> : (isLoginView ? "Login" : "Sign Up")}
            </button>
          </form>
          <button onClick={() => setIsLoginView(!isLoginView)} className="w-full text-center mt-6 text-xs font-bold text-blue-500 hover:text-blue-600 hover:underline">{isLoginView ? "Create New Account" : "Back to Login"}</button>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex h-dvh font-sans overflow-hidden ${darkMode ? 'bg-slate-900 text-slate-100' : 'bg-gray-50/50 text-slate-800'}`}>
      <ToastContainer toasts={toasts} removeToast={removeToast} />
      <ConfirmationModal isOpen={modalConfig.isOpen} onClose={() => setModalConfig({...modalConfig, isOpen: false})} onConfirm={handleConfirmAction} title={modalConfig.title} message={modalConfig.message} isDanger={modalConfig.isDanger} darkMode={darkMode} />
      
      {/* Sidebar */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-30 md:hidden" onClick={() => setMobileMenuOpen(false)}></div>
      )}
      
      <div className={`fixed inset-y-0 left-0 w-64 transform ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} md:relative md:translate-x-0 transition-transform duration-300 z-40 flex flex-col shadow-2xl ${darkMode ? 'bg-slate-950' : 'bg-slate-900 text-white'}`}>
        <div onClick={() => { setActiveTab('dashboard'); setMobileMenuOpen(false); }} className="p-6 border-b border-slate-800 flex items-center gap-3 cursor-pointer">
           <div className="bg-blue-600 p-2 rounded-lg"><Shirt className="text-white" size={20}/></div>
           <div>
               <h1 className="text-xl font-bold text-white tracking-tight">Sales Master</h1>
               <div className="flex items-center gap-2 mt-1">
                   <UserCircle size={12} className="text-slate-400"/>
                   <p className="text-[10px] md:text-xs md:text-white md:font-bold text-slate-300 font-mono uppercase tracking-wide">
                       {userProfileName || 'User'}
                   </p>
               </div>
           </div>
           <button onClick={(e) => { e.stopPropagation(); setMobileMenuOpen(false); }} className="md:hidden text-white ml-auto hover:bg-white/10 rounded-full p-1"><X/></button>
        </div>
        <nav className="flex-1 p-4 space-y-2">
           {[{id:'dashboard', icon:LayoutDashboard, label:'Dashboard'}, {id:'inventory', icon:Shirt, label:'Inventory'}, {id:'sales', icon:ShoppingCart, label:'Sales'}, {id:'customers', icon:Users, label:'Customers'}, {id:'mama', icon:Handshake, label:'Partner Share'}, {id:'insights', icon:BarChart3, label:'Insights'}, {id:'trash', icon:Archive, label:'Deleted Customers'}].map(i => (
             <button key={i.id} onClick={() => {setActiveTab(i.id); setMobileMenuOpen(false)}} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ease-out hover:translate-x-2 ${activeTab === i.id ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20 scale-[1.02]' : 'hover:bg-white/5 text-slate-400 hover:text-white'}`}>
               <i.icon size={20} /> <span className="capitalize font-medium">{i.label}</span>
             </button>
           ))}
        </nav>
        <div className="p-4 border-t border-slate-800 space-y-2">
           <button onClick={() => setDarkMode(!darkMode)} className="w-full flex justify-center gap-2 py-2 rounded-xl bg-slate-800 text-white text-xs font-bold hover:bg-slate-700 transition-colors">{darkMode ? <Sun size={14}/> : <Moon size={14}/>} {darkMode ? "Light Mode" : "Dark Mode"}</button>
           <button onClick={openLogoutModal} className="w-full flex justify-center gap-2 py-2 rounded-xl bg-red-500/10 text-red-500 text-xs font-bold hover:bg-red-500/20 transition-colors"><LogOut size={14}/> Logout</button>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
         {/* Mobile Header */}
         <div className={`md:hidden flex shrink-0 justify-between items-center p-4 border-b ${darkMode ? 'border-slate-800' : 'bg-white border-slate-200'}`}>
            <button onClick={() => setMobileMenuOpen(true)} className="p-2 bg-blue-600 text-white rounded-lg shadow-lg active:scale-95 transition-transform"><Menu/></button>
            <h2 className="font-bold uppercase tracking-wider text-sm text-slate-500">{activeTab === 'mama' ? "PARTNER SHARE" : activeTab}</h2><div className="w-8"></div>
         </div>

         {/* MAIN CONTENT WRAPPER WITH ANIMATION */}
         <div key={activeTab} className="flex-1 overflow-y-auto p-4 md:p-8 pb-24 scroll-smooth animate-fade-in">

         {/* DASHBOARD */}
         {activeTab === 'dashboard' && (
           <div className="space-y-6">
             {/* FIX: Use sm:grid-cols-2 to force single column on very small phones if needed, or 2 cols on mobile */}
             <div className="grid grid-cols-2 md:grid-cols-5 gap-3 sm:gap-4"> 
                <Card darkMode={darkMode} title="Capital" value={formatCurrency(stats.capital)} icon={Layers} colorClass="bg-blue-600/20 text-blue-500" iconBgClass="bg-blue-50" iconTextClass="text-blue-600" />
                <Card darkMode={darkMode} title="Profit" value={formatCurrency(stats.profit)} icon={TrendingUp} colorClass="bg-emerald-600/20 text-emerald-500" iconBgClass="bg-emerald-50" iconTextClass="text-emerald-600" />
                <Card darkMode={darkMode} title="Pending" value={formatCurrency(stats.receivable)} icon={CreditCard} colorClass="bg-amber-600/20 text-amber-500" iconBgClass="bg-amber-50" iconTextClass="text-amber-600" />
                <Card darkMode={darkMode} title="Received" value={formatCurrency(stats.received)} icon={Wallet} colorClass="bg-teal-600/20 text-teal-500" iconBgClass="bg-teal-50" iconTextClass="text-teal-600" />
                <Card darkMode={darkMode} title="Stock" value={formatCurrency(stats.stock)} icon={Package} colorClass="bg-purple-600/20 text-purple-500" iconBgClass="bg-purple-50" iconTextClass="text-purple-600" />
             </div>
             
             <div className={`p-4 sm:p-6 rounded-2xl border shadow-sm ${darkMode?'bg-slate-800 border-slate-700':'bg-white border-slate-200 shadow-slate-200/50'}`}>
                <h3 className={`font-bold mb-4 sm:mb-6 text-lg tracking-tight ${darkMode ? 'text-white' : 'text-gray-900'}`}>Recent Sales</h3>
                <div className="space-y-2">
                   {sales.slice(0,5).map(s => (
                     <div key={s.id} className={`flex justify-between items-center p-3 sm:p-4 rounded-xl transition-all duration-200 ${darkMode?'bg-slate-700/30 hover:bg-slate-700/50':'bg-gray-50 hover:bg-white hover:shadow-md border border-transparent hover:border-gray-100'}`}>
                       <div><p className={`font-bold text-sm ${darkMode ? 'text-white' : 'text-gray-900'}`}>{s.customerName}</p><p className="text-xs opacity-50 font-mono">{s.suitId}</p></div>
                       <div className="text-right"><p className="font-bold text-emerald-500 text-sm">+{formatCurrency(s.salePrice)}</p></div>
                     </div>
                   ))}
                </div>
             </div>
           </div>
         )}

         {/* INVENTORY - FIXED RESPONSIVENESS (CARDS ON MOBILE) */}
         {activeTab === 'inventory' && (
           <div className="flex flex-col lg:flex-row gap-6 h-full overflow-hidden">
             <div className={`p-6 rounded-2xl shadow-sm border h-fit w-full lg:w-80 shrink-0 ${darkMode?'bg-slate-800 border-slate-700':'bg-white border-slate-200 shadow-slate-200/50'}`}>
                <h3 className={`font-bold mb-6 flex gap-2 items-center text-lg ${darkMode ? 'text-white' : 'text-gray-900'}`}><Plus size={20} className="text-blue-500"/> Add Stock</h3>
                <form onSubmit={handleAddDress} className="space-y-4">
                  <div><label className="text-xs font-bold opacity-50 uppercase tracking-wider mb-1 block">IDs (Comma/Space)</label><textarea ref={idsInputRef} required className={`w-full p-3 border rounded-xl bg-transparent outline-none text-sm focus:ring-2 focus:ring-blue-500 transition-all resize-none overflow-hidden ${darkMode?'border-slate-600 focus:bg-slate-900':'border-slate-200 focus:bg-gray-50'}`} rows="1" value={dressForm.suitIds} onChange={e=>setDressForm({...dressForm, suitIds:e.target.value})} placeholder="A1, A2 A3..."/></div>
                  <div><label className="text-xs font-bold opacity-50 uppercase tracking-wider mb-1 block">Brand</label><input required className={`w-full p-3 border rounded-xl bg-transparent outline-none text-sm focus:ring-2 focus:ring-blue-500 transition-all ${darkMode?'border-slate-600 focus:bg-slate-900':'border-slate-200 focus:bg-gray-50'}`} value={dressForm.brand} onChange={e=>setDressForm({...dressForm, brand:e.target.value})}/></div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><label className="text-xs font-bold opacity-50 uppercase tracking-wider mb-1 block">Cost</label><input inputMode="numeric" type="number" onKeyDown={handleNumberInput} className={`w-full p-3 border rounded-xl bg-transparent outline-none text-sm focus:ring-2 focus:ring-blue-500 transition-all ${darkMode?'border-slate-600 focus:bg-slate-900':'border-slate-200 focus:bg-gray-50'}`} value={dressForm.orgPrice} onChange={e=>setDressForm({...dressForm, orgPrice:e.target.value})}/></div>
                    <div><label className="text-xs font-bold opacity-50 uppercase tracking-wider mb-1 block">Sale</label><input inputMode="numeric" type="number" onKeyDown={handleNumberInput} className={`w-full p-3 border rounded-xl bg-transparent outline-none text-sm focus:ring-2 focus:ring-blue-500 transition-all ${darkMode?'border-slate-600 focus:bg-slate-900':'border-slate-200 focus:bg-gray-50'}`} value={dressForm.salePrice} onChange={e=>setDressForm({...dressForm, salePrice:e.target.value})}/></div>
                  </div>
                  <button disabled={isSubmitting} className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold text-sm shadow-lg shadow-blue-500/30 hover:bg-blue-700 transition-all active:scale-95">Add Stock</button>
                </form>
             </div>
             
             <div className="flex-1 flex flex-col overflow-hidden min-h-0">
                <div className={`rounded-2xl border flex flex-col h-full shadow-sm ${darkMode?'bg-slate-800 border-slate-700':'bg-white border-slate-200 shadow-slate-200/50'}`}>
                   <div className={`p-4 border-b flex shrink-0 gap-3 items-center ${darkMode ? 'border-slate-700' : 'border-slate-100'}`}><Search size={18} className="opacity-50"/><input ref={inventorySearchInput} className="bg-transparent outline-none flex-1 text-sm font-medium" placeholder="Search stock..." value={inventorySearch} onChange={e=>setInventorySearch(e.target.value)}/></div>
                   <div className={`px-6 py-3 shrink-0 text-xs font-bold uppercase tracking-wider flex justify-between ${darkMode ? 'bg-slate-900/50 text-slate-400' : 'bg-gray-50 text-slate-500'}`}><span>{filteredInv.length} Items</span><span>Val: {formatCurrency(filteredInventoryValue)}</span></div>
                   
                   <div className="flex-1 overflow-auto">
                      {/* MOBILE VIEW: CARD LIST */}
                      <div className="md:hidden divide-y divide-slate-200/50">
                          {filteredInv.length === 0 ? (
                              <div className="p-8 text-center opacity-40 text-sm">No items found.</div>
                          ) : (
                              filteredInv.map(i => (
                                  <div key={i.id} className={`p-4 flex flex-col gap-2 ${darkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-white'}`}>
                                      <div className="flex justify-between items-start">
                                          <div>
                                              <span className="font-mono text-blue-500 font-bold block">{i.suitId}</span>
                                              <span className={`text-sm ${darkMode ? 'text-slate-300' : 'text-gray-700'}`}>{i.brand}</span>
                                          </div>
                                          <div className="text-right">
                                              <span className={`block font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{i.salePrice}</span>
                                              <span className="text-xs opacity-50 block">Cost: {i.orgPrice}</span>
                                          </div>
                                      </div>
                                      <div className="flex justify-between items-center mt-2">
                                          {i.qty>0?<span className="text-[10px] bg-emerald-500/10 text-emerald-500 px-2 py-1 rounded-full font-bold">Stock</span>:<span className="text-[10px] bg-rose-500/10 text-rose-500 px-2 py-1 rounded-full font-bold">Sold</span>}
                                          <div className="flex gap-2">
                                              {i.qty>0 && <>
                                                  <button onClick={()=>setEditingItem(i)} className="p-2 bg-blue-500/10 text-blue-500 rounded"><Edit size={14}/></button>
                                                  <button onClick={()=>openDeleteModal(i.id, 'inventory')} className="p-2 bg-red-500/10 text-red-500 rounded"><Trash2 size={14}/></button>
                                              </>}
                                          </div>
                                      </div>
                                  </div>
                              ))
                          )}
                      </div>

                      {/* DESKTOP VIEW: TABLE */}
                      <table className="hidden md:table w-full text-left text-sm table-fixed">
                         <thead className={`text-xs uppercase font-bold sticky top-0 z-10 backdrop-blur-md ${darkMode ? 'bg-slate-800/90 text-slate-400' : 'bg-white/90 text-gray-500 border-b border-gray-100'}`}>
                           <tr><th className="p-4 w-1/6 whitespace-nowrap">ID</th><th className="w-1/4 whitespace-nowrap">Brand</th><th className="text-right w-1/6 whitespace-nowrap">Cost</th><th className="text-right w-1/6 whitespace-nowrap">Sale</th><th className="text-center w-1/6 whitespace-nowrap">Status</th><th className="text-center w-1/6 whitespace-nowrap">Act</th></tr>
                         </thead>
                         <tbody className="divide-y divide-slate-200/10">
                            {filteredInv.length === 0 ? (
                              <tr><td colSpan="6" className="p-12 text-center opacity-40 text-sm">No items found.</td></tr>
                            ) : (
                               filteredInv.map(i => (
                                  <tr key={i.id} className={`transition-colors ${darkMode ? 'hover:bg-slate-700/50' : 'hover:bg-blue-50/50 border-b border-gray-50'}`}>
                                     <td className="p-4 font-mono text-blue-500 font-bold truncate">{i.suitId}</td><td className={`truncate font-medium ${darkMode ? 'text-slate-300' : 'text-gray-700'}`}>{i.brand}</td><td className="text-right opacity-60 font-medium">{i.orgPrice}</td><td className={`text-right font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{i.salePrice}</td>
                                     <td className="text-center">{i.qty>0?<span className="text-[10px] bg-emerald-500/10 text-emerald-500 px-2 py-1 rounded-full font-bold">Stock</span>:<span className="text-[10px] bg-rose-500/10 text-rose-500 px-2 py-1 rounded-full font-bold">Sold</span>}</td>
                                     <td className="text-center flex justify-center gap-2 py-4">{i.qty>0 && <><button onClick={()=>setEditingItem(i)} className="hover:text-blue-500 p-2 hover:bg-blue-500/10 rounded transition-colors"><Edit size={16}/></button><button onClick={()=>openDeleteModal(i.id, 'inventory')} className="hover:text-red-500 p-2 hover:bg-red-500/10 rounded transition-colors"><Trash2 size={16}/></button></>}</td>
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
            <div className="max-w-2xl mx-auto">
               <div className={`p-8 rounded-3xl shadow-xl border ${darkMode?'bg-slate-800 border-slate-700':'bg-white border-slate-200 shadow-slate-200/60'}`}>
                  <h2 className={`text-xl font-black text-center mb-8 tracking-tight ${darkMode ? 'text-white' : 'text-gray-900'}`}>POS TERMINAL</h2>
                  
                  <div className="relative mb-8">
                     <label className="text-xs font-bold opacity-50 block mb-2 uppercase tracking-wider">Search Product</label>
                     <div className={`flex items-center p-4 border rounded-2xl transition-all focus-within:ring-2 focus-within:ring-blue-500 ${darkMode?'border-slate-600 bg-slate-900':'border-slate-200 bg-white'}`}>
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
                       <div className={`absolute w-full mt-2 rounded-2xl border shadow-2xl z-20 overflow-hidden ${darkMode?'bg-slate-800 border-slate-600':'bg-white border-slate-100'}`}>
                          {availableItems.map(item => (
                            <div key={item.id} onClick={() => addToCart(item)} className={`p-4 flex justify-between items-center cursor-pointer hover:bg-blue-500 hover:text-white transition-colors border-b last:border-0 ${darkMode?'border-slate-700':'border-slate-50'}`}>
                               <span className="font-bold font-mono">{item.suitId}</span>
                               <span className="text-sm opacity-90">{item.brand}</span>
                               <span className="text-sm font-bold">{formatCurrency(item.salePrice)}</span>
                            </div>
                          ))}
                       </div>
                     )}
                  </div>

                  <div className={`mb-8 rounded-2xl border overflow-hidden ${darkMode?'border-slate-700 bg-slate-900/30':'border-slate-200 bg-gray-50'}`}>
                     <div className={`p-4 border-b text-xs font-bold uppercase flex justify-between ${darkMode ? 'bg-black/20 text-slate-400 border-slate-700' : 'bg-gray-100 text-gray-500 border-gray-200'}`}>
                        <span>Selected Items ({cart.length})</span>
                        <span>Total</span>
                     </div>
                     {cart.length === 0 ? (
                       <div className="p-10 text-center opacity-40 text-sm font-medium">Cart is empty</div>
                     ) : (
                       <div className={`divide-y ${darkMode ? 'divide-slate-700' : 'divide-slate-200'}`}>
                          {cart.map(item => (
                            <div key={item.id} className="p-4 flex justify-between items-center animate-slide-in">
                               <div>
                                  <p className={`font-bold text-sm ${darkMode ? 'text-white' : 'text-gray-800'}`}>{item.suitId}</p>
                                  <p className="text-xs opacity-60">{item.brand}</p>
                               </div>
                               <div className="flex items-center gap-4">
                                  <span className={`font-bold text-sm ${darkMode ? 'text-white' : 'text-gray-900'}`}>{formatCurrency(item.salePrice)}</span>
                                  <button onClick={() => removeFromCart(item.id)} className="text-red-500 hover:bg-red-500/10 p-2 rounded-full transition-colors"><MinusCircle size={18}/></button>
                               </div>
                            </div>
                          ))}
                       </div>
                     )}
                     <div className={`p-5 border-t flex justify-between items-center font-black text-xl ${darkMode?'bg-slate-800 border-slate-700':'bg-white border-slate-200'}`}>
                        <span className={darkMode ? 'text-white' : 'text-gray-900'}>Total Bill</span>
                        <span className="text-emerald-500">{formatCurrency(cart.reduce((s,i)=>s+i.salePrice,0))}</span>
                     </div>
                  </div>

                  <div className="space-y-5">
                     <div><label className="text-xs font-bold opacity-50 uppercase tracking-wider mb-2 block">Customer Name</label>
                     
                     <div className="relative">
                        <input
                           type="text"
                           required
                           className={`w-full p-4 border rounded-xl bg-transparent outline-none font-medium focus:ring-2 focus:ring-blue-500 transition-all ${darkMode?'border-slate-600 focus:bg-slate-900':'border-slate-200 focus:bg-white'}`}
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
                                    onMouseDown={() => {
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
                     <div><label className="text-xs font-bold opacity-50 uppercase tracking-wider mb-2 block">Paid Amount</label><input inputMode="numeric" type="number" onKeyDown={handleNumberInput} className={`w-full p-4 border rounded-xl bg-transparent outline-none font-medium focus:ring-2 focus:ring-blue-500 transition-all ${darkMode?'border-slate-600 focus:bg-slate-900':'border-slate-200 focus:bg-white'}`} value={saleForm.paidAmount} onChange={e=>setSaleForm({...saleForm, paidAmount:e.target.value})}/></div>
                     <button onClick={handleProcessSale} disabled={isSubmitting || cart.length===0} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-4 rounded-xl font-bold shadow-lg shadow-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95">CONFIRM SALE</button>
                  </div>
               </div>
            </div>
         )}

         {/* CUSTOMERS - FIXED RESPONSIVENESS (1 COL Mobile, 3 Cols Desktop) */}
         {activeTab === 'customers' && (
            <div className="flex flex-col h-full overflow-hidden gap-6">
               <div className={`shrink-0 p-6 rounded-2xl shadow-sm border flex flex-col md:flex-row gap-6 items-center ${darkMode?'bg-slate-800 border-slate-700':'bg-white border-slate-200 shadow-slate-200/50'}`}>
                  <div className="flex-1 w-full">
                     <h3 className={`font-bold mb-3 text-lg flex items-center gap-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}><Wallet size={20} className="text-blue-500"/> Quick Payment</h3>
                     <div className="flex gap-3 items-start flex-col sm:flex-row">
                        <div className="relative flex-1 w-full">
                           <input
                              type="text"
                              placeholder="Search Customer..."
                              className={`w-full p-3 rounded-xl bg-transparent border text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${darkMode ? 'border-slate-600 focus:bg-slate-900' : 'border-slate-200 focus:bg-gray-50'}`}
                              value={paymentCustomerSearch}
                              onChange={(e) => {
                                 setPaymentCustomerSearch(e.target.value);
                                 setShowCustomerSuggestions(true);
                                 setPaymentForm(prev => ({ ...prev, customerId: '' })); 
                              }}
                              onFocus={() => setShowCustomerSuggestions(true)}
                              onBlur={() => setTimeout(() => setShowCustomerSuggestions(false), 200)}
                           />
                           {showCustomerSuggestions && paymentCustomerSearch && paymentCustomerMatches.length > 0 && (
                              <div className={`absolute top-full left-0 w-full mt-1 rounded-xl border shadow-xl z-50 overflow-hidden ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100'}`}>
                                 {paymentCustomerMatches.map(c => (
                                    <div
                                       key={c.id}
                                       onMouseDown={() => selectPaymentCustomer(c)}
                                       className={`p-3 text-sm cursor-pointer hover:bg-blue-500 hover:text-white transition-colors ${darkMode ? 'border-slate-700' : 'border-slate-100'} border-b last:border-0`}
                                    >
                                       {c.name}
                                    </div>
                                 ))}
                              </div>
                           )}
                        </div>
                        
                        <div className="flex gap-2 w-full sm:w-auto">
                            <input inputMode="numeric" type="number" onKeyDown={handleNumberInput} placeholder="Amount" className={`p-3 rounded-xl bg-transparent border w-full sm:w-32 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-colors ${darkMode ? 'border-slate-600 focus:bg-slate-900' : 'border-slate-200 focus:bg-gray-50'}`} value={paymentForm.amount} onChange={e=>setPaymentForm({...paymentForm, amount:e.target.value})}/>
                            <button onClick={handleAddPayment} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl text-sm font-bold shadow-lg shadow-blue-500/30 transition-all active:scale-95 flex-1">Add</button>
                            <button onClick={handleRefund} className="bg-rose-600 hover:bg-rose-700 text-white px-4 py-3 rounded-xl text-sm font-bold shadow-lg shadow-rose-500/30 transition-all active:scale-95" title="Refund Amount"><RefreshCcw size={20}/></button>
                        </div>
                     </div>
                  </div>
               </div>
               
               <div className="flex-1 overflow-y-auto">
                  {/* FIX: Changed grid-cols-1 to grid-cols-1 md:grid-cols-2 lg:grid-cols-3 for better fit */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pb-4">
                     {filteredCust.map(c => {
                        const bal = (c.totalBill||0)-(c.totalPaid||0);
                        return (
                           <div key={c.id} onClick={() => {setViewingCustomer(c); setCustomerModalTab('payments');}} className={`p-5 rounded-2xl border shadow-sm h-fit cursor-pointer transition-all duration-300 ease-out hover:scale-[1.02] hover:shadow-lg ${darkMode?'bg-slate-800 border-slate-700 hover:border-blue-500/50':'bg-white border-slate-200 shadow-slate-200/50 hover:border-blue-300'}`}>
                              <div className="flex justify-between mb-3"><h4 className={`font-bold text-lg truncate ${darkMode?'text-white':'text-gray-900'}`}>{c.name}</h4><span className="text-xs bg-blue-500/10 text-blue-500 px-3 py-1 rounded-full font-bold">{formatCurrency(c.totalBill||0)}</span></div>
                              <div className="text-sm space-y-2 opacity-80"><div className="flex justify-between"><span>Rem:</span><b>{formatCurrency(bal)}</b></div><div className="flex justify-between"><span>Paid:</span><b className="text-emerald-500">{formatCurrency(c.totalPaid||0)}</b></div></div>
                              <div className={`h-px my-3 ${darkMode ? 'bg-slate-700' : 'bg-slate-100'}`}></div>
                              <div className="flex justify-between items-center text-xs opacity-60">
                                 <span className="flex items-center gap-1"><CalendarCheck size={12}/> Last:</span>
                                 <span>{c.lastPaymentDate ? new Date(c.lastPaymentDate.seconds*1000).toLocaleDateString() : 'N/A'}</span>
                              </div>
                              {bal <= 0 && (
                                <button onClick={(e)=>{e.stopPropagation(); openDeleteModal(c.id, 'customer')}} className="w-full mt-4 text-xs text-red-500 border border-red-500/20 py-2 rounded-lg hover:bg-red-500/10 transition-colors">Remove Customer</button>
                              )}
                           </div>
                        )
                     })}
                  </div>
               </div>
            </div>
         )}

         {/* --- NEW DELETED CUSTOMERS TAB --- */}
         {activeTab === 'trash' && (
            <div className="flex-1 flex flex-col h-full overflow-hidden">
                <div className="p-6">
                    <h2 className={`text-2xl font-black mb-6 flex items-center gap-3 ${darkMode ? 'text-white' : 'text-gray-900'}`}><Archive className="text-red-500"/> Deleted Customers</h2>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-20">
                        {deletedCust.map(c => (
                            <div 
                                key={c.id} 
                                className={`p-5 rounded-2xl border opacity-75 hover:opacity-100 transition-all ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200 shadow-sm'}`}
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <p className={`font-bold text-lg ${darkMode ? 'text-white' : 'text-gray-800'}`}>{c.name}</p>
                                    <span className="text-xs bg-red-500/10 text-red-500 px-2 py-1 rounded-full font-bold">Deleted</span>
                                </div>
                                <div className="text-sm space-y-2 opacity-60 mb-4">
                                    <div className="flex justify-between"><span>Balance:</span><b>{formatCurrency((c.totalBill||0)-(c.totalPaid||0))}</b></div>
                                </div>
                                <div className="flex gap-2">
                                     <button onClick={() => {setViewingCustomer(c); setCustomerModalTab('payments');}} className="flex-1 py-2 bg-slate-500/10 text-slate-500 text-xs font-bold rounded-lg hover:bg-slate-500 hover:text-white transition-colors">View Details</button>
                                     <button onClick={() => openRestoreModal(c.id)} className="flex-1 py-2 bg-blue-500/10 text-blue-500 text-xs font-bold rounded-lg hover:bg-blue-500 hover:text-white transition-colors flex items-center justify-center gap-1"><RotateCcw size={12}/> Restore</button>
                                </div>
                            </div>
                        ))}
                        {deletedCust.length === 0 && (
                            <div className="col-span-full text-center py-20 opacity-40 border-2 border-dashed rounded-xl">
                                <Archive size={40} className="mx-auto mb-4"/>
                                <p>Trash is empty.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
         )}


         {/* MAMA (PARTNER SHARE) - FIXED RESPONSIVENESS */}
         {activeTab === 'mama' && (
            <div className="space-y-6 h-full flex flex-col">
               <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 shrink-0">
                  <div className={`p-5 text-center rounded-2xl border shadow-sm ${darkMode?'bg-slate-800 border-slate-700':'bg-white border-slate-200 shadow-slate-200/50'}`}><p className="text-xs font-bold opacity-50 uppercase mb-1">Total</p><p className="text-xl font-black text-blue-500">{formatCurrency(stats.mamaTotal)}</p></div>
                  <div className={`p-5 text-center rounded-2xl border shadow-sm ${darkMode?'bg-slate-800 border-slate-700':'bg-white border-slate-200 shadow-slate-200/50'}`}><p className="text-xs font-bold opacity-50 uppercase mb-1">Pending</p><p className="text-xl font-black text-rose-500">{formatCurrency(stats.mamaPending)}</p></div>
                  <div className={`p-5 text-center rounded-2xl border shadow-sm ${darkMode?'bg-slate-800 border-slate-700':'bg-white border-slate-200 shadow-slate-200/50'}`}><p className="text-xs font-bold opacity-50 uppercase mb-1">Paid</p><p className="text-xl font-black text-emerald-500">{formatCurrency(stats.mamaPaid)}</p></div>
               </div>
               
               <div className="flex gap-3 shrink-0 overflow-x-auto">
                  <button 
                     onClick={() => { setMamaTab('pending'); }}
                     className={`flex-1 min-w-fit px-4 py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all active:scale-95 ${mamaTab === 'pending' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' : 'bg-gray-100 text-gray-500 dark:bg-slate-800 dark:text-slate-400 hover:bg-gray-200 dark:hover:bg-slate-700'}`}
                  >
                     <AlertTriangle size={18} /> <span className="whitespace-nowrap">Pending</span>
                  </button>
                  <button 
                     onClick={() => { setMamaTab('paid'); }}
                     className={`flex-1 min-w-fit px-4 py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all active:scale-95 ${mamaTab === 'paid' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/30' : 'bg-gray-100 text-gray-500 dark:bg-slate-800 dark:text-slate-400 hover:bg-gray-200 dark:hover:bg-slate-700'}`}
                  >
                     <History size={18} /> <span className="whitespace-nowrap">History</span>
                  </button>
               </div>
               
               <div className={`rounded-2xl border flex flex-col flex-1 overflow-hidden shadow-sm ${darkMode?'bg-slate-800 border-slate-700':'bg-white border-slate-200 shadow-slate-200/50'}`}>
                  
                  <div className={`p-5 border-b flex shrink-0 justify-between items-center ${darkMode ? 'border-slate-700' : 'border-slate-100'}`}>
                      <h3 className={`font-bold flex gap-2 items-center text-lg ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                          {mamaTab === 'pending' ? <><AlertTriangle size={20} className="text-rose-500"/> Pending</> : <><History size={20} className="text-emerald-500"/> Paid</>}
                      </h3>
                      {mamaTab === 'pending' && selectedMamaSales.length > 0 && <button onClick={()=>handleMarkMamaPaid(true)} className="bg-rose-500 text-white px-5 py-2 rounded-xl text-xs font-bold shadow-lg shadow-rose-500/30 transition-all active:scale-95">Pay ({selectedMamaSales.length})</button>}
                  </div>

                  <div className="flex-1 overflow-auto">
                      {/* RESPONSIVE: CARD VIEW ON MOBILE, TABLE ON DESKTOP */}
                      <div className="md:hidden divide-y divide-slate-200/50">
                          {mamaTab === 'pending' ? (
                             sortedPendingMamaSales.length === 0 ? <div className="p-8 text-center opacity-40 text-sm">No pending payments</div> :
                             sortedPendingMamaSales.map(s => (
                                 <div key={s.id} onClick={() => toggleMamaSelection(s.id)} className={`p-4 flex gap-3 ${selectedMamaSales.includes(s.id) ? 'bg-rose-500/10' : ''}`}>
                                     <div className="pt-1"><input type="checkbox" checked={selectedMamaSales.includes(s.id)} readOnly className="w-5 h-5 accent-rose-500"/></div>
                                     <div className="flex-1">
                                         <div className="flex justify-between">
                                             <span className={`font-medium ${darkMode ? 'text-slate-200' : 'text-gray-700'}`}>{s.suitId}</span>
                                             <span className="font-bold text-rose-500">{s.mamaShare}</span>
                                         </div>
                                         <span className="text-xs opacity-50 block">{s.brand}</span>
                                     </div>
                                 </div>
                             ))
                          ) : (
                             sortedPaidMamaSales.length === 0 ? <div className="p-8 text-center opacity-40 text-sm">No history</div> :
                             sortedPaidMamaSales.map(s => (
                                 <div key={s.id} className="p-4 flex justify-between items-center">
                                     <div>
                                         <span className={`block font-medium ${darkMode ? 'text-slate-200' : 'text-gray-700'}`}>{s.suitId}</span>
                                         <span className="text-xs opacity-50 block">{s.mamaPaidAt ? new Date(s.mamaPaidAt.seconds * 1000).toLocaleDateString() : '-'}</span>
                                     </div>
                                     <span className="font-bold text-emerald-500">{s.mamaShare}</span>
                                 </div>
                             ))
                          )}
                      </div>

                      <table className="hidden md:table w-full text-left text-sm table-fixed">
                         <thead className={`text-xs uppercase font-bold sticky top-0 z-10 backdrop-blur-md ${darkMode ? 'bg-slate-800/90 text-slate-400' : 'bg-white/90 text-gray-500 border-b border-gray-100'} shadow-sm`}>
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
                            {mamaTab === 'pending' ? (
                             sortedPendingMamaSales.length === 0 ? (
                               <tr><td colSpan="4" className="p-12 text-center opacity-40 text-sm border-2 border-dashed rounded-xl m-4">No pending payments</td></tr>
                             ) : (
                               sortedPendingMamaSales.map(s => (
                                  <tr key={s.id} className={`cursor-pointer transition-colors ${selectedMamaSales.includes(s.id) ? 'bg-rose-500/10' : (darkMode ? 'hover:bg-slate-700/30' : 'hover:bg-gray-50')}`} onClick={() => toggleMamaSelection(s.id)}>
                                     <td className="p-4 text-center"><input type="checkbox" checked={selectedMamaSales.includes(s.id)} readOnly className="w-4 h-4 accent-rose-500 pointer-events-none"/></td>
                                     <td className={`truncate font-medium ${darkMode ? 'text-slate-200' : 'text-gray-700'}`}>{s.suitId} <span className="opacity-50 text-xs font-normal ml-2">({s.brand})</span></td>
                                     <td className="text-right font-bold text-rose-500 p-4">{s.mamaShare}</td>
                                  </tr>
                               ))
                             )
                            ) : (
                             sortedPaidMamaSales.length === 0 ? (
                               <tr><td colSpan="4" className="p-12 text-center opacity-40 text-sm border-2 border-dashed rounded-xl m-4">No payment history</td></tr>
                             ) : (
                               sortedPaidMamaSales.map(s => (
                                  <tr key={s.id} className={`transition-colors ${darkMode ? 'hover:bg-slate-700/30' : 'hover:bg-gray-50'}`}>
                                     <td className={`p-4 truncate font-medium ${darkMode ? 'text-slate-200' : 'text-gray-700'}`}>{s.suitId} <span className="opacity-50 text-xs font-normal ml-2">({s.brand})</span></td>
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

         {/* --- INSIGHTS TAB --- */}
         {activeTab === 'insights' && (
             <div className="flex-1 flex flex-col h-full overflow-hidden">
                <div className="p-6">
                    <h2 className={`text-2xl font-black mb-6 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Business Insights</h2>
                    
                    {/* WIDGETS */}
                    {!insightView && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div onClick={() => setInsightView('risk')} className={`p-8 rounded-3xl border cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${darkMode ? 'bg-slate-800 border-slate-700 hover:border-red-500' : 'bg-white border-slate-200 shadow-slate-200/50 hover:border-red-400'}`}>
                                <div className="flex justify-between items-start mb-6">
                                    <div className="p-4 bg-red-500/10 text-red-500 rounded-2xl"><AlertCircle size={32}/></div>
                                    <div className={`text-4xl font-black ${darkMode ? 'text-white' : 'text-gray-900'}`}>{riskCustomers.length}</div>
                                </div>
                                <h3 className={`font-bold text-xl mb-2 ${darkMode ? 'text-white' : 'text-gray-800'}`}>Payment Risk</h3>
                                <p className="text-sm opacity-60">Customers with pending balance not paid in 30+ days.</p>
                            </div>

                            <div onClick={() => setInsightView('highVol')} className={`p-8 rounded-3xl border cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${darkMode ? 'bg-slate-800 border-slate-700 hover:border-amber-500' : 'bg-white border-slate-200 shadow-slate-200/50 hover:border-amber-400'}`}>
                                <div className="flex justify-between items-start mb-6">
                                    <div className="p-4 bg-amber-500/10 text-amber-500 rounded-2xl"><Trophy size={32}/></div>
                                    <div className={`text-4xl font-black ${darkMode ? 'text-white' : 'text-gray-900'}`}>{highVolumeCustomers.length}</div>
                                </div>
                                <h3 className={`font-bold text-xl mb-2 ${darkMode ? 'text-white' : 'text-gray-800'}`}>High Debt Volume</h3>
                                <p className="text-sm opacity-60">Customers with remaining balance greater than Rs 10,000.</p>
                            </div>
                        </div>
                    )}

                    {/* LIST VIEW */}
                    {insightView && (
                        <div className="h-full flex flex-col">
                            <button onClick={() => setInsightView(null)} className="mb-6 w-fit text-sm font-bold flex items-center gap-2 text-blue-500 hover:underline">
                                <Undo2 size={16}/> Back to Insights
                            </button>
                            <h3 className={`font-bold text-xl mb-6 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                {insightView === 'risk' ? 'Payment Risk List' : 'High Debt Customers'}
                            </h3>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-20">
                                {(insightView === 'risk' ? riskCustomers : highVolumeCustomers).map(c => (
                                    <div 
                                        key={c.id} 
                                        onClick={() => { setViewingCustomer(c); setCustomerModalTab('payments'); }}
                                        className={`p-5 rounded-2xl cursor-pointer border transition-all hover:shadow-lg hover:-translate-y-1 ${darkMode ? 'bg-slate-800 border-slate-700 hover:bg-slate-700' : 'bg-white border-slate-200 shadow-sm hover:border-blue-300'}`}
                                    >
                                        <div className="flex justify-between items-start mb-2">
                                            <p className={`font-bold text-lg ${darkMode ? 'text-white' : 'text-gray-900'}`}>{c.name}</p>
                                            <span className={`font-bold text-sm ${insightView === 'risk' ? 'text-red-500' : 'text-amber-500'}`}>
                                                {formatCurrency((c.totalBill||0)-(c.totalPaid||0))}
                                            </span>
                                        </div>
                                        <p className="text-xs opacity-50 mb-4">
                                            {insightView === 'risk' ? 
                                                `Last Paid: ${c.lastPaymentDate ? new Date(c.lastPaymentDate.seconds*1000).toLocaleDateString() : 'Never'}` 
                                                : 
                                                `Total Bill: ${formatCurrency(c.totalBill)}`
                                            }
                                        </p>
                                        <button className="w-full py-2 bg-blue-500/10 text-blue-500 text-xs font-bold rounded-lg hover:bg-blue-500 hover:text-white transition-colors">
                                            View Details
                                        </button>
                                    </div>
                                ))}
                                {(insightView === 'risk' ? riskCustomers : highVolumeCustomers).length === 0 && (
                                    <div className="col-span-full text-center py-10 opacity-50 border-2 border-dashed rounded-xl">No customers found in this category.</div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
             </div>
         )}

         {/* Edit Modal */}
         {editingItem && (
           <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[120] p-4 transition-opacity animate-fade-in">
              <div className={`p-8 rounded-3xl w-full max-w-sm shadow-2xl transform transition-all scale-100 ${darkMode?'bg-slate-900 border border-slate-700':'bg-white'}`}>
                 <h3 className={`font-bold text-xl mb-6 text-center ${darkMode ? 'text-white' : 'text-gray-900'}`}>Edit Inventory Item</h3>
                 <form onSubmit={handleUpdateItem} className="space-y-4">
                   <div><label className="text-xs font-bold opacity-50 uppercase tracking-wider mb-1 block">Brand</label><input className={`w-full p-3 border rounded-xl bg-transparent outline-none font-medium focus:ring-2 focus:ring-blue-500 ${darkMode?'border-slate-600':'border-slate-200'}`} value={editingItem.brand} onChange={e=>setEditingItem({...editingItem, brand:e.target.value})}/></div>
                   <div className="grid grid-cols-2 gap-4">
                     <div><label className="text-xs font-bold opacity-50 uppercase tracking-wider mb-1 block">Cost</label><input inputMode="numeric" type="number" onKeyDown={handleNumberInput} className={`w-full p-3 border rounded-xl bg-transparent outline-none font-medium focus:ring-2 focus:ring-blue-500 ${darkMode?'border-slate-600':'border-slate-200'}`} value={editingItem.orgPrice} onChange={e=>setEditingItem({...editingItem, orgPrice:e.target.value})}/></div>
                     <div><label className="text-xs font-bold opacity-50 uppercase tracking-wider mb-1 block">Sale</label><input inputMode="numeric" type="number" onKeyDown={handleNumberInput} className={`w-full p-3 border rounded-xl bg-transparent outline-none font-medium focus:ring-2 focus:ring-blue-500 ${darkMode?'border-slate-600':'border-slate-200'}`} value={editingItem.salePrice} onChange={e=>setEditingItem({...editingItem, salePrice:e.target.value})}/></div>
                   </div>
                   <div className="flex gap-3 mt-6"><button type="button" onClick={()=>setEditingItem(null)} className={`flex-1 py-3 rounded-xl font-bold transition-colors ${darkMode ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>Cancel</button><button className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-lg shadow-blue-500/20">Save Changes</button></div>
                 </form>
              </div>
           </div>
         )}

         {/* CUSTOMER HISTORY MODAL */}
         {activeCustomer && (
           <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[130] flex items-center justify-center p-4 animate-fade-in">
              <div className={`w-full max-w-lg max-h-[85vh] flex flex-col rounded-2xl shadow-2xl transform transition-all scale-100 ${darkMode ? 'bg-slate-900 border border-slate-700' : 'bg-white'}`}>
                 {/* Modal Header */}
                 <div className={`p-6 border-b flex justify-between items-start ${darkMode ? 'border-slate-800' : 'border-slate-100'}`}>
                    <div>
                       <h2 className={`text-2xl font-black flex items-center gap-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}><Users className="text-blue-500"/> {activeCustomer.name}</h2>
                       <p className="text-xs opacity-50 font-bold uppercase tracking-wider mt-1">Customer Account History</p>
                    </div>
                    <button onClick={() => setViewingCustomer(null)} className="p-2 hover:bg-gray-500/10 rounded-full transition-colors"><X size={24}/></button>
                 </div>
                 
                 {/* Modal Content */}
                 <div className="flex-1 overflow-y-auto p-6">
                    {/* Stats Cards */}
                    <div className="grid grid-cols-3 gap-3 mb-6">
                       <div className={`p-3 rounded-xl border text-center ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-gray-50 border-gray-200'}`}>
                          <p className="text-[10px] font-bold opacity-50 uppercase">Total Bill</p>
                          <p className="text-lg font-black text-blue-500">{formatCurrency(activeCustomer.totalBill)}</p>
                       </div>
                       <div className={`p-3 rounded-xl border text-center ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-gray-50 border-gray-200'}`}>
                          <p className="text-[10px] font-bold opacity-50 uppercase">Paid</p>
                          <p className="text-lg font-black text-emerald-500">{formatCurrency(activeCustomer.totalPaid)}</p>
                       </div>
                       <div className={`p-3 rounded-xl border text-center ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-gray-50 border-gray-200'}`}>
                          <p className="text-[10px] font-bold opacity-50 uppercase">Balance</p>
                          <p className="text-lg font-black text-rose-500">{formatCurrency((activeCustomer.totalBill||0) - (activeCustomer.totalPaid||0))}</p>
                       </div>
                    </div>
                    
                    {/* Quick Action - UPDATED MOBILE RESPONSIVE FIX */}
                    <div className={`p-4 mb-6 rounded-xl border ${darkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-gray-50 border-gray-200'}`}>
                      <label className="text-xs font-bold opacity-50 uppercase mb-2 block">Quick Actions</label>
                      <div className="flex flex-col sm:flex-row gap-3">
                         <input 
                           inputMode="numeric" 
                           type="number" 
                           min="0"
                           onKeyDown={handleNumberInput} 
                           placeholder="Amount" 
                           className={`w-full sm:flex-1 p-2 rounded-lg bg-transparent border text-sm focus:ring-2 focus:ring-blue-500 outline-none ${darkMode ? 'border-slate-600' : 'border-slate-300'}`} 
                           value={modalAmount} 
                           onChange={e=>setModalAmount(e.target.value)}
                         />
                         <div className="flex gap-2 w-full sm:w-auto">
                           <button onClick={handleModalPayment} className="flex-1 sm:flex-none bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-md transition-all active:scale-95">Pay</button>
                           <button onClick={handleModalRefund} className="flex-1 sm:flex-none bg-rose-600 hover:bg-rose-700 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-md transition-all active:scale-95">Refund</button>
                         </div>
                      </div>
                    </div>

                    {/* Tabs for History */}
                    <div className="flex gap-2 mb-4">
                        <button 
                           onClick={() => setCustomerModalTab('payments')}
                           className={`flex-1 py-2 rounded-lg text-xs font-bold uppercase flex items-center justify-center gap-2 transition-all ${customerModalTab === 'payments' ? 'bg-blue-600 text-white shadow-lg' : 'bg-gray-100 text-gray-500 dark:bg-slate-800 dark:text-slate-400'}`}
                        >
                           <Receipt size={14} /> Payments
                        </button>
                        <button 
                           onClick={() => setCustomerModalTab('purchases')}
                           className={`flex-1 py-2 rounded-lg text-xs font-bold uppercase flex items-center justify-center gap-2 transition-all ${customerModalTab === 'purchases' ? 'bg-purple-600 text-white shadow-lg' : 'bg-gray-100 text-gray-500 dark:bg-slate-800 dark:text-slate-400'}`}
                        >
                           <ShoppingBag size={14} /> Purchases
                        </button>
                    </div>

                    {/* List Content */}
                    <div className="space-y-3">
                        {customerModalTab === 'payments' ? (
                           customerHistory.length > 0 ? (
                              customerHistory.map((record) => (
                                 <div key={record.id} className={`p-4 rounded-xl flex justify-between items-center border transition-colors ${darkMode ? 'bg-slate-800/50 border-slate-700 hover:bg-slate-800' : 'bg-white border-slate-100 hover:border-slate-200 shadow-sm'}`}>
                                    <div className="flex items-center gap-3">
                                       <div className={`p-2 rounded-full ${record.type === 'Refund' ? 'bg-rose-500/10 text-rose-500' : 'bg-emerald-500/10 text-emerald-500'}`}>
                                          {record.type === 'Refund' ? <RefreshCcw size={16}/> : <Receipt size={16}/>}
                                       </div>
                                       <div>
                                          <p className={`font-bold text-sm ${darkMode ? 'text-white' : 'text-gray-900'}`}>{record.type || 'Payment'}</p>
                                          <p className="text-xs opacity-50">{record.date ? new Date(record.date.seconds * 1000).toLocaleDateString() : 'Unknown Date'}</p>
                                       </div>
                                    </div>
                                    <span className={`font-bold ${record.type === 'Refund' ? 'text-rose-500' : 'text-emerald-500'}`}>
                                       {record.type === 'Refund' ? '-' : '+'}{formatCurrency(record.amount)}
                                    </span>
                                 </div>
                              ))
                           ) : (
                              <div className="text-center py-8 opacity-40 text-sm border-2 border-dashed rounded-xl">No payment history found</div>
                           )
                        ) : (
                           customerPurchases.length > 0 ? (
                              customerPurchases.map((item) => (
                                 <div key={item.id} className={`p-4 rounded-xl flex justify-between items-center border transition-colors ${darkMode ? 'bg-slate-800/50 border-slate-700 hover:bg-slate-800' : 'bg-white border-slate-100 hover:border-slate-200 shadow-sm'}`}>
                                    <div className="flex items-center gap-3">
                                       <div className="p-2 rounded-full bg-purple-500/10 text-purple-500"><ShoppingBag size={16}/></div>
                                       <div className="overflow-hidden">
                                          <p className={`font-bold text-sm truncate w-32 sm:w-auto ${darkMode ? 'text-white' : 'text-gray-900'}`}>{item.suitId} <span className="opacity-50 font-normal">({item.brand})</span></p>
                                          <p className="text-xs opacity-50">{item.date ? new Date(item.date.seconds * 1000).toLocaleDateString() : 'Unknown Date'}</p>
                                       </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                       <span className="font-bold text-purple-500">{formatCurrency(item.salePrice)}</span>
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
                              <div className="text-center py-8 opacity-40 text-sm border-2 border-dashed rounded-xl">No purchases found</div>
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