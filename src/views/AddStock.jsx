import React, { useState, useRef } from 'react';
import { collection, doc, writeBatch, serverTimestamp } from 'firebase/firestore';
import { Plus, Save } from 'lucide-react';
import { db, appId } from '../config/firebase';
import { handleNumberInput, chunkArray, playSound } from '../utils/helpers';

export default function AddStock({ inventory, user, showToast, darkMode }) {
  const [dressForm, setDressForm] = useState({ suitIds: '', brand: '', orgPrice: '', salePrice: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const idsInputRef = useRef(null);

  const handleAddDress = async (e) => {
    e.preventDefault();
    if (!user || isSubmitting) return;
    
    // --- Validation Logic (Same as before) ---
    if (!dressForm.suitIds.trim()) { showToast("Product IDs missing!", 'error'); playSound('error'); return; }
    if (!dressForm.brand.trim()) { showToast("Brand required!", 'error'); playSound('error'); return; }
    if (!dressForm.orgPrice || Number(dressForm.orgPrice) <= 0) { showToast("Invalid Cost", 'error'); playSound('error'); return; }
    if (!dressForm.salePrice || Number(dressForm.salePrice) <= 0) { showToast("Invalid Sale Price", 'error'); playSound('error'); return; }
    if (Number(dressForm.salePrice) < Number(dressForm.orgPrice)) { showToast("Sale Price < Cost!", 'error'); playSound('error'); return; }

    setIsSubmitting(true);
    const newSuitIds = dressForm.suitIds.split(/[\s,]+/).map(s => s.trim().toUpperCase()).filter(s => s !== "");
    const uniqueInputIds = new Set(newSuitIds);
    if (newSuitIds.length === 0) { showToast("Invalid IDs", 'error'); setIsSubmitting(false); return; }
    if (uniqueInputIds.size !== newSuitIds.length) { showToast("Duplicate IDs in input!", 'error'); setIsSubmitting(false); playSound('error'); return; }

    // Check against existing inventory
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
      showToast(`Success! Added ${newSuitIds.length} items.`); playSound('success');
    } catch (err) { showToast("Failed to add stock", 'error'); } finally { setIsSubmitting(false); }
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto p-4 sm:p-8 items-center justify-center">
        <div className={`w-full max-w-2xl p-6 sm:p-10 rounded-3xl border shadow-xl transition-all ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100 shadow-slate-200/50'}`}>
            <div className="text-center mb-8">
                <div className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4 ${darkMode ? 'bg-blue-900/30 text-blue-400' : 'bg-blue-50 text-blue-600'}`}>
                    <Plus size={32} />
                </div>
                <h2 className={`text-2xl sm:text-3xl font-black ${darkMode ? 'text-white' : 'text-gray-900'}`}>Add New Stock</h2>
                <p className={`mt-2 text-sm ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>Enter details below to add items to your inventory.</p>
            </div>

            <form onSubmit={handleAddDress} className="space-y-6">
                <div>
                    <label className="text-xs font-bold opacity-50 uppercase tracking-wider mb-2 block ml-1">Product IDs (Comma or Space separated)</label>
                    <textarea ref={idsInputRef} required className={`w-full p-4 border rounded-2xl bg-transparent outline-none text-base font-mono focus:ring-2 focus:ring-blue-500 transition-all resize-none min-h-[100px] ${darkMode?'border-slate-600 focus:bg-slate-900':'border-slate-200 focus:bg-gray-50'}`} value={dressForm.suitIds} onChange={e=>setDressForm({...dressForm, suitIds:e.target.value})} placeholder="A1, A2, B1..."/>
                </div>
                
                <div>
                    <label className="text-xs font-bold opacity-50 uppercase tracking-wider mb-2 block ml-1">Brand Name</label>
                    <input required className={`w-full p-4 border rounded-2xl bg-transparent outline-none text-base focus:ring-2 focus:ring-blue-500 transition-all ${darkMode?'border-slate-600 focus:bg-slate-900':'border-slate-200 focus:bg-gray-50'}`} value={dressForm.brand} onChange={e=>setDressForm({...dressForm, brand:e.target.value})} placeholder="e.g. Khaadi, Gul Ahmed"/>
                </div>

                <div className="grid grid-cols-2 gap-4 sm:gap-6">
                    <div>
                        <label className="text-xs font-bold opacity-50 uppercase tracking-wider mb-2 block ml-1">Cost Price</label>
                        <input inputMode="numeric" type="number" onKeyDown={handleNumberInput} className={`w-full p-4 border rounded-2xl bg-transparent outline-none text-base focus:ring-2 focus:ring-blue-500 transition-all ${darkMode?'border-slate-600 focus:bg-slate-900':'border-slate-200 focus:bg-gray-50'}`} value={dressForm.orgPrice} onChange={e=>setDressForm({...dressForm, orgPrice:e.target.value})} placeholder="0"/>
                    </div>
                    <div>
                        <label className="text-xs font-bold opacity-50 uppercase tracking-wider mb-2 block ml-1">Sale Price</label>
                        <input inputMode="numeric" type="number" onKeyDown={handleNumberInput} className={`w-full p-4 border rounded-2xl bg-transparent outline-none text-base focus:ring-2 focus:ring-blue-500 transition-all ${darkMode?'border-slate-600 focus:bg-slate-900':'border-slate-200 focus:bg-gray-50'}`} value={dressForm.salePrice} onChange={e=>setDressForm({...dressForm, salePrice:e.target.value})} placeholder="0"/>
                    </div>
                </div>

                <button disabled={isSubmitting} className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-2xl font-bold text-lg shadow-lg shadow-blue-500/30 transition-all active:scale-95 flex items-center justify-center gap-2">
                    <Save size={20}/> {isSubmitting ? "Adding..." : "Save Stock"}
                </button>
            </form>
        </div>
    </div>
  );
}