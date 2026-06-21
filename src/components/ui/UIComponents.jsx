import React from 'react';
import { Loader2, XCircle, CheckCircle, X, Trash2, RotateCcw } from 'lucide-react';

export const LoadingSpinner = () => (
  <div className="flex items-center justify-center p-4 h-full">
    <Loader2 className="animate-spin" style={{ color: '#F5A623' }} size={32} />
  </div>
);

export const ToastContainer = ({ toasts, removeToast }) => (
  <div className="fixed bottom-4 right-4 z-[300] flex flex-col gap-2 w-full max-w-xs px-4 md:px-0 pointer-events-none">
    {toasts.map(toast => (
      <div
        key={toast.id}
        className="pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl transform transition-all duration-300 animate-slide-in"
        style={{
          background:  toast.type === 'error' ? 'rgba(252,107,107,0.15)' : 'rgba(74,222,128,0.12)',
          border:      `1px solid ${toast.type === 'error' ? 'rgba(252,107,107,0.4)' : 'rgba(74,222,128,0.35)'}`,
          color:       toast.type === 'error' ? '#FC6B6B' : '#4ADE80',
          backdropFilter: 'blur(12px)',
        }}
      >
        {toast.type === 'error'
          ? <XCircle size={18} className="shrink-0" />
          : <CheckCircle size={18} className="shrink-0" />}
        <p className="text-sm font-semibold flex-1">{toast.message}</p>
        <button onClick={() => removeToast(toast.id)} className="ml-2 opacity-60 hover:opacity-100 transition-opacity">
          <X size={15}/>
        </button>
      </div>
    ))}
  </div>
);

export const ConfirmationModal = ({ isOpen, onClose, onConfirm, title, message, isDanger }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 animate-fade-in" style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}>
      <div className="p-6 w-[95%] max-w-sm rounded-modal" style={{ background: '#222E3C', border: '0.5px solid #2E3A47' }}>
        <div className="flex flex-col items-center text-center">
          <div className="p-4 rounded-full mb-4" style={{ background: isDanger ? 'rgba(252,107,107,0.1)' : 'rgba(96,165,250,0.1)', color: isDanger ? '#FC6B6B' : '#60A5FA' }}>
            {isDanger ? <Trash2 size={28} /> : <RotateCcw size={28} />}
          </div>
          <h3 className="text-lg font-bold mb-2" style={{ color: '#F0F4F8' }}>{title}</h3>
          <p className="text-sm mb-6" style={{ color: '#8D9BAA' }}>{message}</p>
          <div className="flex flex-col sm:flex-row gap-3 w-full">
            <button
              onClick={onClose}
              className="flex-1 py-2.5 rounded-lg font-semibold text-sm transition-all"
              style={{ background: '#1C2530', color: '#F0F4F8', border: '1px solid #2E3A47' }}
              onMouseEnter={e => e.currentTarget.style.borderColor = '#4A5E72'}
              onMouseLeave={e => e.currentTarget.style.borderColor = '#2E3A47'}
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className="flex-1 py-2.5 rounded-lg font-semibold text-sm transition-all active:scale-95"
              style={isDanger
                ? { background: 'transparent', border: '1px solid #FC6B6B', color: '#FC6B6B' }
                : { background: '#F5A623', border: 'none', color: '#0F1520' }}
              onMouseEnter={e => { if (isDanger) e.currentTarget.style.background = 'rgba(252,107,107,0.1)'; else e.currentTarget.style.background = '#E09410'; }}
              onMouseLeave={e => { if (isDanger) e.currentTarget.style.background = 'transparent'; else e.currentTarget.style.background = '#F5A623'; }}
            >
              {isDanger ? 'Confirm' : 'Proceed'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export const Card = ({ title, value, subtext, icon: Icon, isAmber }) => (
  <div
    className="p-5 rounded-card flex flex-col justify-between transition-all duration-150 cursor-default h-full group"
    style={{
      background: isAmber ? 'rgba(245,166,35,0.08)' : '#1C2530',
      border:     isAmber ? '0.5px solid rgba(245,166,35,0.3)' : '0.5px solid #2E3A47',
    }}
    onMouseEnter={e => { if (!isAmber) e.currentTarget.style.borderColor = '#4A5E72'; }}
    onMouseLeave={e => { if (!isAmber) e.currentTarget.style.borderColor = '#2E3A47'; }}
  >
    <div className="flex justify-between items-start mb-4">
      <Icon size={18} style={{ color: isAmber ? '#F5A623' : '#5E7080' }} />
    </div>
    <div>
      <p className="uppercase mb-1.5" style={{ fontSize: '11px', letterSpacing: '0.06em', fontWeight: 600, color: '#8D9BAA' }}>{title}</p>
      <h3 className="text-2xl font-bold leading-tight break-words" style={{ color: isAmber ? '#F5A623' : '#F0F4F8' }}>{value}</h3>
      {subtext && <p className="text-xs mt-1" style={{ color: '#5E7080' }}>{subtext}</p>}
    </div>
  </div>
);