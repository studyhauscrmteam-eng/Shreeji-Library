import React, { useState } from 'react';
import { X, Lock, RefreshCw, UserCheck, Loader2 } from 'lucide-react';

export default function AdminModal({ isOpen, onClose }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pin, setPin] = useState('');
  const [pinError, setPinError] = useState('');
  const [bookings, setBookings] = useState([]);
  const [filter, setFilter] = useState('All');
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
              <p className="text-xs text-[#F5E4E4]/70">Manage student seat reservations</p>
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
            
            {/* Seat Bookings */}
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
                    No inquiries found. New website bookings appear here.
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

          </div>
        )}

      </div>
    </div>
  );
}
