import React, { useState } from 'react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { Shirt, User, Mail, Lock, ShieldCheck, Eye, Loader2 } from 'lucide-react';
import { auth, db, appId, ADMIN_ACCESS_CODE } from '../config/firebase';
import { ToastContainer } from './ui/UIComponents';
import { getFriendlyErrorMessage, playSound } from '../utils/helpers';

export default function Auth() {
  const [isLoginView, setIsLoginView] = useState(true);
  const [authName, setAuthName] = useState(''); 
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authCode, setAuthCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toasts, setToasts] = useState([]);

  const showToast = (message, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    playSound(type === 'error' ? 'error' : 'success');
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000);
  };
  const removeToast = (id) => setToasts(prev => prev.filter(t => t.id !== id));

  const handleAuth = async (e) => {
    e.preventDefault();
    const email = authEmail.trim(); const password = authPassword;
    
    if (!isLoginView && !authName.trim()) { showToast("Name is required", 'error'); return; }
    if (!email || !password) { showToast("Email and Password are required", 'error'); return; }
    
    if (!isLoginView && authCode !== ADMIN_ACCESS_CODE) {
        showToast("Invalid Admin Access Code!", 'error');
        playSound('error');
        return;
    }

    setIsSubmitting(true);
    try {
      if (isLoginView) { 
          await signInWithEmailAndPassword(auth, email, password); 
          // Toast handled by main App load usually, but we can show here too
      } else { 
          const userCred = await createUserWithEmailAndPassword(auth, email, password); 
          await setDoc(doc(db, `artifacts/${appId}/users/${userCred.user.uid}/account/info`), {
              name: authName.trim(),
              email: email,
              joinedAt: serverTimestamp()
          });
      }
      playSound('success');
    } catch (err) { showToast(getFriendlyErrorMessage(err.code), 'error'); }
    finally { setIsSubmitting(false); }
  };

  const darkMode = localStorage.getItem('theme') === 'dark'; // Read directly for auth screen

  return (
    <div className={`h-screen flex flex-col items-center justify-center p-4 ${darkMode ? 'bg-slate-900 text-white' : 'bg-gray-50 text-slate-800'}`}>
        <ToastContainer toasts={toasts} removeToast={removeToast} />
        <div className={`w-full max-w-md p-8 rounded-3xl shadow-2xl transition-all ${darkMode ? 'bg-slate-800 border border-slate-700' : 'bg-white border border-gray-100 shadow-slate-200/50'}`}>
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4 bg-blue-600 p-4 rounded-2xl w-fit mx-auto text-white shadow-lg shadow-blue-600/30"><Shirt size={32}/></div>
            <h1 className="text-4xl font-black tracking-tighter mb-2">Sales Master</h1>
            <p className="text-xs font-bold uppercase opacity-50 tracking-widest">Retail Management System</p>
          </div>
          <form onSubmit={handleAuth} className="space-y-4">
            {!isLoginView && (
                <div className={`flex items-center px-4 py-3 rounded-xl border transition-all focus-within:ring-2 focus-within:ring-blue-500 ${darkMode ? 'bg-slate-900 border-slate-700' : 'bg-gray-50 border-gray-200'}`}>
                    <User size={18} className="opacity-50 mr-3" />
                    <input type="text" required autoComplete="off" className="bg-transparent outline-none flex-1 text-sm font-medium" placeholder="Full Name" value={authName} onChange={e => setAuthName(e.target.value)} />
                </div>
            )}
            <div className={`flex items-center px-4 py-3 rounded-xl border transition-all focus-within:ring-2 focus-within:ring-blue-500 ${darkMode ? 'bg-slate-900 border-slate-700' : 'bg-gray-50 border-gray-200'}`}>
               <Mail size={18} className="opacity-50 mr-3" />
               <input type="email" required autoComplete="off" className="bg-transparent outline-none flex-1 text-sm font-medium" placeholder="Email" value={authEmail} onChange={e => setAuthEmail(e.target.value)} />
            </div>
            <div className={`flex items-center px-4 py-3 rounded-xl border transition-all focus-within:ring-2 focus-within:ring-blue-500 ${darkMode ? 'bg-slate-900 border-slate-700' : 'bg-gray-50 border-gray-200'}`}>
               <Lock size={18} className="opacity-50 mr-3" />
               <input type={showPassword?"text":"password"} required autoComplete="new-password" className="bg-transparent outline-none flex-1 text-sm font-medium" placeholder="Password" value={authPassword} onChange={e => setAuthPassword(e.target.value)} />
               <button type="button" onClick={() => setShowPassword(!showPassword)}><Eye size={18} className="opacity-50 hover:opacity-100 transition-opacity"/></button>
            </div>
            {!isLoginView && (
                <div className={`flex items-center px-4 py-3 rounded-xl border transition-all focus-within:ring-2 focus-within:ring-blue-500 ${darkMode ? 'bg-slate-900 border-slate-700' : 'bg-gray-50 border-gray-200'}`}>
                    <ShieldCheck size={18} className="opacity-50 mr-3 text-red-500" />
                    <input type="text" required autoComplete="off" className="bg-transparent outline-none flex-1 text-sm font-medium" placeholder="Admin Access Code" value={authCode} onChange={e => setAuthCode(e.target.value)} />
                </div>
            )}
            <button type="submit" disabled={isSubmitting} className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-bold shadow-lg shadow-blue-500/20 disabled:opacity-50 transition-all active:scale-95">
               {isSubmitting ? <Loader2 className="animate-spin mx-auto"/> : (isLoginView ? "Login" : "Sign Up")}
            </button>
          </form>
          <button onClick={() => setIsLoginView(!isLoginView)} className="w-full text-center mt-6 text-xs font-bold text-blue-500 hover:text-blue-600 hover:underline">{isLoginView ? "Create New Account" : "Back to Login"}</button>
        </div>
      </div>
  );
}