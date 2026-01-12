import React from 'react';
import { LayoutDashboard, Shirt, ShoppingCart, Users, Handshake, BarChart3, Archive, Sun, Moon, LogOut, X, UserCircle } from 'lucide-react';

export default function Sidebar({ activeTab, setActiveTab, userProfileName, mobileMenuOpen, setMobileMenuOpen, darkMode, setDarkMode, onLogout, setEditingItem, setViewingCustomer }) {
  const menuItems = [
    {id:'dashboard', icon:LayoutDashboard, label:'Dashboard'},
    {id:'inventory', icon:Shirt, label:'Inventory'},
    {id:'sales', icon:ShoppingCart, label:'Sales'},
    {id:'customers', icon:Users, label:'Customers'},
    {id:'mama', icon:Handshake, label:'Partner Share'},
    {id:'insights', icon:BarChart3, label:'Insights'},
    {id:'trash', icon:Archive, label:'Deleted Customers'}
  ];

  return (
    <>
      {mobileMenuOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-30 md:hidden" onClick={() => setMobileMenuOpen(false)}></div>
      )}
      
      <div className={`fixed inset-y-0 left-0 w-64 transform ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} md:relative md:translate-x-0 transition-transform duration-300 z-40 flex flex-col shadow-2xl ${darkMode ? 'bg-slate-950' : 'bg-slate-900 text-white'}`}>
        <div onClick={() => { setActiveTab('dashboard'); if(setViewingCustomer) setViewingCustomer(null); setMobileMenuOpen(false); }} className="p-6 border-b border-slate-800 flex items-center gap-3 cursor-pointer">
           <div className="bg-blue-600 p-2 rounded-lg"><Shirt className="text-white" size={20}/></div>
           <div>
               <h1 className="text-xl font-bold text-white tracking-tight">Sales Master</h1>
               <div className="flex items-center gap-2 mt-1">
                   <UserCircle size={12} className="text-slate-400"/>
                   <p className="text-[10px] md:text-xs md:text-white md:font-bold text-slate-300 font-mono uppercase tracking-wide">
                       {userProfileName || 'User'}
                   </p>
               </div>
           </div>
           <button onClick={(e) => { e.stopPropagation(); setMobileMenuOpen(false); }} className="md:hidden text-white ml-auto hover:bg-white/10 rounded-full p-1"><X/></button>
        </div>
        <nav className="flex-1 p-4 space-y-2">
           {menuItems.map(i => (
             <button key={i.id} onClick={() => {
                 setActiveTab(i.id); 
                 if(setViewingCustomer) setViewingCustomer(null); 
                 setMobileMenuOpen(false); 
                 if(setEditingItem) setEditingItem(null);
             }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ease-out hover:translate-x-2 ${activeTab === i.id ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20 scale-[1.02]' : 'hover:bg-white/5 text-slate-400 hover:text-white'}`}>
                <i.icon size={20} /> <span className="capitalize font-medium">{i.label}</span>
             </button>
           ))}
        </nav>
        <div className="p-4 border-t border-slate-800 space-y-2">
           <button onClick={() => setDarkMode(!darkMode)} className="w-full flex justify-center gap-2 py-2 rounded-xl bg-slate-800 text-white text-xs font-bold hover:bg-slate-700 transition-colors">{darkMode ? <Sun size={14}/> : <Moon size={14}/>} {darkMode ? "Light Mode" : "Dark Mode"}</button>
           <button onClick={onLogout} className="w-full flex justify-center gap-2 py-2 rounded-xl bg-red-500/10 text-red-500 text-xs font-bold hover:bg-red-500/20 transition-colors"><LogOut size={14}/> Logout</button>
        </div>
      </div>
    </>
  );
}