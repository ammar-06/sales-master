import React, { useState, useEffect, useMemo } from 'react';
import { onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { collection, onSnapshot, doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { Menu } from 'lucide-react'; // <--- THIS IS THE FIX FOR THE WHITE SCREEN
import { auth, db, appId, ADMIN_ACCESS_CODE } from './config/firebase'; 
import { ToastContainer, LoadingSpinner, ConfirmationModal } from './components/ui/UIComponents';
import Auth from './components/Auth';
import Sidebar from './components/Sidebar';
import Dashboard from './views/Dashboard';
import Inventory from './views/Inventory';
import Sales from './views/Sales';
import Customers from './views/Customers';
import PartnerShare from './views/PartnerShare';
import Insights from './views/Insights';
import DeletedCustomers from './views/DeletedCustomers'; 
import { playSound } from './utils/helpers';
import CustomerDetailModal from './components/CustomerDetailModal';
import AddStock from './views/AddStock'; 
import AvailableStock from './views/AvailableStock';

export default function App() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // Data States
  const [inventory, setInventory] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [sales, setSales] = useState([]);
  const [payments, setPayments] = useState([]);
  const [userProfileName, setUserProfileName] = useState('');
  
  // UI States
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('theme') === 'dark');
  const [toasts, setToasts] = useState([]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [modalConfig, setModalConfig] = useState({ isOpen: false, type: null, id: null });
  
  // Customer View State (Shared for interactions)
  const [viewingCustomer, setViewingCustomer] = useState(null);
  const [customerModalTab, setCustomerModalTab] = useState('payments');

  // --- Effects ---
  useEffect(() => { document.title = "Sales Master"; }, []);
  
  useEffect(() => { 
    if (darkMode) { document.documentElement.classList.add('dark'); localStorage.setItem('theme', 'dark'); } 
    else { document.documentElement.classList.remove('dark'); localStorage.setItem('theme', 'light'); } 
  }, [darkMode]);

  useEffect(() => { 
    const unsub = onAuthStateChanged(auth, (u) => { setUser(u); setAuthLoading(false); }); 
    return () => unsub(); 
  }, []);

  useEffect(() => { 
    if (!user) return; 
    const fetchProfile = async () => { 
        try {
            const s = await getDoc(doc(db, `artifacts/${appId}/users/${user.uid}/account/info`));
            if(s.exists()) setUserProfileName(s.data().name);
        } catch(e) {}
    }; 
    fetchProfile(); 
  }, [user]);
  
 useEffect(() => { 
    if (!user) return; 
    const userPath = `artifacts/${appId}/users/${user.uid}`; 
    
    // Fixed: Added the missing closing parenthesis ')' at the end of these lines
    const u1 = onSnapshot(collection(db, `${userPath}/inventory`), s => setInventory(s.docs.map(d => ({id:d.id,...d.data()}))));
    const u2 = onSnapshot(collection(db, `${userPath}/customers`), s => setCustomers(s.docs.map(d => ({id:d.id,...d.data()}))));
    
    // These two lines were missing one ')' at the end
    const u3 = onSnapshot(collection(db, `${userPath}/sales`), s => setSales(s.docs.map(d => ({id:d.id,...d.data()})).sort((a,b)=>b.date?.seconds-a.date?.seconds))); 
    const u4 = onSnapshot(collection(db, `${userPath}/payments`), s => setPayments(s.docs.map(d => ({id:d.id,...d.data()})).sort((a,b)=>b.date?.seconds-a.date?.seconds)));
    
    return () => { u1(); u2(); u3(); u4(); };
  }, [user]);

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

  const handleConfirmAction = async () => {
    if (modalConfig.type === 'LOGOUT') {
        await signOut(auth);
        setInventory([]); setSales([]); setCustomers([]);
        showToast("Logged out successfully");
    }
    setModalConfig({ ...modalConfig, isOpen: false });
  };

 const stats = useMemo(() => {
     const safeVal = (v) => Number(v) || 0;

     // 1. Capital: Total Cost of ALL dresses (Sold + Unsold)
     const capital = inventory.reduce((a, i) => a + safeVal(i.orgPrice), 0);

     // 2. Net Profit Calculation
     // A. Realized Profit (From Sales) - Already minus partner share
     const realizedNetProfit = sales.reduce((a, s) => {
         const grossProfit = safeVal(s.profit);
         const partnerShare = safeVal(s.mamaShare);
         return a + (grossProfit - partnerShare);
     }, 0);

     // B. Projected Profit (From Unsold Inventory) - Minus 20% estimated share
     const projectedNetProfit = inventory.reduce((a, i) => {
         if (i.qty > 0) { // Only count items currently in stock
             const cost = safeVal(i.orgPrice);
             const sale = safeVal(i.salePrice);
             const gross = sale - cost;
             // Calculate 20% partner share on this potential profit
             const share = Math.round(gross * 0.2); 
             return a + (gross - share);
         }
         return a;
     }, 0);

     // Total Profit = Realized (Cash in hand) + Projected (Value in stock)
     const totalNetProfit = realizedNetProfit + projectedNetProfit;

     // 3. Receivables & Received
     const receivable = customers.reduce((a, c) => a + (safeVal(c.totalBill) - safeVal(c.totalPaid)), 0);
     const received = customers.reduce((a, c) => a + safeVal(c.totalPaid), 0);

     // 4. Stock Counts
     const availableItems = inventory.filter(i => i.qty > 0);
     const stockCount = availableItems.length;
     const stockValue = availableItems.reduce((a, i) => a + safeVal(i.orgPrice), 0);

     // Partner Stats
     const mamaShare = sales.reduce((a, s) => a + safeVal(s.mamaShare), 0);
     const mamaPaid = sales.filter(s => s.mamaPaid).reduce((a, s) => a + safeVal(s.mamaShare), 0);
     const mamaPending = mamaShare - mamaPaid;

     return { 
         capital, 
         profit: totalNetProfit, // <--- Updated to include both Realized & Projected
         receivable, 
         received, 
         stockCount, 
         stockValue, 
         mamaTotal: mamaShare, 
         mamaPaid, 
         mamaPending 
     };
  }, [inventory, sales, customers]);

  if (authLoading) return <div className={`h-screen flex items-center justify-center ${darkMode ? 'bg-slate-900' : 'bg-gray-50'}`}><LoadingSpinner /></div>;
  if (!user) return <Auth />;

  return (
    <div className={`flex h-dvh font-sans overflow-hidden ${darkMode ? 'bg-slate-900 text-slate-100' : 'bg-gray-50/50 text-slate-800'}`}>
      <ToastContainer toasts={toasts} removeToast={removeToast} />
      
      {/* GLOBAL MODAL */}
      <ConfirmationModal 
        isOpen={modalConfig.isOpen} 
        onClose={() => setModalConfig({...modalConfig, isOpen: false})} 
        onConfirm={handleConfirmAction} 
        title={modalConfig.title} 
        message={modalConfig.message} 
        isDanger={modalConfig.isDanger} 
        darkMode={darkMode} 
      />
      
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        userProfileName={userProfileName} 
        mobileMenuOpen={mobileMenuOpen} 
        setMobileMenuOpen={setMobileMenuOpen} 
        darkMode={darkMode} 
        setDarkMode={setDarkMode} 
        onLogout={openLogoutModal}
        setViewingCustomer={setViewingCustomer}
      />
      
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
         <div className={`md:hidden flex shrink-0 justify-between items-center p-4 border-b ${darkMode ? 'border-slate-800' : 'bg-white border-slate-200'}`}>
            <button onClick={() => setMobileMenuOpen(true)} className="p-2 bg-blue-600 text-white rounded-lg shadow-lg active:scale-95 transition-transform"><Menu/></button>
            <h2 className="font-bold uppercase tracking-wider text-sm text-slate-500">{activeTab === 'mama' ? "PARTNER SHARE" : activeTab}</h2><div className="w-8"></div>
         </div>

         <div className="flex-1 overflow-y-auto p-4 md:p-8 scroll-smooth animate-fade-in">
            {activeTab === 'dashboard' && <Dashboard stats={stats} sales={sales} darkMode={darkMode} />}
            
            {activeTab === 'add_stock' && <AddStock inventory={inventory} user={user} showToast={showToast} darkMode={darkMode} />}

            {activeTab === 'inventory' && <Inventory inventory={inventory} user={user} showToast={showToast} darkMode={darkMode} playSound={playSound} />}
            {activeTab === 'available_stock' && <AvailableStock inventory={inventory} darkMode={darkMode} />}
            {activeTab === 'sales' && <Sales inventory={inventory} customers={customers} user={user} showToast={showToast} darkMode={darkMode} />}
            
            {activeTab === 'customers' && (
              <Customers 
                customers={customers} 
                payments={payments} 
                sales={sales} 
                user={user} 
                showToast={showToast} 
                darkMode={darkMode} 
                setViewingCustomer={setViewingCustomer}
                setCustomerModalTab={setCustomerModalTab}
                viewingCustomer={viewingCustomer}
                customerModalTab={customerModalTab}
              />
            )}
            
            {activeTab === 'mama' && <PartnerShare sales={sales} stats={stats} user={user} showToast={showToast} darkMode={darkMode} />}
            
            {activeTab === 'insights' && (
              <Insights 
                customers={customers} 
                darkMode={darkMode} 
                setViewingCustomer={setViewingCustomer} 
                setCustomerModalTab={setCustomerModalTab} 
              />
            )}
            
            {activeTab === 'trash' && (
              <DeletedCustomers 
                customers={customers} 
                user={user} 
                showToast={showToast} 
                darkMode={darkMode} 
                setViewingCustomer={setViewingCustomer} 
                setCustomerModalTab={setCustomerModalTab} 
              />
            )}
         </div>
      </div>
      {/* GLOBAL CUSTOMER DETAIL MODAL */}
      {viewingCustomer && (
        <CustomerDetailModal 
          activeCustomer={viewingCustomer} 
          onClose={() => setViewingCustomer(null)}
          darkMode={darkMode}
          user={user}
          payments={payments}
          sales={sales}
          showToast={showToast}
        />
      )}
      
      {/* (Deleted Customers Tab Code Here...) */}
    </div>
    
  );
}