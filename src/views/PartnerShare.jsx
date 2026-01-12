import React, { useState, useMemo } from 'react';
import { writeBatch, doc, serverTimestamp } from 'firebase/firestore';
import { AlertTriangle, History } from 'lucide-react';
import { db, appId } from '../config/firebase';
import { formatCurrency, playSound } from '../utils/helpers';

export default function PartnerShare({ sales, stats, user, showToast, darkMode }) {
  const [mamaTab, setMamaTab] = useState('pending');
  const [selectedMamaSales, setSelectedMamaSales] = useState([]);

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
    if (allSelected) { setSelectedMamaSales([]); } else { setSelectedMamaSales(pendingMamaSales.map(s => s.id)); }
  };

  return (
    <div className="space-y-6 h-auto lg:h-full flex flex-col pb-20">
       <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 shrink-0">
          <div className={`p-4 sm:p-5 text-center rounded-2xl border shadow-sm ${darkMode?'bg-slate-800 border-slate-700':'bg-white border-slate-200 shadow-slate-200/50'}`}><p className="text-xs font-bold opacity-50 uppercase mb-1">Total</p><p className="text-xl font-black text-blue-500">{formatCurrency(stats.mamaTotal)}</p></div>
          <div className={`p-4 sm:p-5 text-center rounded-2xl border shadow-sm ${darkMode?'bg-slate-800 border-slate-700':'bg-white border-slate-200 shadow-slate-200/50'}`}><p className="text-xs font-bold opacity-50 uppercase mb-1">Pending</p><p className="text-xl font-black text-rose-500">{formatCurrency(stats.mamaPending)}</p></div>
          <div className={`p-4 sm:p-5 text-center rounded-2xl border shadow-sm ${darkMode?'bg-slate-800 border-slate-700':'bg-white border-slate-200 shadow-slate-200/50'}`}><p className="text-xs font-bold opacity-50 uppercase mb-1">Paid</p><p className="text-xl font-black text-emerald-500">{formatCurrency(stats.mamaPaid)}</p></div>
       </div>
       
       <div className="flex gap-3 shrink-0 overflow-x-auto">
          <button onClick={() => setMamaTab('pending')} className={`flex-1 min-w-fit px-4 py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all active:scale-95 ${mamaTab === 'pending' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' : 'bg-gray-100 text-gray-500 dark:bg-slate-800 dark:text-slate-400 hover:bg-gray-200 dark:hover:bg-slate-700'}`}>
             <AlertTriangle size={18} /> <span className="whitespace-nowrap">Pending</span>
          </button>
          <button onClick={() => setMamaTab('paid')} className={`flex-1 min-w-fit px-4 py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all active:scale-95 ${mamaTab === 'paid' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/30' : 'bg-gray-100 text-gray-500 dark:bg-slate-800 dark:text-slate-400 hover:bg-gray-200 dark:hover:bg-slate-700'}`}>
             <History size={18} /> <span className="whitespace-nowrap">History</span>
          </button>
       </div>
       
       <div className={`rounded-2xl border flex flex-col lg:overflow-hidden shadow-sm ${darkMode?'bg-slate-800 border-slate-700':'bg-white border-slate-200 shadow-slate-200/50'}`}>
          <div className={`p-4 sm:p-5 border-b flex shrink-0 justify-between items-center ${darkMode ? 'border-slate-700' : 'border-slate-100'}`}>
              <h3 className={`font-bold flex gap-2 items-center text-base sm:text-lg ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  {mamaTab === 'pending' ? <><AlertTriangle size={20} className="text-rose-500"/> Pending</> : <><History size={20} className="text-emerald-500"/> Paid</>}
              </h3>
              {mamaTab === 'pending' && selectedMamaSales.length > 0 && <button onClick={()=>handleMarkMamaPaid(true)} className="bg-rose-500 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-lg shadow-rose-500/30 transition-all active:scale-95">Pay ({selectedMamaSales.length})</button>}
          </div>

          <div className="flex-1 lg:overflow-auto">
              <div className="md:hidden grid grid-cols-1 sm:grid-cols-2 gap-2 p-2">
                  {mamaTab === 'pending' ? (
                     sortedPendingMamaSales.length === 0 ? <div className="col-span-2 p-8 text-center opacity-40 text-sm">No pending payments</div> :
                     sortedPendingMamaSales.map(s => (
                         <div key={s.id} onClick={() => toggleMamaSelection(s.id)} className={`p-3 rounded-xl border flex gap-3 ${selectedMamaSales.includes(s.id) ? 'bg-rose-500/10 border-rose-500/30' : (darkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-gray-100')}`}>
                             <div className="pt-1"><input type="checkbox" checked={selectedMamaSales.includes(s.id)} readOnly className="w-4 h-4 accent-rose-500"/></div>
                             <div className="flex-1">
                                 <div className="flex justify-between">
                                      <span className={`text-sm font-medium ${darkMode ? 'text-slate-200' : 'text-gray-700'}`}>{s.suitId}</span>
                                      <span className="text-sm font-bold text-rose-500">{s.mamaShare}</span>
                                 </div>
                                 <span className="text-xs opacity-50 block">{s.brand}</span>
                             </div>
                         </div>
                     ))
                  ) : (
                     sortedPaidMamaSales.length === 0 ? <div className="col-span-2 p-8 text-center opacity-40 text-sm">No history</div> :
                     sortedPaidMamaSales.map(s => (
                         <div key={s.id} className={`p-3 rounded-xl border flex justify-between items-center ${darkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-gray-100'}`}>
                             <div>
                                 <span className={`block text-sm font-medium ${darkMode ? 'text-slate-200' : 'text-gray-700'}`}>{s.suitId}</span>
                                 <span className="text-[10px] opacity-50 block">{s.mamaPaidAt ? new Date(s.mamaPaidAt.seconds * 1000).toLocaleDateString() : '-'}</span>
                             </div>
                             <span className="text-sm font-bold text-emerald-500">{s.mamaShare}</span>
                         </div>
                     ))
                  )}
              </div>

              <table className="hidden md:table w-full text-left text-sm table-fixed">
                 <thead className={`text-xs uppercase font-bold sticky top-0 z-10 backdrop-blur-md ${darkMode ? 'bg-slate-800/90 text-slate-400' : 'bg-white/90 text-gray-500 border-b border-gray-100'} shadow-sm`}>
                   <tr>
                       {mamaTab === 'pending' && <th className="p-4 w-16 text-center"><input type="checkbox" checked={sales.filter(s => !s.mamaPaid).length > 0 && sales.filter(s => !s.mamaPaid).every(s => selectedMamaSales.includes(s.id))} onChange={handleSelectAllMama} className="cursor-pointer w-4 h-4 accent-blue-500"/></th>}
                       <th className="p-4">Item Details</th>
                       {mamaTab === 'paid' && <th className="text-center">Paid Date</th>}
                       <th className="text-right w-32 p-4">Share Amount</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-200/10">
                    {mamaTab === 'pending' ? (
                     sortedPendingMamaSales.map(s => (
                          <tr key={s.id} className={`cursor-pointer transition-colors ${selectedMamaSales.includes(s.id) ? 'bg-rose-500/10' : (darkMode ? 'hover:bg-slate-700/30' : 'hover:bg-gray-50')}`} onClick={() => toggleMamaSelection(s.id)}>
                             <td className="p-4 text-center"><input type="checkbox" checked={selectedMamaSales.includes(s.id)} readOnly className="w-4 h-4 accent-rose-500 pointer-events-none"/></td>
                             <td className={`truncate font-medium ${darkMode ? 'text-slate-200' : 'text-gray-700'}`}>{s.suitId} <span className="opacity-50 text-xs font-normal ml-2">({s.brand})</span></td>
                             <td className="text-right font-bold text-rose-500 p-4">{s.mamaShare}</td>
                          </tr>
                     ))
                    ) : (
                     sortedPaidMamaSales.map(s => (
                          <tr key={s.id} className={`transition-colors ${darkMode ? 'hover:bg-slate-700/30' : 'hover:bg-gray-50'}`}>
                             <td className={`p-4 truncate font-medium ${darkMode ? 'text-slate-200' : 'text-gray-700'}`}>{s.suitId} <span className="opacity-50 text-xs font-normal ml-2">({s.brand})</span></td>
                             <td className="text-center text-xs opacity-60">{s.mamaPaidAt ? new Date(s.mamaPaidAt.seconds * 1000).toLocaleDateString() : '-'}</td>
                             <td className="text-right font-bold text-emerald-500 p-4">{s.mamaShare}</td>
                          </tr>
                     ))
                    )}
                 </tbody>
              </table>
          </div>
       </div>
    </div>
  );
}