import React, { useState, useRef } from 'react';
import { collection, doc, writeBatch, serverTimestamp } from 'firebase/firestore';
import { Plus, Save } from 'lucide-react';
import { db, appId } from '../config/firebase';
import { handleNumberInput, chunkArray } from '../utils/helpers';

const surface = '#1C2530';
const border  = '#2E3A47';
const primary = '#F0F4F8';
const faint   = '#5E7080';

const inputCls = {
  background: surface,
  border: `1px solid ${border}`,
  borderRadius: 8,
  color: primary,
  outline: 'none',
  width: '100%',
  padding: '11px 14px',
  fontSize: 14,
  transition: 'border-color 150ms ease, box-shadow 150ms ease',
};
const fi = e => { e.target.style.borderColor = '#F5A623'; e.target.style.boxShadow = '0 0 0 3px rgba(245,166,35,0.15)'; };
const fo = e => { e.target.style.borderColor = border;    e.target.style.boxShadow = 'none'; };

function Label({ children }) {
  return (
    <label className="block mb-2 uppercase font-semibold" style={{ fontSize: 11, letterSpacing: '0.06em', color: faint }}>{children}</label>
  );
}

export default function AddStock({ inventory, user, showToast }) {
  const [dressForm, setDressForm] = useState({ suitIds: '', brand: '', orgPrice: '', salePrice: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const idsInputRef = useRef(null);

  const handleAddDress = async (e) => {
    e.preventDefault();
    if (!user || isSubmitting) return;

    if (!dressForm.suitIds.trim())                               { showToast('Product IDs missing!', 'error');   return; }
    if (!dressForm.brand.trim())                                 { showToast('Brand required!', 'error');         return; }
    if (!dressForm.orgPrice || Number(dressForm.orgPrice) <= 0) { showToast('Invalid Cost Price', 'error');      return; }
    if (!dressForm.salePrice || Number(dressForm.salePrice) <= 0){ showToast('Invalid Sale Price', 'error');     return; }
    if (Number(dressForm.salePrice) < Number(dressForm.orgPrice)){ showToast('Sale Price < Cost!', 'error');     return; }

    setIsSubmitting(true);
    const newSuitIds = dressForm.suitIds.split(/[\s,]+/).map(s => s.trim().toUpperCase()).filter(Boolean);
    const uniqueInputIds = new Set(newSuitIds);
    if (newSuitIds.length === 0)                          { showToast('Invalid IDs', 'error'); setIsSubmitting(false); return; }
    if (uniqueInputIds.size !== newSuitIds.length)        { showToast('Duplicate IDs in input!', 'error'); setIsSubmitting(false); return; }
    const duplicates = newSuitIds.filter(id => inventory.some(i => i.suitId === id));
    if (duplicates.length > 0)                            { showToast(`Already exists: ${duplicates.join(', ')}`, 'error'); setIsSubmitting(false); return; }

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
            createdAt: serverTimestamp(),
          });
        });
        await batch.commit();
      }
      setDressForm({ suitIds: '', brand: '', orgPrice: '', salePrice: '' });
      showToast(`Added ${newSuitIds.length} item${newSuitIds.length > 1 ? 's' : ''} successfully!`);
    } catch { showToast('Failed to add stock', 'error'); }
    finally  { setIsSubmitting(false); }
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto items-center justify-center py-8 px-4">
      <div className="w-full max-w-xl p-6 sm:p-8 rounded-card" style={{ background: surface, border: `0.5px solid ${border}` }}>

        {/* Header */}
        <div className="text-center mb-7">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full mb-4" style={{ background: 'rgba(245,166,35,0.12)', color: '#F5A623' }}>
            <Plus size={28}/>
          </div>
          <h2 className="text-2xl font-bold" style={{ color: primary }}>Add New Stock</h2>
          <p className="mt-1 text-sm" style={{ color: faint }}>Enter details below to add items to inventory.</p>
        </div>

        <form onSubmit={handleAddDress} className="space-y-5">
          <div>
            <Label>Product IDs (comma or space separated)</Label>
            <textarea
              ref={idsInputRef}
              required
              style={{ ...inputCls, fontFamily: 'monospace', resize: 'none', minHeight: 90, borderRadius: 8 }}
              value={dressForm.suitIds}
              onChange={e => setDressForm({ ...dressForm, suitIds: e.target.value })}
              placeholder="A1, A2, B1..."
              onFocus={fi} onBlur={fo}
            />
          </div>

          <div>
            <Label>Brand Name</Label>
            <input
              required
              style={inputCls}
              value={dressForm.brand}
              onChange={e => setDressForm({ ...dressForm, brand: e.target.value })}
              placeholder="e.g. Khaadi, Gul Ahmed"
              onFocus={fi} onBlur={fo}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Cost Price</Label>
              <input
                inputMode="numeric" type="number" onKeyDown={handleNumberInput}
                style={inputCls}
                value={dressForm.orgPrice}
                onChange={e => setDressForm({ ...dressForm, orgPrice: e.target.value })}
                placeholder="0"
                onFocus={fi} onBlur={fo}
              />
            </div>
            <div>
              <Label>Sale Price</Label>
              <input
                inputMode="numeric" type="number" onKeyDown={handleNumberInput}
                style={inputCls}
                value={dressForm.salePrice}
                onChange={e => setDressForm({ ...dressForm, salePrice: e.target.value })}
                placeholder="0"
                onFocus={fi} onBlur={fo}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-40"
            style={{ background: '#F5A623', color: '#0F1520' }}
            onMouseEnter={e => { if (!isSubmitting) e.currentTarget.style.background = '#E09410'; }}
            onMouseLeave={e => { e.currentTarget.style.background = '#F5A623'; }}
          >
            <Save size={16}/> {isSubmitting ? 'Adding...' : 'Save Stock'}
          </button>
        </form>
      </div>
    </div>
  );
}