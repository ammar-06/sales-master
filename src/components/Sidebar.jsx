import React, { useState, useEffect } from 'react';
import { LayoutDashboard, Shirt, ShoppingCart, Users, Handshake, BarChart3, Archive, LogOut, X, PlusCircle, CheckCircle, Download } from 'lucide-react';

const menuItems = [
  { id: 'dashboard',       icon: LayoutDashboard, label: 'Dashboard' },
  { id: 'add_stock',       icon: PlusCircle,      label: 'Add Stock' },
  { id: 'available_stock', icon: CheckCircle,     label: 'Available Stock' },
  { id: 'inventory',       icon: Shirt,           label: 'All Inventory' },
  { id: 'sales',           icon: ShoppingCart,    label: 'Sales' },
  { id: 'customers',       icon: Users,           label: 'Customers' },
  { id: 'mama',            icon: Handshake,       label: 'Partner Share' },
  { id: 'insights',        icon: BarChart3,       label: 'Insights' },
  { id: 'trash',           icon: Archive,         label: 'Deleted Customers' },
];

export default function Sidebar({ activeTab, setActiveTab, userProfileName, mobileMenuOpen, setMobileMenuOpen, onLogout, setViewingCustomer }) {

  const [deferredPrompt, setDeferredPrompt] = useState(null);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') setDeferredPrompt(null);
  };

  const handleNav = (id) => {
    setActiveTab(id);
    setViewingCustomer(null);
    setMobileMenuOpen(false);
  };

  return (
    <>
      {/* Mobile overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-30 md:hidden"
          style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      <div
        className={`fixed inset-y-0 left-0 w-60 flex flex-col z-40 transition-transform duration-300 md:relative md:translate-x-0 ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}
        style={{ background: '#0F1520', borderRight: '0.5px solid #2E3A47' }}
      >
        {/* Brand */}
        <div
          className="flex items-center gap-3 px-5 py-5 cursor-pointer shrink-0"
          style={{ borderBottom: '0.5px solid #2E3A47' }}
          onClick={() => handleNav('dashboard')}
        >
          <div className="p-2 rounded-lg" style={{ background: 'rgba(245,166,35,0.15)', color: '#F5A623' }}>
            <Shirt size={18} />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="font-bold text-base leading-tight" style={{ color: '#F0F4F8' }}>Sales Master</h1>
            <p className="font-mono text-[10px] uppercase tracking-wider truncate" style={{ color: '#5E7080' }}>{userProfileName || 'User'}</p>
          </div>
          <button
            className="md:hidden rounded-full p-1 hover:bg-white/10 transition-colors"
            style={{ color: '#8D9BAA' }}
            onClick={(e) => { e.stopPropagation(); setMobileMenuOpen(false); }}
          >
            <X size={16}/>
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {menuItems.map(item => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNav(item.id)}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 text-left relative"
                style={{
                  color:       isActive ? '#F5A623' : '#8D9BAA',
                  background:  isActive ? 'rgba(245,166,35,0.12)' : 'transparent',
                  borderLeft:  isActive ? '3px solid #F5A623' : '3px solid transparent',
                }}
                onMouseEnter={e => { if (!isActive) { e.currentTarget.style.background = '#1C2530'; e.currentTarget.style.color = '#F0F4F8'; } }}
                onMouseLeave={e => { if (!isActive) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#8D9BAA'; } }}
              >
                <item.icon size={17} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Bottom actions */}
        <div className="px-3 pb-4 space-y-1.5 shrink-0" style={{ borderTop: '0.5px solid #2E3A47', paddingTop: '12px' }}>
          {deferredPrompt && (
            <button
              onClick={handleInstallClick}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-bold transition-all duration-150 mb-2 active:scale-95"
              style={{ background: '#F5A623', color: '#0F1520' }}
              onMouseEnter={e => { e.currentTarget.style.background = '#E09410'; }}
              onMouseLeave={e => { e.currentTarget.style.background = '#F5A623'; }}
            >
              <Download size={15}/> Install App
            </button>
          )}

          <button
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-semibold transition-all duration-150"
            style={{ color: '#FC6B6B', background: 'transparent', border: '1px solid transparent' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(252,107,107,0.08)'; e.currentTarget.style.borderColor = 'rgba(252,107,107,0.3)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'transparent'; }}
          >
            <LogOut size={14}/> Logout
          </button>
        </div>
      </div>
    </>
  );
}