import React, { useState, useMemo, useRef } from 'react';
import { collection, doc, updateDoc, deleteDoc, writeBatch, serverTimestamp } from 'firebase/firestore';
import { Search, Plus, Edit, Trash2, Package } from 'lucide-react';
import { db, appId } from '../config/firebase';
import { formatCurrency, handleNumberInput, chunkArray, playSound } from '../utils/helpers';
import { ConfirmationModal } from '../components/ui/UIComponents';

export default function Inventory({ inventory, user, showToast, darkMode }) {
  const [inventorySearch, setInventorySearch] = useState('');
  const [showAvailableOnly, setShowAvailableOnly] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [dressForm, setDressForm] = useState({ suitIds: '', brand: '', orgPrice: '', salePrice: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalConfig, setModalConfig] = useState({ isOpen: false, type: null, id: null });
  const inventorySearchInput = useRef(null);
  const idsInputRef = useRef(null);

  const filteredInv = useMemo(() => {
    const upperSearch = inventorySearch.toUpperCase();
    const lowerSearch = inventorySearch.toLowerCase();
    const d = inventory.filter(i => (i.suitId?.includes(upperSearch) || i.brand?.toLowerCase().includes(lowerSearch)) && (!showAvailableOnly || i.qty > 0));
    return d.sort((a, b) => (a.suitId || '').localeCompare(b.suitId || '', undefined, { numeric: true, sensitivity: 'base' }));
  }, [inventory, inventorySearch, showAvailableOnly]);

  const filteredInventoryValue = useMemo(() => filteredInv.reduce((acc, item) => acc + (Number(item.orgPrice)||0), 0), [filteredInv]);

  const handleAddDress = async (e) => {
    e.preventDefault();
    if (!user || isSubmitting) return;
    if (!dressForm.suitIds.trim()) { showToast("Product IDs missing!", 'error'); playSound('error'); return; }
    if (!dressForm.brand.trim()) { showToast("Brand required!", 'error'); playSound('error'); return; }
    if (!dressForm.orgPrice || Number(dressForm.orgPrice) <= 0) { showToast("Invalid Cost", 'error'); playSound('error'); return; }
    if (!dressForm.salePrice || Number(dressForm.salePrice) <= 0) { showToast("Invalid Sale Price", 'error'); playSound('error'); return; }
    if (Number(dressForm.salePrice) < Number(dressForm.orgPrice)) { showToast("Sale Price < Cost!", 'error'); playSound('error'); return; }

    setIsSubmitting(true);
    const newSuitIds = dressForm.suitIds.split(/[\s,]+/).map(s => s.trim().toUpperCase()).filter(s => s !== "");
    const uniqueInputIds = new Set(newSuitIds);
    if (newSuitIds.length === 0) { showToast("Invalid IDs", 'error'); setIsSubmitting(false); return; }
    if (uniqueInputIds.size !== newSuitIds.length) { showToast("Duplicate IDs!", 'error'); setIsSubmitting(false); playSound('error'); return; }
    const duplicates = newSuitIds.filter(id => inventory.some(i => i.suitId === id));
    if (duplicates.length > 0) { showToast(`Exists: ${duplicates.join(', ')}`, 'error'); setIsSubmitting(false); playSound('error'); return; }

    try {
      const batches = chunkArray(newSuitIds, 450); 
      for (const chunk of batches) {
          const batch = writeBatch(db);
          chunk.forEach(id => {
              const docRef = doc(collection(db, `artifacts/${appId}/users/${user.uid}/inventory`));
              batch.set(docRef, {
                suitId: id, brand: dressForm.brand.trim(), qty: 1, 
                orgPrice: Math.round(Number(dressForm.orgPrice)), 
                salePrice: Math.round(Number(dressForm.salePrice)), 
                createdAt: serverTimestamp()
              });
          });
          await batch.commit();
      }
      setDressForm({ suitIds: '', brand: '', orgPrice: '', salePrice: '' }); 
      showToast(`Added ${newSuitIds.length} items!`); playSound('success');
    } catch (err) { showToast("Failed to add", 'error'); } finally { setIsSubmitting(false); }
  };

  const handleUpdateItem = async (e) => {
      e.preventDefault();
      if(!user || !editingItem) return;
      try {
        await updateDoc(doc(db, `artifacts/${appId}/users/${user.uid}/inventory`, editingItem.id), {
          brand: editingItem.brand, orgPrice: Math.round(Number(editingItem.orgPrice)), salePrice: Math.round(Number(editingItem.salePrice))
        });
        setEditingItem(null); showToast("Updated!"); playSound('success');
      } catch (error) { showToast("Failed", 'error'); }
  };

  const confirmDelete = async () => {
      try {
        await deleteDoc(doc(db, `artifacts/${appId}/users/${user.uid}/inventory`, modalConfig.id));
        showToast("Item Removed"); playSound('delete');
      } catch(e) { showToast("Error", 'error'); }
      setModalConfig({ isOpen: false, type: null, id: null });
  };

  return (
    <div className="flex flex-col lg:flex-row gap-4 sm:gap-6 h-full overflow-hidden pb-20">
      <ConfirmationModal isOpen={modalConfig.isOpen} onClose={()=>setModalConfig({...modalConfig, isOpen:false})} onConfirm={confirmDelete} title="Delete Item?" message="Cannot be undone." isDanger={true} darkMode={darkMode} />
      
      {/* ADD STOCK FORM - FIXED TOP */}
      <div className={`shrink-0 p-3 sm:p-6 rounded-2xl shadow-sm border w-full lg:w-80 ${darkMode?'bg-slate-800 border-slate-700':'bg-white border-slate-200 shadow-slate-200/50'}`}>
        <h3 className={`font-bold mb-2 sm:mb-4 flex gap-2 items-center text-base sm:text-lg ${darkMode ? 'text-white' : 'text-gray-900'}`}><Plus size={18} className="text-blue-500"/> Add Stock</h3>
        <form onSubmit={handleAddDress} className="space-y-2">
          <div>
              <label className="text-[10px] font-bold opacity-50 uppercase tracking-wider mb-1 block">IDs (Comma/Space)</label>
              <textarea ref={idsInputRef} required className={`w-full p-2 border rounded-xl bg-transparent outline-none text-base sm:text-sm focus:ring-2 focus:ring-blue-500 transition-all resize-none overflow-hidden ${darkMode?'border-slate-600 focus:bg-slate-900':'border-slate-200 focus:bg-gray-50'}`} rows="1" value={dressForm.suitIds} onChange={e=>setDressForm({...dressForm, suitIds:e.target.value})} placeholder="A1, A2..."/>
          </div>
          <div>
              <label className="text-[10px] font-bold opacity-50 uppercase tracking-wider mb-1 block">Brand</label>
              <input required className={`w-full p-2 border rounded-xl bg-transparent outline-none text-base sm:text-sm focus:ring-2 focus:ring-blue-500 transition-all ${darkMode?'border-slate-600 focus:bg-slate-900':'border-slate-200 focus:bg-gray-50'}`} value={dressForm.brand} onChange={e=>setDressForm({...dressForm, brand:e.target.value})}/>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
                <label className="text-[10px] font-bold opacity-50 uppercase tracking-wider mb-1 block">Cost</label>
                <input inputMode="numeric" type="number" onKeyDown={handleNumberInput} className={`w-full p-2 border rounded-xl bg-transparent outline-none text-base sm:text-sm focus:ring-2 focus:ring-blue-500 transition-all ${darkMode?'border-slate-600 focus:bg-slate-900':'border-slate-200 focus:bg-gray-50'}`} value={dressForm.orgPrice} onChange={e=>setDressForm({...dressForm, orgPrice:e.target.value})}/>
            </div>
            <div>
                <label className="text-[10px] font-bold opacity-50 uppercase tracking-wider mb-1 block">Sale</label>
                <input inputMode="numeric" type="number" onKeyDown={handleNumberInput} className={`w-full p-2 border rounded-xl bg-transparent outline-none text-base sm:text-sm focus:ring-2 focus:ring-blue-500 transition-all ${darkMode?'border-slate-600 focus:bg-slate-900':'border-slate-200 focus:bg-gray-50'}`} value={dressForm.salePrice} onChange={e=>setDressForm({...dressForm, salePrice:e.target.value})}/>
            </div>
          </div>
          <button disabled={isSubmitting} className="w-full bg-blue-600 text-white py-2.5 rounded-xl font-bold text-sm shadow-lg shadow-blue-500/30 hover:bg-blue-700 transition-all active:scale-95">Add Stock</button>
        </form>
      </div>
      
      {/* INVENTORY LIST - SCROLLABLE CONTAINER */}
      <div className="flex-1 flex flex-col overflow-hidden min-h-0">
        <div className={`rounded-2xl border flex flex-col h-full shadow-sm ${darkMode?'bg-slate-800 border-slate-700':'bg-white border-slate-200 shadow-slate-200/50'}`}>
           {/* Search Header */}
           <div className={`p-3 sm:p-4 border-b flex shrink-0 gap-3 items-center ${darkMode ? 'border-slate-700' : 'border-slate-100'}`}>
               <Search size={18} className="opacity-50"/>
               <input ref={inventorySearchInput} className="bg-transparent outline-none flex-1 text-base sm:text-sm font-medium" placeholder="Search stock..." value={inventorySearch} onChange={e=>setInventorySearch(e.target.value)}/>
           </div>
           
           {/* Stats Header */}
           <div className={`px-4 sm:px-6 py-2 shrink-0 text-[10px] sm:text-xs font-bold uppercase tracking-wider flex justify-between ${darkMode ? 'bg-slate-900/50 text-slate-400' : 'bg-gray-50 text-slate-500'}`}>
               <span>{filteredInv.length} Items</span>
               <span>Val: {formatCurrency(filteredInventoryValue)}</span>
           </div>
           
           {/* Scrollable Items */}
           <div className="flex-1 overflow-y-auto p-2 pb-24"> {/* Added pb-24 for mobile scrolling */}
              
              {/* MOBILE GRID */}
              <div className="md:hidden grid grid-cols-2 gap-2">
                  {filteredInv.length === 0 ? (
                      <div className="col-span-2 flex flex-col items-center justify-center p-8 opacity-40 text-sm">
                          <Package size={32} className="mb-2 opacity-50"/>
                          <p>No items found.</p>
                      </div>
                  ) : (
                      filteredInv.map(i => (
                      <div key={i.id} className={`p-3 rounded-xl border flex flex-col h-full justify-between transition-all ${darkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-slate-200 shadow-sm'}`}>
                          
                          {/* Top: ID & Status */}
                          <div className="flex justify-between items-start mb-1">
                              <span className="font-mono text-blue-500 font-bold text-sm truncate">{i.suitId}</span>
                              {i.qty > 0 
                                ? <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]"></span> 
                                : <span className="w-2 h-2 rounded-full bg-rose-500 opacity-50"></span>
                              }
                          </div>
                          
                          {/* Middle: Brand */}
                          <span className={`text-xs font-medium truncate mb-2 ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>{i.brand}</span>
                          
                          {/* Bottom: Price & Actions */}
                          <div className="pt-2 border-t border-dashed border-gray-500/10 flex justify-between items-end mt-auto">
                              <div>
                                  <span className={`block font-bold text-sm leading-tight ${darkMode ? 'text-white' : 'text-gray-900'}`}>{i.salePrice}</span>
                                  <span className="text-[9px] font-medium opacity-50 block uppercase tracking-wide">Cost: {i.orgPrice}</span>
                              </div>
                              
                              {/* Only show actions if in stock */}
                              {i.qty > 0 && (
                                  <div className="flex gap-1">
                                      <button onClick={(e)=>{e.stopPropagation(); setEditingItem(i)}} className="p-1.5 bg-blue-500/10 text-blue-500 rounded-md active:bg-blue-500 active:text-white transition-colors">
                                          <Edit size={12}/>
                                      </button>
                                      <button onClick={(e)=>{e.stopPropagation(); setModalConfig({isOpen:true, id:i.id})}} className="p-1.5 bg-red-500/10 text-red-500 rounded-md active:bg-red-500 active:text-white transition-colors">
                                          <Trash2 size={12}/>
                                      </button>
                                  </div>
                              )}
                          </div>
                      </div>
                  )))}
              </div>

              {/* DESKTOP TABLE (Hidden on Mobile) */}
              <table className="hidden md:table w-full text-left text-sm table-fixed">
                 <thead className={`text-xs uppercase font-bold sticky top-0 z-10 backdrop-blur-md ${darkMode ? 'bg-slate-800/90 text-slate-400' : 'bg-white/90 text-gray-500 border-b border-gray-100'} shadow-sm`}><tr><th className="p-4 w-1/6 whitespace-nowrap">ID</th><th className="w-1/4 whitespace-nowrap">Brand</th><th className="text-right w-1/6 whitespace-nowrap">Cost</th><th className="text-right w-1/6 whitespace-nowrap">Sale</th><th className="text-center w-1/6 whitespace-nowrap">Status</th><th className="text-center w-1/6 whitespace-nowrap">Act</th></tr></thead>
                 <tbody className="divide-y divide-slate-200/10">
                    {filteredInv.length === 0 ? <tr><td colSpan="6" className="p-12 text-center opacity-40 text-sm">No items found.</td></tr> : filteredInv.map(i => (
                          <tr key={i.id} className={`transition-colors ${darkMode ? 'hover:bg-slate-700/50' : 'hover:bg-blue-50/50 border-b border-gray-50'}`}><td className="p-4 font-mono text-blue-500 font-bold truncate">{i.suitId}</td><td className={`truncate font-medium ${darkMode ? 'text-slate-300' : 'text-gray-700'}`}>{i.brand}</td><td className="text-right opacity-60 font-medium">{i.orgPrice}</td><td className={`text-right font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{i.salePrice}</td><td className="text-center">{i.qty>0?<span className="text-[10px] bg-emerald-500/10 text-emerald-500 px-2 py-1 rounded-full font-bold">Stock</span>:<span className="text-[10px] bg-rose-500/10 text-rose-500 px-2 py-1 rounded-full font-bold">Sold</span>}</td><td className="text-center flex justify-center gap-2 py-4">{i.qty>0 && <><button onClick={()=>setEditingItem(i)} className="hover:text-blue-500 p-2 hover:bg-blue-500/10 rounded transition-colors"><Edit size={16}/></button><button onClick={()=>setModalConfig({isOpen:true, id:i.id})} className="hover:text-red-500 p-2 hover:bg-red-500/10 rounded transition-colors"><Trash2 size={16}/></button></>}</td></tr>
                    ))}
                 </tbody>
              </table>
           </div>
        </div>
      </div>

      {/* EDIT MODAL */}
      {editingItem && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
            <div className={`p-6 sm:p-8 rounded-3xl w-full max-w-sm shadow-2xl relative max-h-[90vh] overflow-y-auto ${darkMode?'bg-slate-900 border border-slate-700':'bg-white'}`}>
                <h3 className={`font-bold text-xl mb-6 text-center ${darkMode ? 'text-white' : 'text-gray-900'}`}>Edit Inventory Item</h3>
                <form onSubmit={handleUpdateItem} className="space-y-4">
                  <div>
                      <label className="text-[10px] font-bold opacity-50 uppercase tracking-wider mb-1 block">Brand</label>
                      <input className={`w-full p-3 border rounded-xl bg-transparent outline-none text-base sm:text-sm focus:ring-2 focus:ring-blue-500 ${darkMode?'border-slate-600':'border-slate-200'}`} value={editingItem.brand} onChange={e=>setEditingItem({...editingItem, brand:e.target.value})}/>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="text-[10px] font-bold opacity-50 uppercase tracking-wider mb-1 block">Cost</label>
                        <input inputMode="numeric" type="number" onKeyDown={handleNumberInput} className={`w-full p-3 border rounded-xl bg-transparent outline-none text-base sm:text-sm focus:ring-2 focus:ring-blue-500 ${darkMode?'border-slate-600':'border-slate-200'}`} value={editingItem.orgPrice} onChange={e=>setEditingItem({...editingItem, orgPrice:e.target.value})}/>
                    </div>
                    <div>
                        <label className="text-[10px] font-bold opacity-50 uppercase tracking-wider mb-1 block">Sale</label>
                        <input inputMode="numeric" type="number" onKeyDown={handleNumberInput} className={`w-full p-3 border rounded-xl bg-transparent outline-none text-base sm:text-sm focus:ring-2 focus:ring-blue-500 ${darkMode?'border-slate-600':'border-slate-200'}`} value={editingItem.salePrice} onChange={e=>setEditingItem({...editingItem, salePrice:e.target.value})}/>
                    </div>
                  </div>
                  <div className="flex gap-3 mt-6"><button type="button" onClick={()=>setEditingItem(null)} className={`flex-1 py-3 rounded-xl font-bold transition-colors ${darkMode ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>Cancel</button><button className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-lg shadow-blue-500/20">Save Changes</button></div>
                </form>
            </div>
        </div>
      )}
    </div>
  );
}