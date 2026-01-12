import React, { useState, useMemo, useRef } from 'react';
import { Search, Package } from 'lucide-react';
import { formatCurrency } from '../utils/helpers';

export default function AvailableStock({ inventory, darkMode }) {
  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef(null);

  const availableItems = useMemo(() => {
    const upperSearch = searchQuery.toUpperCase();
    const lowerSearch = searchQuery.toLowerCase();
    
    return inventory
      .filter(i => i.qty > 0 && (i.suitId?.includes(upperSearch) || i.brand?.toLowerCase().includes(lowerSearch)))
      .sort((a, b) => (a.suitId || '').localeCompare(b.suitId || '', undefined, { numeric: true, sensitivity: 'base' }));
  }, [inventory, searchQuery]);

  const totalValue = useMemo(() => availableItems.reduce((acc, item) => acc + (Number(item.orgPrice)||0), 0), [availableItems]);

  return (
    <div className="flex flex-col h-full overflow-hidden pb-20">
      <div className="flex-1 flex flex-col overflow-hidden min-h-0">
        <div className={`rounded-2xl border flex flex-col h-full shadow-sm ${darkMode?'bg-slate-800 border-slate-700':'bg-white border-slate-200 shadow-slate-200/50'}`}>
           
           {/* Header */}
           <div className={`p-4 border-b flex shrink-0 gap-3 items-center z-20 ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100'} rounded-t-2xl`}>
               <Search size={20} className="opacity-50"/>
               <input ref={searchInputRef} className="bg-transparent outline-none flex-1 text-base font-medium" placeholder="Search available items..." value={searchQuery} onChange={e=>setSearchQuery(e.target.value)}/>
           </div>
           
           {/* Stats Bar */}
           <div className={`px-6 py-3 shrink-0 text-xs font-bold uppercase tracking-wider flex justify-between z-20 ${darkMode ? 'bg-slate-900/50 text-slate-400' : 'bg-gray-50 text-slate-500'}`}>
               <span>{availableItems.length} Available</span>
               <span>Total Value: {formatCurrency(totalValue)}</span>
           </div>
           
           {/* List Content - REMOVED PADDING p-2 to fix GAP */}
           <div className={`flex-1 overflow-y-auto ${darkMode ? 'bg-slate-900' : 'bg-white'}`}>
              
              {/* MOBILE GRID - ADDED PADDING HERE */}
              <div className="md:hidden grid grid-cols-2 gap-2 pb-24 p-2">
                  {availableItems.length === 0 ? (
                      <div className="col-span-2 flex flex-col items-center justify-center p-8 opacity-40 text-sm"><Package size={32} className="mb-2 opacity-50"/><p>No available stock found.</p></div>
                  ) : (
                      availableItems.map(i => (
                      <div key={i.id} className={`p-3 rounded-xl border flex flex-col justify-between ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200 shadow-sm'}`}>
                          <div>
                              <div className="flex justify-between items-start mb-1"><span className="font-mono text-blue-500 font-bold text-sm truncate">{i.suitId}</span><span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]"></span></div>
                              <span className={`text-xs font-medium truncate block mb-2 ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>{i.brand}</span>
                          </div>
                          <div className="pt-2 border-t border-dashed border-gray-500/20 flex justify-between items-end">
                              <div><span className={`block font-bold text-sm ${darkMode ? 'text-white' : 'text-gray-900'}`}>{i.salePrice}</span><span className="text-[9px] opacity-60">Cost: {i.orgPrice}</span></div>
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
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-200/10">
                    {availableItems.length === 0 ? <tr><td colSpan="5" className="p-12 text-center opacity-40 text-sm">No available stock found.</td></tr> : availableItems.map(i => (
                          <tr key={i.id} className={`transition-colors ${darkMode ? 'hover:bg-slate-800' : 'hover:bg-blue-50/50 border-b border-gray-50'}`}>
                              <td className="p-4 font-mono text-blue-500 font-bold truncate">{i.suitId}</td>
                              <td className={`truncate font-medium ${darkMode ? 'text-slate-300' : 'text-gray-700'}`}>{i.brand}</td>
                              <td className="text-right opacity-60 font-medium">{i.orgPrice}</td>
                              <td className={`text-right font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{i.salePrice}</td>
                              <td className="text-center"><span className="text-[10px] bg-emerald-500/10 text-emerald-500 px-2 py-1 rounded-full font-bold">In Stock</span></td>
                          </tr>
                    ))}
                 </tbody>
              </table>
           </div>
        </div>
      </div>
    </div>
  );
}