import React, { useState, useMemo } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { Archive, RotateCcw, Search } from 'lucide-react';
import { db, appId } from '../config/firebase';
import { formatCurrency } from '../utils/helpers';
import { ConfirmationModal } from '../components/ui/UIComponents';

const surface  = '#1C2530';
const elevated = '#222E3C';
const border   = '#2E3A47';
const primary  = '#F0F4F8';
const muted    = '#8D9BAA';
const faint    = '#5E7080';

export default function DeletedCustomers({ customers, user, showToast, setViewingCustomer, setCustomerModalTab }) {
  const [modalConfig, setModalConfig] = useState({ isOpen: false, id: null });
  const [search, setSearch] = useState('');

  const deletedCust = useMemo(() => {
    const q = search.toLowerCase();
    return customers
      .filter(c => c.status === 'deleted' && (c.name || '').toLowerCase().includes(q))
      .sort((a, b) => (a.name || '').localeCompare(b.name || '', undefined, { sensitivity: 'base' }));
  }, [customers, search]);

  const handleRestore = async () => {
    try {
      await updateDoc(doc(db, `artifacts/${appId}/users/${user.uid}/customers`, modalConfig.id), { status: 'active' });
      showToast('Customer Restored');
    } catch { showToast('Error restoring', 'error'); }
    setModalConfig({ isOpen: false, id: null });
  };

  return (
    <div className="flex flex-col h-full overflow-hidden pb-20">
      <ConfirmationModal
        isOpen={modalConfig.isOpen}
        onClose={() => setModalConfig({ ...modalConfig, isOpen: false })}
        onConfirm={handleRestore}
        title="Restore Customer?"
        message="This customer will appear in the main list again."
        isDanger={false}
      />

      <div className="flex flex-col h-full">
        <div className="shrink-0 mb-4">
          <h2 className="text-xl font-bold mb-3 flex items-center gap-2" style={{ color: primary }}>
            <Archive size={20} style={{ color: '#FC6B6B' }}/> Deleted Customers
          </h2>
          {/* Search bar */}
          <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg" style={{ background: surface, border: `0.5px solid ${border}` }}>
            <Search size={15} style={{ color: faint }}/>
            <input
              className="bg-transparent outline-none flex-1 font-medium"
              style={{ color: primary, fontSize: 14 }}
              placeholder="Search deleted customers..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            {search && (
              <button onClick={() => setSearch('')} className="text-xs font-semibold" style={{ color: faint }}>Clear</button>
            )}
          </div>
        </div>

        {deletedCust.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center opacity-40">
            <Archive size={48} className="mb-3" style={{ color: faint }}/>
            <p className="text-sm" style={{ color: faint }}>{search ? `No results for "${search}"` : 'No deleted customers'}</p>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto min-h-0 pb-4">
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
              {deletedCust.map(c => (
                <div
                  key={c.id}
                  onClick={() => { setViewingCustomer(c); setCustomerModalTab('payments'); }}
                  className="p-3 sm:p-4 rounded-card cursor-pointer transition-all duration-150 opacity-70 hover:opacity-100"
                  style={{ background: surface, border: `0.5px solid ${border}` }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = '#4A5E72'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = border}
                >
                  <div className="flex justify-between items-start mb-2">
                    <p className="font-semibold text-sm" style={{ color: primary }}>{c.name}</p>
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold" style={{ background: 'rgba(252,107,107,0.1)', color: '#FC6B6B', border: '0.5px solid rgba(252,107,107,0.25)' }}>Deleted</span>
                  </div>
                  <div className="flex justify-between text-xs mb-3" style={{ color: faint }}>
                    <span>Balance:</span>
                    <b style={{ color: muted }}>{formatCurrency((c.totalBill || 0) - (c.totalPaid || 0))}</b>
                  </div>
                  <div className="flex gap-1.5">
                    <button className="flex-1 py-1.5 rounded-lg text-[10px] sm:text-xs font-semibold transition-all"
                      style={{ background: elevated, color: muted, border: `0.5px solid ${border}` }}
                    >View</button>
                    <button
                      onClick={e => { e.stopPropagation(); setModalConfig({ isOpen: true, id: c.id }); }}
                      className="flex-1 py-1.5 rounded-lg text-[10px] sm:text-xs font-semibold flex items-center justify-center gap-1 transition-all"
                      style={{ background: 'rgba(96,165,250,0.1)', color: '#60A5FA', border: '0.5px solid rgba(96,165,250,0.25)' }}
                    >
                      <RotateCcw size={11}/> Restore
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}