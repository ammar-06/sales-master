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
  const [modalConfig, setModalConfig] = useState({ isOpen: false, type: null, id: null });
  const inventorySearchInput = useRef(null);

  const filteredInv = useMemo(() => {
    const upperSearch = inventorySearch.toUpperCase();
    const lowerSearch = inventorySearch.toLowerCase();
    const d = inventory.filter(i => (i.suitId?.includes(upperSearch) || i.brand?.toLowerCase().includes(lowerSearch)) && (!showAvailableOnly || i.qty > 0));
    return d.sort((a, b) => (a.suitId || '').localeCompare(b.suitId || '', undefined, { numeric: true, sensitivity: 'base' }));
  }, [inventory, inventorySearch, showAvailableOnly]);

  const filteredInventoryValue = useMemo(() => filteredInv.reduce((acc, item) => acc + (Number(item.orgPrice)||0), 0), [filteredInv]);

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
    <div className="flex flex-col h-full overflow-hidden pb-20">
      <ConfirmationModal isOpen={modalConfig.isOpen} onClose={()=>setModalConfig({...modalConfig, isOpen:false})} onConfirm={confirmDelete} title="Delete Item?" message="Cannot be undone." isDanger={true} darkMode={darkMode} />
      
      {/* INVENTORY LIST */}
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden rounded-2xl border shadow-sm" style={{ borderColor: darkMode ? '#334155' : '#e2e8f0' }}>
        
        {/* Header Block */}
        <div className={`shrink-0 ${darkMode?'bg-slate-800':'bg-white'}`}>
           <div className={`p-4 border-b flex gap-3 items-center z-20 ${darkMode ? 'border-slate-700' : 'border-slate-100'}`}>
               <Search size={20} className="opacity-50"/>
               <input ref={inventorySearchInput} className="bg-transparent outline-none flex-1 text-base font-medium" placeholder="Search stock..." value={inventorySearch} onChange={e=>setInventorySearch(e.target.value)}/>
           </div>
           <div className={`px-6 py-3 shrink-0 text-xs font-bold uppercase tracking-wider flex justify-between z-20 ${darkMode ? 'bg-slate-900/50 text-slate-400' : 'bg-gray-50 text-slate-500'}`}>
               <span>{filteredInv.length} Items</span>
               <span>Val: {formatCurrency(filteredInventoryValue)}</span>
           </div>
        </div>
           
        {/* List Content - REMOVED PADDING p-2 to fix GAP */}
        <div className={`flex-1 overflow-y-auto ${darkMode ? 'bg-slate-900' : 'bg-white'}`}>
              
              {/* MOBILE GRID - ADDED PADDING HERE INSTEAD */}
              <div className="md:hidden grid grid-cols-2 gap-2 pb-24 p-2">
                  {filteredInv.length === 0 ? (
                      <div className="col-span-2 flex flex-col items-center justify-center p-8 opacity-40 text-sm"><Package size={32} className="mb-2 opacity-50"/><p>No items found.</p></div>
                  ) : (
                      filteredInv.map(i => (
                      <div key={i.id} className={`p-3 rounded-xl border flex flex-col justify-between ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
                          <div>
                              <div className="flex justify-between items-start mb-1"><span className="font-mono text-blue-500 font-bold text-sm truncate">{i.suitId}</span>{i.qty > 0 ? <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-sm"></span> : <span className="w-2 h-2 rounded-full bg-rose-500 opacity-50"></span>}</div>
                              <span className={`text-xs font-medium truncate block mb-2 ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>{i.brand}</span>
                          </div>
                          <div className="pt-2 border-t border-dashed border-gray-500/20 flex justify-between items-end">
                              <div><span className={`block font-bold text-sm ${darkMode ? 'text-white' : 'text-gray-900'}`}>{i.salePrice}</span><span className="text-[9px] opacity-60">Cost: {i.orgPrice}</span></div>
                              {i.qty > 0 && (<div className="flex gap-1"><button onClick={(e)=>{e.stopPropagation(); setEditingItem(i)}} className="p-1.5 bg-blue-500/10 text-blue-500 rounded active:scale-95"><Edit size={12}/></button><button onClick={(e)=>{e.stopPropagation(); setModalConfig({isOpen:true, id:i.id})}} className="p-1.5 bg-red-500/10 text-red-500 rounded active:scale-95"><Trash2 size={12}/></button></div>)}
                          </div>
                      </div>
                  )))}
              </div>

              {/* DESKTOP TABLE - SOLID HEADER */}
              <table className="hidden md:table w-full text-left text-sm table-fixed">
                 {/* Sticky Header with Solid Background */}
                 <thead className={`sticky top-0 z-30 shadow-sm ${darkMode ? 'bg-slate-800' : 'bg-white'}`}>
                    <tr className={`text-xs uppercase font-bold ${darkMode ? 'text-slate-400' : 'text-gray-500 border-b border-gray-100'}`}>
                        <th className="p-4 w-1/6">ID</th>
                        <th className="w-1/4">Brand</th>
                        <th className="text-right w-1/6">Cost</th>
                        <th className="text-right w-1/6">Sale</th>
                        <th className="text-center w-1/6">Status</th>
                        <th className="text-center w-1/6">Act</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-200/10">
                    {filteredInv.length === 0 ? <tr><td colSpan="6" className="p-12 text-center opacity-40 text-sm">No items found.</td></tr> : filteredInv.map(i => (
                          <tr key={i.id} className={`transition-colors ${darkMode ? 'hover:bg-slate-800' : 'hover:bg-blue-50/50 border-b border-gray-50'}`}>
                              <td className="p-4 font-mono text-blue-500 font-bold truncate">{i.suitId}</td>
                              <td className={`truncate font-medium ${darkMode ? 'text-slate-300' : 'text-gray-700'}`}>{i.brand}</td>
                              <td className="text-right opacity-60 font-medium">{i.orgPrice}</td>
                              <td className={`text-right font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{i.salePrice}</td>
                              <td className="text-center">{i.qty>0?<span className="text-[10px] bg-emerald-500/10 text-emerald-500 px-2 py-1 rounded-full font-bold">Stock</span>:<span className="text-[10px] bg-rose-500/10 text-rose-500 px-2 py-1 rounded-full font-bold">Sold</span>}</td>
                              <td className="text-center flex justify-center gap-2 py-4">{i.qty>0 && <><button onClick={()=>setEditingItem(i)} className="hover:text-blue-500 p-2 hover:bg-blue-500/10 rounded transition-colors"><Edit size={16}/></button><button onClick={()=>setModalConfig({isOpen:true, id:i.id})} className="hover:text-red-500 p-2 hover:bg-red-500/10 rounded transition-colors"><Trash2 size={16}/></button></>}</td>
                          </tr>
                    ))}
                 </tbody>
              </table>
        </div>
      </div>

      {/* EDIT MODAL */}
      {editingItem && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
            <div className={`p-6 sm:p-8 rounded-3xl w-full max-w-sm shadow-2xl relative max-h-[90vh] overflow-y-auto ${darkMode?'bg-slate-900 border border-slate-700':'bg-white'}`}>
                <h3 className={`font-bold text-xl mb-6 text-center ${darkMode ? 'text-white' : 'text-gray-900'}`}>Edit Inventory Item</h3>
                <form onSubmit={handleUpdateItem} className="space-y-4">
                  <div><label className="text-[10px] font-bold opacity-50 uppercase tracking-wider mb-1 block">Brand</label><input className={`w-full p-3 border rounded-xl bg-transparent outline-none text-base focus:ring-2 focus:ring-blue-500 ${darkMode?'border-slate-600':'border-slate-200'}`} value={editingItem.brand} onChange={e=>setEditingItem({...editingItem, brand:e.target.value})}/></div>
                  <div className="grid grid-cols-2 gap-4">
                    <div><label className="text-[10px] font-bold opacity-50 uppercase tracking-wider mb-1 block">Cost</label><input inputMode="numeric" type="number" onKeyDown={handleNumberInput} className={`w-full p-3 border rounded-xl bg-transparent outline-none text-base focus:ring-2 focus:ring-blue-500 ${darkMode?'border-slate-600':'border-slate-200'}`} value={editingItem.orgPrice} onChange={e=>setEditingItem({...editingItem, orgPrice:e.target.value})}/></div>
                    <div><label className="text-[10px] font-bold opacity-50 uppercase tracking-wider mb-1 block">Sale</label><input inputMode="numeric" type="number" onKeyDown={handleNumberInput} className={`w-full p-3 border rounded-xl bg-transparent outline-none text-base focus:ring-2 focus:ring-blue-500 ${darkMode?'border-slate-600':'border-slate-200'}`} value={editingItem.salePrice} onChange={e=>setEditingItem({...editingItem, salePrice:e.target.value})}/></div>
                  </div>
                  <div className="flex gap-3 mt-6"><button type="button" onClick={()=>setEditingItem(null)} className={`flex-1 py-3 rounded-xl font-bold transition-colors ${darkMode ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>Cancel</button><button className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-lg shadow-blue-500/20">Save Changes</button></div>
                </form>
            </div>
        </div>
      )}
    </div>
  );
}