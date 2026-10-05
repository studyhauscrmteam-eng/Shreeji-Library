import React, { useState, useMemo } from 'react';
import {
  X, Lock, RefreshCw, UserCheck, Loader2, Search, Clock3,
  CheckCircle2, Hourglass, Inbox, Phone, Mail, CalendarDays, Armchair
} from 'lucide-react';

const timeAgo = (v) => {
  try {
    const t = !v ? 0 : typeof v === 'string' ? new Date(v).getTime()
      : v._seconds ? v._seconds * 1000
      : v.seconds ? v.seconds * 1000
      : v.toDate ? v.toDate().getTime() : 0;
    if (!t) return '';
    const s = Math.max(0, Math.floor((Date.now() - t) / 1000));
    if (s < 60) return 'just now';
    const m = Math.floor(s / 60);
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    const d = Math.floor(h / 24);
    if (d < 30) return `${d}d ago`;
    return new Date(t).toLocaleDateString();
  } catch {
    return '';
  }
};

const initialsOf = (name) => String(name || '?').trim().split(/\s+/).slice(0, 2).map((w) => w[0]).join('').toUpperCase();

function StatusBadge({ status }) {
  const pending = status !== 'Active';
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-full border ${
        pending
          ? 'bg-amber-400/10 text-amber-300 border-amber-400/30 shadow-[0_0_12px_rgba(251,191,36,0.15)]'
          : 'bg-emerald-400/10 text-emerald-300 border-emerald-400/30'
      }`}
    >
      <span className="relative flex w-1.5 h-1.5">
        {pending && (
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
        )}
        <span className={`relative inline-flex rounded-full w-1.5 h-1.5 ${pending ? 'bg-amber-400' : 'bg-emerald-400'}`} />
      </span>
      {pending ? <Hourglass className="w-3 h-3" /> : <CheckCircle2 className="w-3 h-3" />}
      {pending ? 'Pending approval' : 'Active'}
    </span>
  );
}

export default function AdminModal({ isOpen, onClose }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pin, setPin] = useState('');
  const [pinError, setPinError] = useState('');
  const [bookings, setBookings] = useState([]);
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [savingBookingId, setSavingBookingId] = useState(null);

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

  if (!isOpen) return null;

  const statusOf = (b) => {
    const s = b.status || 'Pending';
    // Normalize legacy "Confirmed" / "Approved" to "Active"
    if (s === 'Confirmed' || s === 'Approved') return 'Active';
    return s;
  };

  return (
    <div className="fixed inset-0 z-[150] bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 select-none">
      <div className="bg-[#201E1F] text-white w-full max-w-4xl rounded-3xl overflow-hidden shadow-2xl border border-white/10 flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="relative p-5 sm:p-6 flex items-center justify-between border-b border-white/10 bg-gradient-to-r from-[#2A2325] via-[#201E1F] to-[#2A2325]">
          <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-transparent via-[#EB6A30] to-transparent" />
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#EB6A30] to-[#983132] text-white flex items-center justify-center shadow-lg shadow-[#EB6A30]/20">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">ShreeJi Software & Admin Portal</h3>
              <p className="text-xs text-white/50">Admission requests & seat reservations</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-white/60 hover:text-white bg-white/10 hover:bg-white/20 p-2 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Auth Gate */}
        {!isAuthenticated ? (
          <div className="p-8 sm:p-12 flex flex-col items-center justify-center text-center flex-1">
            <div className="w-16 h-16 rounded-3xl bg-[#EB6A30]/10 text-[#EB6A30] flex items-center justify-center mb-6 shadow-sm border border-[#EB6A30]/20">
              <Lock className="w-8 h-8" />
            </div>
            <h4 className="text-xl font-bold text-white mb-2">Staff Access Authentication</h4>
            <p className="text-xs sm:text-sm text-white/50 mb-6 max-w-sm">
              Enter your manager PIN code to access the management software.
            </p>

            <form onSubmit={handleLogin} className="w-full max-w-xs space-y-4">
              <input
                type="password"
                maxLength="8"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder="Enter PIN"
                className="w-full px-4 py-3 rounded-2xl bg-white/10 border border-white/15 text-center text-lg tracking-widest font-mono font-bold text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-[#EB6A30]"
                autoFocus
              />

              {pinError && (
                <p className="text-xs text-red-400 font-semibold">{pinError}</p>
              )}

              <button
                type="submit"
                className="w-full py-3.5 rounded-full bg-gradient-to-r from-[#EB6A30] to-[#d5571e] hover:brightness-110 text-white font-semibold text-sm transition-all shadow-lg shadow-[#EB6A30]/20"
              >
                Unlock Software Portal
              </button>
            </form>
          </div>
        ) : (
          <AdminList
            bookings={bookings}
            loading={loading}
            filter={filter}
            setFilter={setFilter}
            search={search}
            setSearch={setSearch}
            statusOf={statusOf}
            savingBookingId={savingBookingId}
            onRefresh={fetchBookings}
            onStatusChange={handleStatusChange}
          />
        )}

      </div>
    </div>
  );
}

function AdminList({ bookings, loading, filter, setFilter, search, setSearch, statusOf, savingBookingId, onRefresh, onStatusChange }) {
  const counts = useMemo(() => ({
    All: bookings.length,
    Pending: bookings.filter((b) => statusOf(b) !== 'Active').length,
    Active: bookings.filter((b) => statusOf(b) === 'Active').length,
  }), [bookings, statusOf]);

  const q = search.trim().toLowerCase();
  const isPending = (b) => statusOf(b) !== 'Active';
  const visible = bookings
    .filter((b) => {
      if (filter === 'Pending') return isPending(b);
      if (filter === 'Active') return !isPending(b);
      return true;
    })
    .filter((b) => {
      if (filter === 'Pending' && !isPending(b)) return false;
      if (filter === 'Active' && isPending(b)) return false;
      if (!q) return true;
      return [b.name, b.phone, b.email, b.planName, b.plan].filter(Boolean).join(' ').toLowerCase().includes(q);
    });

  return (
    <div className="flex-1 flex flex-col overflow-hidden">

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 px-5 sm:px-6 pt-5">
        {[
          { label: 'Total requests', value: counts.All, icon: Inbox, tint: 'text-white', ring: 'border-white/10', bg: 'bg-white/5' },
          { label: 'Pending approval', value: counts.Pending, icon: Hourglass, tint: 'text-amber-300', ring: 'border-amber-400/25', bg: 'bg-amber-400/5' },
          { label: 'Active seats', value: counts.Active, icon: CheckCircle2, tint: 'text-emerald-300', ring: 'border-emerald-400/25', bg: 'bg-emerald-400/5' },
        ].map((s) => (
          <div key={s.label} className={`rounded-2xl border ${s.ring} ${s.bg} px-3 py-3 sm:px-4 flex items-center gap-3`}>
            <s.icon className={`w-5 h-5 shrink-0 ${s.tint}`} />
            <div className="min-w-0">
              <p className="text-xl font-extrabold leading-none">{loading ? '—' : s.value}</p>
              <p className="text-[10px] uppercase tracking-wider text-white/45 mt-1 truncate">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 px-5 sm:px-6 pt-4 pb-2">
        <div className="flex items-center gap-2">
          {['All', 'Pending', 'Active'].map((st) => (
            <button
              key={st}
              onClick={() => setFilter(st)}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all border ${
                filter === st
                  ? 'bg-[#EB6A30] border-[#EB6A30] text-white shadow-lg shadow-[#EB6A30]/25'
                  : 'bg-white/5 border-white/10 text-white/60 hover:text-white hover:border-white/25'
              }`}
            >
              {st}
              <span className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded-full ${filter === st ? 'bg-black/25' : 'bg-white/10'}`}>
                {counts[st]}
              </span>
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 flex-1">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name, phone, plan…"
              className="w-full pl-9 pr-3 py-2 rounded-full bg-white/5 border border-white/10 text-xs text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-[#EB6A30]/60 focus:border-[#EB6A30]/50"
            />
          </div>
          <button
            onClick={onRefresh}
            disabled={loading}
            className="shrink-0 inline-flex items-center gap-1.5 text-xs text-[#EB6A30] hover:text-white font-semibold bg-[#EB6A30]/10 hover:bg-[#EB6A30]/25 border border-[#EB6A30]/20 px-3.5 py-2 rounded-full transition-colors disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
            {loading ? 'Loading…' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto p-5 sm:p-6 pt-3">
        <div className="space-y-3">
          {loading && bookings.length === 0 && [0, 1, 2].map((i) => (
            <div key={i} className="p-4 rounded-2xl bg-white/5 border border-white/10 animate-pulse flex items-center gap-3">
              <div className="w-11 h-11 rounded-full bg-white/10 shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-3.5 w-1/3 bg-white/10 rounded" />
                <div className="h-3 w-2/3 bg-white/5 rounded" />
              </div>
            </div>
          ))}

          {visible.length === 0 && !loading && (
            <div className="text-center py-12 px-6 rounded-3xl border border-dashed border-white/15 bg-white/[0.02]">
              <Inbox className="w-10 h-10 text-white/20 mx-auto mb-3" />
              <p className="text-sm font-bold text-white/70">
                {search ? 'No matches for your search.' : filter === 'Pending' ? 'No pending approvals. All caught up.' : 'No requests found.'}
              </p>
              <p className="text-xs text-white/40 mt-1">New website submissions appear here automatically.</p>
            </div>
          )}

          {visible.map((b) => {
            const st = statusOf(b);
            const ago = timeAgo(b.createdAt);
            return (
              <div
                key={b.id}
                className={`group p-4 rounded-2xl bg-white/[0.04] hover:bg-white/[0.06] border transition-colors flex flex-col gap-3 ${
                  st === 'Active' ? 'border-emerald-400/15' : 'border-amber-400/20'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-11 h-11 rounded-full shrink-0 flex items-center justify-center text-xs font-extrabold border ${
                    st === 'Active'
                      ? 'bg-emerald-400/10 text-emerald-300 border-emerald-400/25'
                      : 'bg-gradient-to-br from-[#EB6A30]/25 to-[#983132]/25 text-[#FFB37E] border-[#EB6A30]/25'
                  }`}>
                    {initialsOf(b.name)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-bold text-sm text-white truncate">{b.name}</h4>
                      <StatusBadge status={st} />
                      {b.source === 'Website' && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-400/10 text-sky-300 border border-sky-400/25">
                          Website
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5 text-[11px] text-white/55">
                      <span className="inline-flex items-center gap-1 font-mono"><Phone className="w-3 h-3 text-white/35" />{b.phone}</span>
                      {b.email && <span className="inline-flex items-center gap-1 truncate max-w-full"><Mail className="w-3 h-3 text-white/35" />{b.email}</span>}
                      {ago && <span className="inline-flex items-center gap-1"><Clock3 className="w-3 h-3 text-white/35" />{ago}</span>}
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-white/75 font-semibold">
                    <Armchair className="w-3 h-3 text-[#EB6A30]" />
                    {b.planName || b.plan || '—'}
                  </span>
                  {b.seatNumber && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-400/10 border border-emerald-400/25 text-emerald-300 font-bold">
                      Seat {b.seatNumber}
                    </span>
                  )}
                  {b.paymentMethod === 'Paid' && (
                    <span className="px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-white/60 font-semibold">
                      Paid{b.transactionId ? ` · ${b.transactionId}` : ''}
                    </span>
                  )}
                </div>

                {b.remarks && (
                  <p className="text-[11px] text-white/45 leading-relaxed border-l-2 border-[#EB6A30]/40 pl-2.5 italic line-clamp-2">
                    {b.remarks}
                  </p>
                )}

                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={() => onStatusChange(b.id, 'Active')}
                    disabled={savingBookingId === b.id}
                    className="inline-flex items-center gap-1.5 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:brightness-110 text-white text-xs font-bold px-4 py-2 rounded-full transition-all shadow-lg shadow-emerald-900/40 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {savingBookingId === b.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                    Confirm Seat
                  </button>
                  <button
                    onClick={() => onStatusChange(b.id, 'Pending')}
                    disabled={savingBookingId === b.id}
                    className="inline-flex items-center gap-1.5 bg-white/5 hover:bg-white/10 border border-white/15 text-white/70 hover:text-white text-xs font-bold px-4 py-2 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {savingBookingId === b.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CalendarDays className="w-3.5 h-3.5" />}
                    Mark Pending
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
