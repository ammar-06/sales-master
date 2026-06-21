import React, { useState, useMemo, useRef } from 'react';
import { Search, Package } from 'lucide-react';
import { formatCurrency } from '../utils/helpers';

const surface  = '#1C2530';
const elevated = '#222E3C';
const border   = '#2E3A47';
const subtle   = '#243040';
const primary  = '#F0F4F8';
const muted    = '#8D9BAA';
const faint    = '#5E7080';

export default function AvailableStock({ inventory }) {
  const [searchQuery, setSearchQuery] = useState('');
  const searchRef = useRef(null);

  const availableItems = useMemo(() => {
    const up = searchQuery.toUpperCase();
    const lo = searchQuery.toLowerCase();
    return inventory
      .filter(i => i.qty > 0 && (i.suitId?.includes(up) || i.brand?.toLowerCase().includes(lo)))
      .sort((a, b) => (a.suitId || '').localeCompare(b.suitId || '', undefined, { numeric: true, sensitivity: 'base' }));
  }, [inventory, searchQuery]);

  const totalValue = useMemo(() => availableItems.reduce((a, i) => a + (Number(i.orgPrice) || 0), 0), [availableItems]);

  return (
    <div className="flex flex-col h-full overflow-hidden pb-20">
      <div className="flex-1 flex flex-col overflow-hidden min-h-0 rounded-card" style={{ background: surface, border: `0.5px solid ${border}` }}>

        {/* Search */}
        <div className="flex items-center gap-3 px-4 py-3 shrink-0 rounded-t-card" style={{ borderBottom: `0.5px solid ${border}` }}>
          <Search size={17} style={{ color: faint }}/>
          <input
            ref={searchRef}
            className="bg-transparent outline-none flex-1 font-medium"
            style={{ color: primary, fontSize: 14 }}
            placeholder="Search available stock..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Stats bar */}
        <div className="flex justify-between px-5 py-2.5 shrink-0 uppercase font-semibold" style={{ fontSize: 11, letterSpacing: '0.06em', color: faint, background: '#131920', borderBottom: `0.5px solid ${subtle}` }}>
          <span>{availableItems.length} Available</span>
          <span>Value: {formatCurrency(totalValue)}</span>
        </div>

        {/* Mobile cards */}
        <div className="md:hidden flex-1 overflow-y-auto">
          <div className="grid grid-cols-2 gap-2 p-2 pb-24">
            {availableItems.length === 0 ? (
              <div className="col-span-2 flex flex-col items-center justify-center p-10 text-sm opacity-40">
                <Package size={28} className="mb-2"/>No available stock found.
              </div>
            ) : availableItems.map(i => (
              <div key={i.id} className="p-3 rounded-lg flex flex-col justify-between" style={{ background: elevated, border: `0.5px solid ${border}` }}>
                <div className="flex justify-between items-start mb-1">
                  <span className="font-bold font-mono text-sm" style={{ color: '#F5A623' }}>{i.suitId}</span>
                  <span className="w-2 h-2 rounded-full" style={{ background: '#4ADE80' }}/>
                </div>
                <span className="text-xs font-medium truncate block mb-2" style={{ color: muted }}>{i.brand}</span>
                <div className="pt-2 flex justify-between items-end" style={{ borderTop: `0.5px dashed ${subtle}` }}>
                  <div>
                    <span className="block font-bold text-sm" style={{ color: primary }}>{i.salePrice}</span>
                    <span className="text-[10px]" style={{ color: faint }}>Cost: {i.orgPrice}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Desktop table */}
        <div className="hidden md:flex flex-col flex-1 min-h-0 overflow-hidden">
          <div className="flex-1 overflow-y-auto">
            <table className="w-full text-sm table-fixed">
              <thead className="sticky top-0 z-10" style={{ background: '#131920' }}>
                <tr className="uppercase font-semibold" style={{ fontSize: 11, letterSpacing: '0.06em', color: faint }}>
                  <th className="p-4 text-left w-1/5">ID</th>
                  <th className="text-left w-1/4">Brand</th>
                  <th className="text-right w-1/5">Cost</th>
                  <th className="text-right w-1/5">Sale Price</th>
                  <th className="text-center w-1/5">Status</th>
                </tr>
              </thead>
              <tbody>
                {availableItems.length === 0 ? (
                  <tr><td colSpan="5" className="text-center p-12 text-sm" style={{ color: faint }}>No available stock found.</td></tr>
                ) : availableItems.map((i, idx) => (
                  <tr key={i.id}
                    className="transition-colors duration-150"
                    style={{ borderBottom: idx < availableItems.length - 1 ? `0.5px solid ${subtle}` : 'none' }}
                    onMouseEnter={e => e.currentTarget.style.background = elevated}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <td className="p-4 font-bold font-mono" style={{ color: '#F5A623' }}>{i.suitId}</td>
                    <td className="font-medium truncate" style={{ color: muted }}>{i.brand}</td>
                    <td className="text-right font-medium" style={{ color: faint }}>{i.orgPrice}</td>
                    <td className="text-right font-bold" style={{ color: primary }}>{i.salePrice}</td>
                    <td className="text-center">
                      <span className="text-[10px] px-2.5 py-1 rounded-full font-semibold" style={{ background: 'rgba(74,222,128,0.1)', color: '#4ADE80', border: '0.5px solid rgba(74,222,128,0.25)' }}>In Stock</span>
                    </td>
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