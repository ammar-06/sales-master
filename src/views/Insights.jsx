import React, { useState, useMemo } from 'react';
import { AlertCircle, Trophy, Undo2, CheckCircle, ArrowLeft } from 'lucide-react';
import { formatCurrency } from '../utils/helpers';

export default function Insights({ customers, setViewingCustomer, setCustomerModalTab, darkMode }) {
  const [insightView, setInsightView] = useState(null);

  // LOGIC: >30 Days Old AND Zero Payments
  const riskCustomers = useMemo(() => {
    const now = new Date();
    return customers.filter(c => {
        if (c.status === 'deleted') return false; 
        const paid = c.totalPaid || 0;
        if (paid > 0) return false;
        if ((c.totalBill || 0) <= 0) return false;
        let dateToCheck = c.joinedAt;
        if (!dateToCheck) return false;
        const recordDate = new Date(dateToCheck.seconds * 1000);
        const diffTime = Math.abs(now - recordDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays > 30;
    });
  }, [customers]);

  const highVolumeCustomers = useMemo(() => {
    return customers.filter(c => c.status !== 'deleted' && ((c.totalBill || 0) - (c.totalPaid || 0)) > 10000);
  }, [customers]);

  const activeList = insightView === 'risk' ? riskCustomers : highVolumeCustomers;
  const isRiskView = insightView === 'risk';

  return (
    <div className="flex flex-col h-full overflow-hidden pb-20"> 
       <div className="p-4 sm:p-6 flex flex-col h-full">
           {!insightView && (
               <>
                <h2 className={`text-xl sm:text-2xl font-black mb-6 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Business Insights</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 overflow-y-auto">
                   {/* UPDATED BORDERS HERE */}
                   <div onClick={() => setInsightView('risk')} className={`p-6 sm:p-8 rounded-3xl border cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${darkMode ? 'bg-slate-800 border-slate-700 hover:border-red-500' : 'bg-white border-slate-300 shadow-slate-200/50 hover:border-red-400'}`}>
                       <div className="flex justify-between items-start mb-6">
                           <div className="p-4 bg-red-500/10 text-red-500 rounded-2xl"><AlertCircle size={24}/></div>
                           <div className={`text-3xl sm:text-4xl font-black ${darkMode ? 'text-white' : 'text-gray-900'}`}>{riskCustomers.length}</div>
                       </div>
                       <h3 className={`font-bold text-lg sm:text-xl mb-2 ${darkMode ? 'text-white' : 'text-gray-800'}`}>Payment Risk</h3>
                       <p className="text-xs sm:text-sm opacity-60">Customers who bought items over 30 days ago but paid nothing.</p>
                   </div>
                   {/* UPDATED BORDERS HERE */}
                   <div onClick={() => setInsightView('highVol')} className={`p-6 sm:p-8 rounded-3xl border cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${darkMode ? 'bg-slate-800 border-slate-700 hover:border-amber-500' : 'bg-white border-slate-300 shadow-slate-200/50 hover:border-amber-400'}`}>
                       <div className="flex justify-between items-start mb-6">
                           <div className="p-4 bg-amber-500/10 text-amber-500 rounded-2xl"><Trophy size={24}/></div>
                           <div className={`text-3xl sm:text-4xl font-black ${darkMode ? 'text-white' : 'text-gray-900'}`}>{highVolumeCustomers.length}</div>
                       </div>
                       <h3 className={`font-bold text-lg sm:text-xl mb-2 ${darkMode ? 'text-white' : 'text-gray-800'}`}>High Debt Volume</h3>
                       <p className="text-xs sm:text-sm opacity-60">Customers with remaining balance greater than Rs 10,000.</p>
                   </div>
               </div>
               </>
           )}

           {insightView && (
               <div className="flex flex-col h-full overflow-hidden">
                   <div className="shrink-0 mb-4">
                       <button onClick={() => setInsightView(null)} className={`mb-4 flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all active:scale-95 ${darkMode ? 'bg-slate-800 text-white hover:bg-slate-700' : 'bg-white text-slate-700 shadow-sm border border-slate-300 hover:bg-slate-50'}`}>
                           <ArrowLeft size={18}/> Back to Insights
                       </button>
                       <div>
                           <h3 className={`font-bold text-xl sm:text-2xl flex items-center gap-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                               {isRiskView ? <AlertCircle className="text-red-500"/> : <Trophy className="text-amber-500"/>}
                               {isRiskView ? 'Zero Payment Risk List' : 'High Debt Customers'}
                           </h3>
                           <p className={`text-sm mt-1 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                                {isRiskView ? "List of customers who have purchased items more than 30 days ago but have not made any payment yet." : "List of customers whose total pending balance exceeds Rs 10,000."}
                           </p>
                       </div>
                   </div>

                   <div className="flex-1 overflow-y-auto min-h-0 pr-1 pb-4">
                       {activeList.length === 0 ? (
                           <div className="h-full flex flex-col items-center justify-center text-center opacity-60 animate-fade-in">
                               <div className={`p-6 rounded-full mb-4 ${darkMode ? 'bg-slate-800' : 'bg-slate-100'}`}>
                                   <CheckCircle size={64} className={isRiskView ? "text-emerald-500" : "text-blue-500"} />
                               </div>
                               <h4 className={`text-xl font-bold mb-2 ${darkMode ? 'text-white' : 'text-gray-800'}`}>{isRiskView ? "No Risk Customers" : "No High Debt"}</h4>
                               <p className="text-sm max-w-xs mx-auto">{isRiskView ? "Great job! Everyone has made at least one payment or purchased recently." : "Excellent! No customer currently exceeds the high debt limit of Rs 10,000."}</p>
                           </div>
                       ) : (
                           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                               {activeList.map(c => (
                                   <div key={c.id} onClick={() => { setViewingCustomer(c); setCustomerModalTab('payments'); }} 
                                       // UPDATED BORDER
                                       className={`p-4 sm:p-5 rounded-2xl cursor-pointer border transition-all hover:shadow-lg hover:-translate-y-1 ${darkMode ? 'bg-slate-800 border-slate-700 hover:border-slate-600' : 'bg-white border-slate-300 hover:border-blue-300'}`}
                                   >
                                       <div className="flex justify-between items-start mb-3">
                                           <p className={`font-bold text-lg truncate pr-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>{c.name}</p>
                                           <span className={`font-bold text-sm whitespace-nowrap ${isRiskView ? 'text-red-500' : 'text-amber-500'}`}>{formatCurrency((c.totalBill||0)-(c.totalPaid||0))}</span>
                                       </div>
                                       <div className="space-y-1 mb-4">
                                            <div className="flex justify-between text-xs opacity-60"><span>Total Bill:</span><span className="font-mono">{formatCurrency(c.totalBill)}</span></div>
                                            <div className="flex justify-between text-xs opacity-60"><span>Joined:</span><span>{c.joinedAt ? new Date(c.joinedAt.seconds*1000).toLocaleDateString() : 'N/A'}</span></div>
                                       </div>
                                       <button className={`w-full py-2 text-xs font-bold rounded-xl transition-colors ${darkMode ? 'bg-slate-700 text-slate-300 hover:bg-slate-600' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>View Details</button>
                                   </div>
                               ))}
                           </div>
                       )}
                   </div>
               </div>
           )}
       </div>
    </div>
  );
}