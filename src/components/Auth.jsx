import React, { useState } from 'react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { Shirt, User, Mail, Lock, ShieldCheck, Eye, EyeOff, Loader2 } from 'lucide-react';
import { auth, db, appId, ADMIN_ACCESS_CODE } from '../config/firebase';
import { ToastContainer } from './ui/UIComponents';
import { getFriendlyErrorMessage } from '../utils/helpers';

const inputStyle = {
  background: '#1C2530',
  border: '1px solid #2E3A47',
  borderRadius: '8px',
  color: '#F0F4F8',
  outline: 'none',
  width: '100%',
  padding: '11px 14px',
  fontSize: '14px',
  transition: 'border-color 150ms ease, box-shadow 150ms ease',
};

function Input({ icon: Icon, type = 'text', placeholder, value, onChange, right }) {
  return (
    <div className="relative flex items-center">
      {Icon && <Icon size={16} style={{ color: '#5E7080', position: 'absolute', left: 12, pointerEvents: 'none' }} />}
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        autoComplete="off"
        style={{ ...inputStyle, paddingLeft: Icon ? 38 : 14, paddingRight: right ? 40 : 14 }}
        onFocus={e => { e.target.style.borderColor = '#F5A623'; e.target.style.boxShadow = '0 0 0 3px rgba(245,166,35,0.15)'; }}
        onBlur={e => { e.target.style.borderColor = '#2E3A47'; e.target.style.boxShadow = 'none'; }}
      />
      {right && <div style={{ position: 'absolute', right: 12 }}>{right}</div>}
    </div>
  );
}

export default function Auth() {
  const [isLoginView, setIsLoginView]   = useState(true);
  const [authName, setAuthName]         = useState('');
  const [authEmail, setAuthEmail]       = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authCode, setAuthCode]         = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toasts, setToasts]             = useState([]);

  const showToast = (message, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000);
  };
  const removeToast = (id) => setToasts(prev => prev.filter(t => t.id !== id));

  const handleAuth = async (e) => {
    e.preventDefault();
    const email = authEmail.trim();
    if (!isLoginView && !authName.trim()) { showToast('Name is required', 'error'); return; }
    if (!email || !authPassword) { showToast('Email and password are required', 'error'); return; }
    if (!isLoginView && authCode !== ADMIN_ACCESS_CODE) { showToast('Invalid Admin Access Code', 'error'); return; }

    setIsSubmitting(true);
    try {
      if (isLoginView) {
        await signInWithEmailAndPassword(auth, email, authPassword);
      } else {
        const cred = await createUserWithEmailAndPassword(auth, email, authPassword);
        await setDoc(doc(db, `artifacts/${appId}/users/${cred.user.uid}/account/info`), {
          name: authName.trim(), email, joinedAt: serverTimestamp()
        });
      }
    } catch (err) {
      showToast(getFriendlyErrorMessage(err.code), 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="h-screen flex flex-col items-center justify-center p-4" style={{ background: '#131920' }}>
      <ToastContainer toasts={toasts} removeToast={removeToast} />

      <div className="w-full max-w-md p-8 rounded-modal" style={{ background: '#1C2530', border: '0.5px solid #2E3A47' }}>
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center p-3 rounded-xl mb-4" style={{ background: 'rgba(245,166,35,0.12)', color: '#F5A623' }}>
            <Shirt size={28} />
          </div>
          <h1 className="text-3xl font-black tracking-tight" style={{ color: '#F0F4F8' }}>Sales Master</h1>
          <p className="text-xs font-semibold uppercase tracking-widest mt-1" style={{ color: '#5E7080' }}>Retail Management System</p>
        </div>

        {/* Toggle tabs */}
        <div className="flex mb-6 rounded-lg p-1" style={{ background: '#131920' }}>
          {['Login', 'Sign Up'].map((label, i) => {
            const active = isLoginView === (i === 0);
            return (
              <button
                key={label}
                onClick={() => setIsLoginView(i === 0)}
                className="flex-1 py-2 rounded-md text-sm font-semibold transition-all"
                style={{ background: active ? '#1C2530' : 'transparent', color: active ? '#F0F4F8' : '#5E7080', border: active ? '0.5px solid #2E3A47' : 'none' }}
              >
                {label}
              </button>
            );
          })}
        </div>

        <form onSubmit={handleAuth} className="space-y-3">
          {!isLoginView && (
            <Input icon={User} placeholder="Full Name" value={authName} onChange={e => setAuthName(e.target.value)} />
          )}
          <Input icon={Mail} type="email" placeholder="Email address" value={authEmail} onChange={e => setAuthEmail(e.target.value)} />
          <Input
            icon={Lock}
            type={showPassword ? 'text' : 'password'}
            placeholder="Password"
            value={authPassword}
            onChange={e => setAuthPassword(e.target.value)}
            right={
              <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ color: '#5E7080' }}>
                {showPassword ? <EyeOff size={16}/> : <Eye size={16}/>}
              </button>
            }
          />
          {!isLoginView && (
            <Input icon={ShieldCheck} placeholder="Admin Access Code" value={authCode} onChange={e => setAuthCode(e.target.value)} />
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 rounded-lg font-bold text-sm transition-all active:scale-95 disabled:opacity-50 mt-2"
            style={{ background: '#F5A623', color: '#0F1520' }}
            onMouseEnter={e => { if (!isSubmitting) e.currentTarget.style.background = '#E09410'; }}
            onMouseLeave={e => { e.currentTarget.style.background = '#F5A623'; }}
          >
            {isSubmitting ? <Loader2 className="animate-spin mx-auto" size={18}/> : (isLoginView ? 'Login' : 'Create Account')}
          </button>
        </form>

        <button
          onClick={() => setIsLoginView(!isLoginView)}
          className="w-full text-center mt-5 text-xs font-semibold transition-colors"
          style={{ color: '#F5A623' }}
          onMouseEnter={e => e.currentTarget.style.color = '#E09410'}
          onMouseLeave={e => e.currentTarget.style.color = '#F5A623'}
        >
          {isLoginView ? 'Create a new account →' : '← Back to login'}
        </button>
      </div>
    </div>
  );
}