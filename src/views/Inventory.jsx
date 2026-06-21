import React, { useState, useMemo, useRef } from 'react';
import { collection, doc, updateDoc, deleteDoc, writeBatch, serverTimestamp } from 'firebase/firestore';
import { Search, Edit, Trash2, Package } from 'lucide-react';
import { db, appId } from '../config/firebase';
import { formatCurrency, handleNumberInput, chunkArray } from '../utils/helpers';
import { ConfirmationModal } from '../components/ui/UIComponents';

const surface  = '#1C2530';
const elevated = '#222E3C';
const border   = '#2E3A47';
const subtle   = '#243040';
const primary  = '#F0F4F8';
const muted    = '#8D9BAA';
const faint    = '#5E7080';

const inputCls = {
  background: surface,
  border: `1px solid ${border}`,
  borderRadius: 8,
  color: primary,
  outline: 'none',
  width: '100%',
  padding: '9px 12px',
  fontSize: 14,
  transition: 'border-color 150ms ease, box-shadow 150ms ease',
};
const focusIn  = e => { e.target.style.borderColor = '#F5A623'; e.target.style.boxShadow = '0 0 0 3px rgba(245,166,35,0.15)'; };
const focusOut = e => { e.target.style.borderColor = border;    e.target.style.boxShadow = 'none'; };

export default function Inventory({ inventory, user, showToast }) {
  const [inventorySearch, setInventorySearch] = useState('');
  const [editingItem, setEditingItem] = useState(null);
  const [modalConfig, setModalConfig] = useState({ isOpen: false, id: null });
  const searchRef = useRef(null);

  const filteredInv = useMemo(() => {
    const up = inventorySearch.toUpperCase();
    const lo = inventorySearch.toLowerCase();
    return inventory
      .filter(i => i.suitId?.includes(up) || i.brand?.toLowerCase().includes(lo))
      .sort((a, b) => (a.suitId || '').localeCompare(b.suitId || '', undefined, { numeric: true, sensitivity: 'base' }));
  }, [inventory, inventorySearch]);

  const filteredValue = useMemo(() => filteredInv.reduce((a, i) => a + (Number(i.orgPrice) || 0), 0), [filteredInv]);

  const handleUpdateItem = async (e) => {
    e.preventDefault();
    if (!user || !editingItem) return;
    try {
      await updateDoc(doc(db, `artifacts/${appId}/users/${user.uid}/inventory`, editingItem.id), {
        brand: editingItem.brand,
        orgPrice: Math.round(Number(editingItem.orgPrice)),
        salePrice: Math.round(Number(editingItem.salePrice)),
      });
      setEditingItem(null);
      showToast('Updated!');
    } catch { showToast('Update failed', 'error'); }
  };

  const confirmDelete = async () => {
    try {
      await deleteDoc(doc(db, `artifacts/${appId}/users/${user.uid}/inventory`, modalConfig.id));
      showToast('Item removed');
    } catch { showToast('Error', 'error'); }
    setModalConfig({ isOpen: false, id: null });
  };

  return (
    <div className="flex flex-col h-full overflow-hidden pb-20">
      <ConfirmationModal
        isOpen={modalConfig.isOpen}
        onClose={() => setModalConfig({ ...modalConfig, isOpen: false })}
        onConfirm={confirmDelete}
        title="Delete Item?"
        message="This cannot be undone."
        isDanger
      />

      <div className="flex-1 flex flex-col min-h-0 overflow-hidden rounded-card" style={{ border: `0.5px solid ${border}`, background: surface }}>

        {/* Search header */}
        <div className="flex items-center gap-3 px-4 py-3 shrink-0" style={{ borderBottom: `0.5px solid ${border}` }}>
          <Search size={17} style={{ color: faint }} />
          <input
            ref={searchRef}
            className="bg-transparent outline-none flex-1 font-medium"
            style={{ color: primary, fontSize: 14 }}
            placeholder="Search by ID or brand..."
            value={inventorySearch}
            onChange={e => setInventorySearch(e.target.value)}
          />
        </div>

        {/* Stats bar */}
        <div className="flex justify-between px-5 py-2.5 shrink-0 uppercase font-semibold" style={{ fontSize: 11, letterSpacing: '0.06em', color: faint, borderBottom: `0.5px solid ${subtle}`, background: '#131920' }}>
          <span>{filteredInv.length} Items</span>
          <span>Value: {formatCurrency(filteredValue)}</span>
        </div>

        {/* Mobile cards */}
        <div className="md:hidden flex-1 overflow-y-auto">
          <div className="grid grid-cols-2 gap-2 p-2 pb-24">
            {filteredInv.length === 0 ? (
              <div className="col-span-2 flex flex-col items-center justify-center p-10 opacity-40 text-sm">
                <Package size={28} className="mb-2"/>
                <p>No items found</p>
              </div>
            ) : filteredInv.map(i => (
              <div key={i.id} className="p-3 rounded-lg flex flex-col justify-between" style={{ background: elevated, border: `0.5px solid ${border}` }}>
                <div className="flex justify-between items-start mb-1">
                  <span className="font-bold font-mono text-sm" style={{ color: '#F5A623' }}>{i.suitId}</span>
                  <span className="w-2 h-2 rounded-full" style={{ background: i.qty > 0 ? '#4ADE80' : '#FC6B6B' }}/>
                </div>
                <span className="text-xs font-medium truncate block mb-2" style={{ color: muted }}>{i.brand}</span>
                <div className="pt-2 flex justify-between items-end" style={{ borderTop: `0.5px dashed ${subtle}` }}>
                  <div>
                    <span className="block font-bold text-sm" style={{ color: primary }}>{i.salePrice}</span>
                    <span className="text-[10px]" style={{ color: faint }}>Cost: {i.orgPrice}</span>
                  </div>
                  {i.qty > 0 && (
                    <div className="flex gap-1">
                      <button onClick={() => setEditingItem(i)} className="p-1.5 rounded transition-colors" style={{ color: '#60A5FA', background: 'rgba(96,165,250,0.1)' }}><Edit size={11}/></button>
                      <button onClick={() => setModalConfig({ isOpen: true, id: i.id })} className="p-1.5 rounded transition-colors" style={{ color: '#FC6B6B', background: 'rgba(252,107,107,0.1)' }}><Trash2 size={11}/></button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Desktop table */}
        <div className="hidden md:flex flex-col flex-1 min-h-0 overflow-hidden">
          <div className="flex-1 overflow-y-auto">
            <table className="w-full text-sm table-fixed">
              <thead className="sticky top-0 z-10" style={{ background: '#131920' }}>
                <tr className="uppercase font-semibold" style={{ fontSize: 11, letterSpacing: '0.06em', color: faint }}>
                  <th className="p-4 text-left w-1/6">ID</th>
                  <th className="text-left w-1/4">Brand</th>
                  <th className="text-right w-1/6">Cost</th>
                  <th className="text-right w-1/6">Sale</th>
                  <th className="text-center w-1/6">Status</th>
                  <th className="text-center w-1/6">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredInv.length === 0 ? (
                  <tr><td colSpan="6" className="text-center p-12 text-sm" style={{ color: faint }}>No items found</td></tr>
                ) : filteredInv.map(i => (
                  <tr key={i.id} className="transition-colors duration-150" style={{ borderBottom: `0.5px solid ${subtle}` }}
                    onMouseEnter={e => e.currentTarget.style.background = elevated}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <td className="p-4 font-bold font-mono" style={{ color: '#F5A623' }}>{i.suitId}</td>
                    <td className="font-medium truncate" style={{ color: muted }}>{i.brand}</td>
                    <td className="text-right font-medium" style={{ color: faint }}>{i.orgPrice}</td>
                    <td className="text-right font-bold" style={{ color: primary }}>{i.salePrice}</td>
                    <td className="text-center">
                      {i.qty > 0
                        ? <span className="text-[10px] px-2.5 py-1 rounded-full font-semibold" style={{ background: 'rgba(74,222,128,0.1)', color: '#4ADE80', border: '0.5px solid rgba(74,222,128,0.25)' }}>In Stock</span>
                        : <span className="text-[10px] px-2.5 py-1 rounded-full font-semibold" style={{ background: 'rgba(252,107,107,0.1)', color: '#FC6B6B', border: '0.5px solid rgba(252,107,107,0.25)' }}>Sold</span>}
                    </td>
                    <td className="text-center">
                      {i.qty > 0 && (
                        <div className="flex justify-center gap-2 py-3">
                          <button onClick={() => setEditingItem(i)} className="p-1.5 rounded transition-colors" style={{ color: '#60A5FA' }}
                            onMouseEnter={e => e.currentTarget.style.background = 'rgba(96,165,250,0.1)'}
                            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                          ><Edit size={14}/></button>
                          <button onClick={() => setModalConfig({ isOpen: true, id: i.id })} className="p-1.5 rounded transition-colors" style={{ color: '#FC6B6B' }}
                            onMouseEnter={e => e.currentTarget.style.background = 'rgba(252,107,107,0.1)'}
                            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                          ><Trash2 size={14}/></button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Edit modal */}
      {editingItem && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 animate-fade-in" style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}>
          <div className="w-full max-w-sm p-6 rounded-modal" style={{ background: '#222E3C', border: `0.5px solid ${border}` }}>
            <h3 className="font-bold text-lg mb-5 text-center" style={{ color: primary }}>Edit Item</h3>
            <form onSubmit={handleUpdateItem} className="space-y-3">
              <div>
                <label className="block mb-1.5 uppercase font-semibold" style={{ fontSize: 11, letterSpacing: '0.06em', color: faint }}>Brand</label>
                <input style={inputCls} value={editingItem.brand} onChange={e => setEditingItem({ ...editingItem, brand: e.target.value })} onFocus={focusIn} onBlur={focusOut}/>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block mb-1.5 uppercase font-semibold" style={{ fontSize: 11, letterSpacing: '0.06em', color: faint }}>Cost</label>
                  <input style={inputCls} type="number" inputMode="numeric" onKeyDown={handleNumberInput} value={editingItem.orgPrice} onChange={e => setEditingItem({ ...editingItem, orgPrice: e.target.value })} onFocus={focusIn} onBlur={focusOut}/>
                </div>
                <div>
                  <label className="block mb-1.5 uppercase font-semibold" style={{ fontSize: 11, letterSpacing: '0.06em', color: faint }}>Sale</label>
                  <input style={inputCls} type="number" inputMode="numeric" onKeyDown={handleNumberInput} value={editingItem.salePrice} onChange={e => setEditingItem({ ...editingItem, salePrice: e.target.value })} onFocus={focusIn} onBlur={focusOut}/>
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setEditingItem(null)} className="flex-1 py-2.5 rounded-lg font-semibold text-sm transition-all" style={{ background: surface, color: primary, border: `1px solid ${border}` }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = '#4A5E72'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = border}
                >Cancel</button>
                <button type="submit" className="flex-1 py-2.5 rounded-lg font-bold text-sm transition-all active:scale-95" style={{ background: '#F5A623', color: '#0F1520' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#E09410'}
                  onMouseLeave={e => e.currentTarget.style.background = '#F5A623'}
                >Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}