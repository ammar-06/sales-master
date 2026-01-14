import React from 'react';
import { Loader2, XCircle, CheckCircle, X, Trash2, RotateCcw } from 'lucide-react';

export const LoadingSpinner = () => (
  <div className="flex items-center justify-center p-4 h-full">
    <Loader2 className="animate-spin text-blue-600" size={32} />
  </div>
);

export const ToastContainer = ({ toasts, removeToast }) => (
  // FIX: Z-Index increased to 300 (Higher than Modal's 250)
  <div className="fixed bottom-4 right-4 z-[300] flex flex-col gap-2 w-full max-w-xs px-4 md:px-0 pointer-events-none">
    {toasts.map(toast => (
      <div key={toast.id} className={`pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl text-white transform transition-all duration-300 animate-slide-in ${toast.type === 'error' ? 'bg-red-600' : 'bg-emerald-600'}`}>
        {toast.type === 'error' ? <XCircle size={20} className="shrink-0" /> : <CheckCircle size={20} className="shrink-0" />}
        <p className="text-sm font-medium flex-1">{toast.message}</p>
        <button onClick={() => removeToast(toast.id)} className="ml-2 opacity-80 hover:opacity-100"><X size={16}/></button>
      </div>
    ))}
  </div>
);

export const ConfirmationModal = ({ isOpen, onClose, onConfirm, title, message, isDanger, darkMode }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[250] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
      <div className={`p-6 rounded-2xl shadow-2xl w-[95%] max-w-sm transform transition-all scale-100 ${darkMode ? 'bg-slate-900 border border-slate-700' : 'bg-white'}`}>
        <div className="flex flex-col items-center text-center">
          <div className={`p-4 rounded-full mb-4 ${isDanger ? (darkMode ? 'bg-red-900/30 text-red-500' : 'bg-red-50 text-red-600') : (darkMode ? 'bg-blue-900/30 text-blue-500' : 'bg-blue-50 text-blue-600')}`}>
            {isDanger ? <Trash2 size={32} /> : <RotateCcw size={32} />}
          </div>
          <h3 className={`text-xl font-bold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>{title}</h3>
          <p className={`text-sm mb-6 ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>{message}</p>
          <div className="flex flex-col sm:flex-row gap-3 w-full">
            <button onClick={onClose} className={`flex-1 py-3 rounded-xl font-bold transition-colors ${darkMode ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>Cancel</button>
            <button onClick={onConfirm} className={`flex-1 py-3 rounded-xl font-bold text-white shadow-lg transition-all active:scale-95 ${isDanger ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'}`}>{isDanger ? 'Confirm' : 'Proceed'}</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export const Card = ({ title, value, subtext, icon: Icon, colorClass, darkMode, iconBgClass, iconTextClass }) => (
  <div className={`p-3 sm:p-5 rounded-2xl shadow-sm border flex flex-col justify-between transition-all duration-300 ease-out hover:scale-[1.03] hover:shadow-xl active:scale-95 cursor-default h-full ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-300'}`}>
    <div className="flex justify-between items-start mb-2 sm:mb-4">
       <div className={`p-2 rounded-xl shadow-sm ${darkMode ? colorClass : iconBgClass}`}>
          <Icon size={18} className={`${darkMode ? 'text-white' : iconTextClass}`} />
       </div>
    </div>
    <div>
       <p className={`text-[10px] font-bold uppercase tracking-wider mb-1 ${darkMode ? 'text-slate-400' : 'text-gray-400'}`}>{title}</p>
       <h3 className={`text-lg sm:text-3xl font-black break-words leading-tight ${darkMode ? 'text-white' : 'text-gray-900'}`}>{value}</h3>
       {subtext && <p className={`text-[10px] sm:text-xs mt-1 font-medium ${darkMode ? 'text-slate-500' : 'text-gray-400'}`}>{subtext}</p>}
    </div>
  </div>
);