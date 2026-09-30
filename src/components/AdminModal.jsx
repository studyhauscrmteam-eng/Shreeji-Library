import React, { useState, useEffect } from 'react';
import { X, Lock, RefreshCw, CheckCircle, Clock, Plus, Trash2, Sparkles, UserCheck, Pencil, Save, Loader2, AlertCircle } from 'lucide-react';
import { usePlans } from '../context/PlansContext';

export default function AdminModal({ isOpen, onClose }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pin, setPin] = useState('');
  const [pinError, setPinError] = useState('');
  const [activeTab, setActiveTab] = useState('plans'); // 'plans' | 'bookings'
  const [bookings, setBookings] = useState([]);
  const [filter, setFilter] = useState('All');
  const [loading, setLoading] = useState(false);
  const [savingPlan, setSavingPlan] = useState(false);
  const [savingBookingId, setSavingBookingId] = useState(null);

  // Dynamic Plans from context
  const { plans, addBenefitPoint, removeBenefitPoint, editBenefitPoint, updatePlan, resetToDefaultPlans, syncing } = usePlans();

  // New point form state
  const [newPointPlanId, setNewPointPlanId] = useState('half-day');
  const [newPointEn, setNewPointEn] = useState('');
  const [newPointGu, setNewPointGu] = useState('');
  const [successNotice, setSuccessNotice] = useState('');

  // Per-plan inline add form
  const [inlineAdd, setInlineAdd] = useState({}); // { planId: { en: '', gu: '' } }
  // Edit-in-place state: { planId_idx: { en, gu } }
  const [editState, setEditState] = useState({});

  const handleInlineAdd = async (planId) => {
    const val = inlineAdd[planId];
    if (!val || !val.en.trim()) return;
    setSavingPlan(true);
    try {
      await addBenefitPoint(planId, val.en, val.gu || '');
      setInlineAdd(prev => ({ ...prev, [planId]: { en: '', gu: '' } }));
      setSuccessNotice('Benefit point added (local preview — CRM is source of truth)');
    } catch (e) {
      setSuccessNotice('Error saving benefit point');
    } finally {
      setSavingPlan(false);
      setTimeout(() => setSuccessNotice(''), 3000);
    }
  };

  const startEdit = (planId, idx, en, gu) => {
    setEditState(prev => ({ ...prev, [`${planId}_${idx}`]: { en, gu } }));
  };

  const saveEdit = async (planId, idx) => {
    const key = `${planId}_${idx}`;
    const val = editState[key];
    if (!val || !val.en.trim()) return;
    setSavingPlan(true);
    try {
      await editBenefitPoint(planId, idx, val.en, val.gu || '');
      setEditState(prev => { const n = {...prev}; delete n[key]; return n; });
      setSuccessNotice('Benefit point updated (local preview — CRM is source of truth)');
    } catch (e) {
      setSuccessNotice('Error updating benefit point');
    } finally {
      setSavingPlan(false);
      setTimeout(() => setSuccessNotice(''), 3000);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (pin === '1234' || pin === 'shreeji2026') {
      setIsAuthenticated(true);
      setPinError('');
      fetchBookings();
    } else {
      setPinError('Invalid PIN code. Please try again.');
    }
  };

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/bookings');
      const data = await res.json();
      if (data.success) {
        setBookings(data.data);
      } else {
        setBookings([]);
      }
    } catch (e) {
      console.error("Failed to load bookings from backend:", e);
      setBookings([]);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    setSavingBookingId(id);
    try {
      await fetch(`/api/bookings/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
    } catch (e) {
      console.error("Failed to update booking status:", e);
    } finally {
      setSavingBookingId(null);
    }

    setBookings(prev =>
      prev.map(b => (b.id === id ? { ...b, status: newStatus } : b))
    );
  };

  const handleAddPoint = async (e) => {
    e.preventDefault();
    if (!newPointEn.trim()) return;
    setSavingPlan(true);
    try {
      await addBenefitPoint(newPointPlanId, newPointEn, newPointGu);
      setNewPointEn('');
      setNewPointGu('');
      setSuccessNotice('New benefit point added (local preview — CRM is source of truth)');
    } catch (e) {
      setSuccessNotice('Error saving benefit point');
    } finally {
      setSavingPlan(false);
      setTimeout(() => setSuccessNotice(''), 3000);
    }
  };

  if (!isOpen) return null;

  const statusOf = (b) => {
    const s = b.status || 'Pending';
    // Normalize legacy "Confirmed" to CRM "Active"
    if (s === 'Confirmed' || s === 'Approved') return 'Active';
    return s;
  };

  const filteredBookings = filter === 'All'
    ? bookings
    : bookings.filter(b => statusOf(b) === filter);

  return (
    <div className="fixed inset-0 z-[150] bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 select-none">
      <div className="bg-white w-full max-w-4xl rounded-3xl overflow-hidden shadow-2xl border border-[#F5E4E4] flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-[#201E1F] text-white p-5 sm:p-6 flex items-center justify-between border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#983132] text-white flex items-center justify-center">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">ShreeJi Software & Admin Portal</h3>
              <p className="text-xs text-[#F5E4E4]/70">Manage subscription benefits, pricing & student seat reservations</p>
            </div>
          </div>
          
          <button
            onClick={onClose}
            className="text-white/70 hover:text-white bg-white/10 p-2 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Auth Gate */}
        {!isAuthenticated ? (
          <div className="p-8 sm:p-12 flex flex-col items-center justify-center text-center flex-1">
            <div className="w-16 h-16 rounded-3xl bg-[#FFF0E8] text-[#983132] flex items-center justify-center mb-6 shadow-sm border border-[#F5E4E4]">
              <Lock className="w-8 h-8" />
            </div>
            <h4 className="text-xl font-bold text-[#201E1F] mb-2">Staff Access Authentication</h4>
            <p className="text-xs sm:text-sm text-[#201E1F]/70 mb-6 max-w-sm">
              Enter your manager PIN code to access the management software.
            </p>

            <form onSubmit={handleLogin} className="w-full max-w-xs space-y-4">
              <input
                type="password"
                maxLength="8"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder="Enter PIN"
                className="w-full px-4 py-3 rounded-2xl bg-[#FFF8F5] border border-[#F5E4E4] text-center text-lg tracking-widest font-mono font-bold text-[#201E1F] focus:outline-none focus:ring-2 focus:ring-[#983132]"
                autoFocus
              />

              {pinError && (
                <p className="text-xs text-red-600 font-semibold">{pinError}</p>
              )}

              <button
                type="submit"
                className="w-full py-3.5 rounded-full bg-[#983132] hover:bg-[#7f2728] text-white font-semibold text-sm transition-all shadow-md"
              >
                Unlock Software Portal
              </button>
            </form>
          </div>
        ) : (
          <div className="flex-1 flex flex-col overflow-hidden">
            
            {/* Top Navigation Tabs */}
            <div className="bg-[#FFF8F5] px-6 py-3 border-b border-[#F5E4E4] flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveTab('plans')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                    activeTab === 'plans' 
                      ? 'bg-[#983132] text-white shadow-sm' 
                      : 'bg-white text-[#201E1F] hover:bg-[#F5E4E4] border border-[#F5E4E4]'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Subscription Benefits & Points Manager</span>
                </button>

                <button
                  onClick={() => setActiveTab('bookings')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                    activeTab === 'bookings' 
                      ? 'bg-[#983132] text-white shadow-sm' 
                      : 'bg-white text-[#201E1F] hover:bg-[#F5E4E4] border border-[#F5E4E4]'
                  }`}
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>Seat Bookings ({bookings.length})</span>
                </button>
              </div>

              {activeTab === 'plans' && (
                <button
                  onClick={async () => {
                    setSavingPlan(true);
                    try {
                      await resetToDefaultPlans();
                      setSuccessNotice('Plans reloaded from CRM');
                    } catch (e) {
                      setSuccessNotice('Error resetting plans');
                    } finally {
                      setSavingPlan(false);
                      setTimeout(() => setSuccessNotice(''), 3000);
                    }
                  }}
                  disabled={savingPlan || syncing}
                  className="text-xs text-[#983132] hover:underline font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {syncing ? 'Syncing...' : savingPlan ? 'Reloading...' : 'Reload plans from CRM'}
                </button>
              )}
            </div>

            {/* TAB 1: SUBSCRIPTION PLANS & BENEFITS MANAGER */}
            {activeTab === 'plans' && (
              <div className="flex-1 overflow-y-auto p-6 space-y-6">

                {/* CRM source-of-truth notice */}
                <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 text-xs font-semibold">
                  <span className="font-bold">Plans are managed in the CRM (membershipPlans).</span>
                  <span> This website refreshes automatically from <code className="font-mono">GET /api/plans</code> every 30 seconds — any price/name change you make in the CRM appears here without redeploy. Edits below are local preview only.</span>
                </div>
                {/* Syncing indicator */}
                {(syncing || savingPlan) && (
                  <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-amber-600" />
                    <span>{syncing ? 'Syncing plans with CRM...' : 'Saving changes to CRM...'}</span>
                  </div>
                )}

                {successNotice && (
                  <div className="p-3.5 rounded-xl bg-emerald-100 border border-emerald-300 text-emerald-800 text-xs font-bold flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                    <span>{successNotice}</span>
                  </div>
                )}

                {/* Form to Add New Point / Benefit */}
                <div className="bg-[#FFF8F5] p-5 rounded-2xl border border-[#F5E4E4] shadow-sm">
                  <h4 className="text-sm font-bold text-[#201E1F] mb-3 flex items-center gap-2">
                    <Plus className="w-4 h-4 text-[#EB6A30]" />
                    <span>Add New Benefit / Point to Subscription Plan</span>
                  </h4>

                  <form onSubmit={handleAddPoint} className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-[#201E1F]/70 mb-1">Target Plan</label>
                        <select
                          value={newPointPlanId}
                          onChange={(e) => setNewPointPlanId(e.target.value)}
                          disabled={savingPlan || syncing}
                          className="w-full p-2.5 rounded-xl bg-white border border-[#F5E4E4] text-xs font-semibold text-[#201E1F] disabled:opacity-50"
                        >
                          <option value="half-day">Half Day Plan (₹700)</option>
                          <option value="full-day">Full Day Plan (₹1000)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-[#201E1F]/70 mb-1">Benefit in English *</label>
                        <input
                          type="text"
                          value={newPointEn}
                          onChange={(e) => setNewPointEn(e.target.value)}
                          disabled={savingPlan || syncing}
                          placeholder="e.g. Free High-speed Scanner Access"
                          className="w-full p-2.5 rounded-xl bg-white border border-[#F5E4E4] text-xs text-[#201E1F] disabled:opacity-50"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-[#201E1F]/70 mb-1">Benefit in Gujarati (વૈકલ્પિક)</label>
                        <input
                          type="text"
                          value={newPointGu}
                          onChange={(e) => setNewPointGu(e.target.value)}
                          disabled={savingPlan || syncing}
                          placeholder="દા.ત. ફ્રી સ્કેનર અને પ્રિન્ટિંગ સપોર્ટ"
                          className="w-full p-2.5 rounded-xl bg-white border border-[#F5E4E4] text-xs text-[#201E1F] disabled:opacity-50"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end pt-1">
                      <button
                        type="submit"
                        disabled={savingPlan || syncing || !newPointEn.trim()}
                        className="bg-[#EB6A30] hover:bg-[#d5571e] text-white font-semibold text-xs px-5 py-2.5 rounded-full transition-colors flex items-center gap-1.5 shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        {savingPlan || syncing ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>Saving...</span>
                          </>
                        ) : (
                          <>
                            <Plus className="w-3.5 h-3.5" />
                            <span>Add Benefit Point to Website & CRM</span>
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </div>

                {/* Plans List & Current Points */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {plans.map((plan) => (
                    <div key={plan.id} className={`bg-white p-5 rounded-2xl border-2 shadow-sm flex flex-col gap-4 ${
                      plan.featured ? 'border-[#EB6A30]' : 'border-[#F5E4E4]'
                    }`}>

                      {/* Plan Header */}
                      <div className="flex items-center justify-between pb-3 border-b border-[#F5E4E4]">
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-base text-[#201E1F]">{plan.nameEn}</h4>
                            {plan.featured && (
                              <span className="text-[10px] bg-[#EB6A30] text-white px-2 py-0.5 rounded-full font-bold">⭐ Featured</span>
                            )}
                          </div>
                          <p className="text-xs text-[#983132] font-semibold">{plan.taglineEn}</p>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-[#201E1F]">₹</span>
                          <input
                            type="number"
                            value={plan.price}
                            onChange={(e) => updatePlan(plan.id, { price: e.target.value })}
                            disabled={savingPlan || syncing}
                            className="w-20 p-1.5 rounded-lg border border-[#F5E4E4] text-sm font-extrabold text-[#201E1F] text-center focus:outline-none focus:ring-2 focus:ring-[#EB6A30] disabled:opacity-50"
                          />
                          <span className="text-[10px] text-[#201E1F]/50">/mo</span>
                        </div>
                      </div>

                      {/* Benefit Points List */}
                      <div className="space-y-2">
                        <p className="text-[11px] font-bold text-[#201E1F]/50 uppercase tracking-wider flex items-center gap-1.5">
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                          Benefits ({plan.benefitsEn.length} points)
                        </p>

                        {plan.benefitsEn.map((benefit, idx) => {
                          const editKey = `${plan.id}_${idx}`;
                          const isEditing = !!editState[editKey];
                          return (
                            <div key={idx} className="rounded-xl bg-[#FFF8F5] border border-[#F5E4E4] group">
                              {isEditing ? (
                                /* Edit Mode */
                                <div className="p-2.5 space-y-1.5">
                                  <input
                                    autoFocus
                                    value={editState[editKey].en}
                                    onChange={e => setEditState(prev => ({ ...prev, [editKey]: { ...prev[editKey], en: e.target.value } }))}
                                    disabled={savingPlan || syncing}
                                    className="w-full px-2.5 py-1.5 rounded-lg border border-[#EB6A30] text-xs font-semibold text-[#201E1F] focus:outline-none disabled:opacity-50"
                                    placeholder="Benefit in English"
                                  />
                                  <input
                                    value={editState[editKey].gu}
                                    onChange={e => setEditState(prev => ({ ...prev, [editKey]: { ...prev[editKey], gu: e.target.value } }))}
                                    disabled={savingPlan || syncing}
                                    className="w-full px-2.5 py-1.5 rounded-lg border border-[#F5E4E4] text-[11px] text-[#201E1F]/70 focus:outline-none disabled:opacity-50"
                                    placeholder="ગુજરાતીમાં (વૈકલ્પિક)"
                                  />
                                  <div className="flex gap-1.5 pt-0.5">
                                    <button
                                      onClick={() => saveEdit(plan.id, idx)}
                                      disabled={savingPlan || syncing}
                                      className="flex items-center gap-1 bg-emerald-600 text-white text-[11px] font-bold px-3 py-1 rounded-full hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed"
                                    >
                                      {savingPlan || syncing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                                      <span>{savingPlan || syncing ? 'Saving...' : 'Save'}</span>
                                    </button>
                                    <button
                                      onClick={() => setEditState(prev => { const n={...prev}; delete n[editKey]; return n; })}
                                      disabled={savingPlan || syncing}
                                      className="text-[11px] text-[#201E1F]/50 hover:text-[#201E1F] px-2 py-1 rounded-full disabled:opacity-30 disabled:cursor-not-allowed"
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                /* View Mode */
                                <div className="flex items-start justify-between gap-2 p-2.5">
                                  <div className="flex-1 text-xs">
                                    <p className="font-semibold text-[#201E1F] leading-snug">{benefit}</p>
                                    {plan.benefitsGu?.[idx] && (
                                      <p className="text-[11px] text-[#201E1F]/55 mt-0.5">{plan.benefitsGu[idx]}</p>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                      onClick={() => startEdit(plan.id, idx, benefit, plan.benefitsGu?.[idx] || '')}
                                      disabled={savingPlan || syncing}
                                      className="text-[#EB6A30] hover:text-[#d5571e] p-1 rounded-md disabled:opacity-30 disabled:cursor-not-allowed"
                                      title="Edit benefit"
                                    >
                                      <Pencil className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      onClick={() => removeBenefitPoint(plan.id, idx)}
                                      disabled={savingPlan || syncing}
                                      className="text-red-500 hover:text-red-700 p-1 rounded-md disabled:opacity-30 disabled:cursor-not-allowed"
                                      title="Remove benefit"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}

                        {/* Inline Add Form per Plan */}
                        <div className="mt-3 p-3 rounded-xl border border-dashed border-[#EB6A30]/40 bg-[#FFF0E8]/40 space-y-2">
                          <p className="text-[11px] font-bold text-[#EB6A30] uppercase tracking-wide">+ Add New Benefit to This Plan</p>
                          <input
                            type="text"
                            value={inlineAdd[plan.id]?.en || ''}
                            onChange={e => setInlineAdd(prev => ({ ...prev, [plan.id]: { ...prev[plan.id], en: e.target.value } }))}
                            onKeyDown={e => e.key === 'Enter' && handleInlineAdd(plan.id)}
                            disabled={savingPlan || syncing}
                            placeholder="e.g. Priority booking support"
                            className="w-full px-3 py-2 rounded-lg border border-[#F5E4E4] bg-white text-xs text-[#201E1F] focus:outline-none focus:ring-2 focus:ring-[#EB6A30] disabled:opacity-50"
                          />
                          <input
                            type="text"
                            value={inlineAdd[plan.id]?.gu || ''}
                            onChange={e => setInlineAdd(prev => ({ ...prev, [plan.id]: { ...prev[plan.id], gu: e.target.value } }))}
                            onKeyDown={e => e.key === 'Enter' && handleInlineAdd(plan.id)}
                            disabled={savingPlan || syncing}
                            placeholder="ગુજરાતીમાં ફાયદો (વૈકલ્પિક)"
                            className="w-full px-3 py-2 rounded-lg border border-[#F5E4E4] bg-white text-[11px] text-[#201E1F]/70 focus:outline-none disabled:opacity-50"
                          />
                          <button
                            onClick={() => handleInlineAdd(plan.id)}
                            disabled={!inlineAdd[plan.id]?.en?.trim() || savingPlan || syncing}
                            className="w-full py-2 rounded-full bg-[#EB6A30] hover:bg-[#d5571e] disabled:opacity-40 text-white text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
                          >
                            {savingPlan || syncing ? (
                              <>
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                <span>Saving...</span>
                              </>
                            ) : (
                              <>
                                <Plus className="w-3.5 h-3.5" />
                                <span>Add Benefit Point</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>

                    </div>
                  ))}
                </div>

              </div>
            )}

            {/* TAB 2: SEAT BOOKINGS LIST */}
            {activeTab === 'bookings' && (
              <div className="flex-1 overflow-y-auto p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    {['All', 'Active', 'Pending'].map((st) => (
                      <button
                        key={st}
                        onClick={() => setFilter(st)}
                        className={`px-3 py-1 rounded-full text-xs font-bold transition-colors ${
                          filter === st ? 'bg-[#983132] text-white' : 'bg-[#FFF8F5] text-[#201E1F]'
                        }`}
                      >
                        {st}
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={fetchBookings}
                    disabled={loading}
                    className="text-xs text-[#983132] hover:underline flex items-center gap-1 font-semibold disabled:opacity-50"
                  >
                    {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                    {loading ? 'Loading...' : 'Refresh'}
                  </button>
                </div>

                <div className="space-y-3">
                  {filteredBookings.length === 0 && !loading && (
                    <p className="text-xs text-[#201E1F]/60 text-center py-6">
                      No inquiries found. New website bookings appear here live from the CRM (students with status Pending).
                    </p>
                  )}
                  {filteredBookings.map((b) => (
                    <div key={b.id} className="p-4 rounded-2xl bg-[#FFF8F5] border border-[#F5E4E4] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-bold text-sm text-[#201E1F]">{b.name}</h4>
                          <span className="text-xs font-mono text-[#983132]">({b.phone})</span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            statusOf(b) === 'Active' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                          }`}>
                            {statusOf(b)}
                          </span>
                          {b.source === 'Website' && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                              Website
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-[#201E1F]/70 mt-1">
                          Plan: <strong>{b.planName || b.plan || '—'}</strong>
                          {b.seatNumber ? (<span> • Seat: <strong>{b.seatNumber}</strong></span>) : null}
                          {b.remarks ? (<span> • <em>{b.remarks}</em></span>) : null}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleStatusChange(b.id, 'Active')}
                          disabled={savingBookingId === b.id}
                          className="bg-emerald-600 text-white text-xs font-semibold px-3 py-1.5 rounded-full hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {savingBookingId === b.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Confirm Seat'}
                        </button>
                        <button
                          onClick={() => handleStatusChange(b.id, 'Pending')}
                          disabled={savingBookingId === b.id}
                          className="bg-gray-200 text-[#201E1F] text-xs font-semibold px-3 py-1.5 rounded-full hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {savingBookingId === b.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Mark Pending'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        )}

      </div>
    </div>
  );
}
