import React, { useState, useMemo } from 'react';
import { Check } from 'lucide-react';

// Official room geometry (port of the CRM seat map). Ground: A1–A68,
// First: B1–B40. `null` = structural gap (aisle/door space).
const GROUND_COLS = [
  [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18].map((n) => `A${n}`),
  [null, 34, 33, 32, 31, 30, 29, 28, 27, 26, 25, 24, 67, 23, 22, 21, 20, 19].map((n) => (n ? `A${n}` : null)),
  [null, 35, 36, null, 37, 38, 39, 40, 41, 42, null, 43, 68, 44, 45, 46, 47, 48].map((n) => (n ? `A${n}` : null)),
  [66, 65, 64, 63, 62, 61, 60, 59, 58, 57, 56, 55, 54, 53, 52, 51, 50, 49].map((n) => `A${n}`),
];
const FIRST_COLS = [
  [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, null].map((n) => (n ? `B${n}` : null)),
  [null, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11].map((n) => (n ? `B${n}` : null)),
  [null, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30].map((n) => (n ? `B${n}` : null)),
  [40, 39, 38, 37, 36, 35, 34, 33, 32, 31, null].map((n) => (n ? `B${n}` : null)),
];

const AB_PATTERN = /^[AB]\d+$/;

// DB "A01" vs layout "A1" — strip leading zeros before matching.
// The DB-exact value is always what gets sent/stored.
export const normalizeSeatNumber = (value) => {
  const raw = String(value == null ? '' : value).trim().toUpperCase().replace(/\s+/g, '');
  const m = raw.match(/^([A-Z]+)-?0*(\d+)$/);
  return m ? `${m[1]}${Number(m[2])}` : raw;
};

const compareSeatNumbers = (a, b) =>
  String(a == null ? '' : a).localeCompare(String(b == null ? '' : b), undefined, {
    numeric: true,
    sensitivity: 'base',
  });

// Room layout only fits A/B-named floors; anything else gets the generic grid
// so every real seat still renders.
const shouldUseRoomLayout = (seats) => {
  if (!Array.isArray(seats) || seats.length === 0) return true;
  return seats.every((s) => AB_PATTERN.test(String(s && s.seatNumber)));
};

const tileBase = (large) =>
  `rounded-[10px] ${large ? 'h-16 text-sm' : 'h-11 text-[11px]'} w-full flex items-center justify-center font-mono font-bold tracking-wide border-2 transition-all duration-150`;

function SeatTile({ seat, pickable, selected, onTap, large = false }) {
  const TILE_BASE = tileBase(large);
  if (selected) {
    return (
      <button
        type="button"
        onClick={() => onTap(seat)}
        title={`${seat.seatNumber} · selected — tap to change`}
        className={`${TILE_BASE} bg-[#EB6A30] border-[#EB6A30] text-white shadow-[0_6px_16px_rgba(235,106,48,0.45)] cursor-pointer`}
      >
        <Check className="w-3.5 h-3.5 stroke-[3]" />
        <span className="ml-0.5">{seat.seatNumber}</span>
      </button>
    );
  }
  if (seat.status === 'Available') {
    return (
      <button
        type="button"
        onClick={() => pickable && onTap(seat)}
        title={`${seat.seatNumber} · Available${pickable ? '' : ' – not selectable'}`}
        className={`${TILE_BASE} bg-white border-emerald-300 text-emerald-700 ${
          pickable ? 'hover:bg-emerald-50 hover:border-emerald-500 hover:shadow-[0_4px_12px_rgba(16,185,129,0.25)] cursor-pointer' : 'cursor-default'
        }`}
      >
        {seat.seatNumber}
      </button>
    );
  }
  const taken = seat.status === 'Occupied';
  return (
    <div
      title={`${seat.seatNumber} · ${seat.status}`}
      className={`${TILE_BASE} ${
        taken
          ? 'bg-[#F5E4E4]/60 border-red-200 text-red-300 line-through'
          : 'bg-amber-50 border-amber-200 text-amber-400'
      }`}
    >
      {seat.seatNumber}
    </div>
  );
}

const GapTile = ({ large = false }) => <div className={`${large ? 'h-16' : 'h-11'} w-full`} />;

/**
 * SeatMapPicker — light warm theme matching the main site. Renders the
 * official room geometry (swappable when client artwork lands) overlaid
 * with live Firestore status.
 *
 * Props:
 *   seats            [{ id, seatNumber, status, floor }]
 *   selectable       plan.seatPreference === true → taps select
 *   selectedSeatId   currently picked seat doc id (or null)
 *   onSelect(seat|null)  toggles on tap
 */
export default function SeatMapPicker({ seats = [], selectable = false, selectedSeatId = null, onSelect, large = false }) {
  const [floor, setFloor] = useState('Ground Floor');

  const byId = useMemo(() => {
    const m = new Map();
    (seats || []).forEach((s) => {
      if (s && s.id) m.set(s.id, s);
    });
    return m;
  }, [seats]);

  const floorSeats = useMemo(
    () => (seats || []).filter((s) => (s && s.floor ? s.floor : 'Ground Floor') === floor),
    [seats, floor]
  );

  const findByLayoutName = (name) => {
    const target = normalizeSeatNumber(name);
    return floorSeats.find((s) => normalizeSeatNumber(s.seatNumber) === target) || null;
  };

  const avail = useMemo(() => floorSeats.filter((s) => s.status === 'Available').length, [floorSeats]);

  const tap = (seat) => {
    if (!selectable || seat.status !== 'Available') return;
    onSelect(seat.id === selectedSeatId ? null : seat);
  };

  const cols = floor === 'First Floor' ? FIRST_COLS : GROUND_COLS;
  const useRoom = shouldUseRoomLayout(floorSeats);
  const selectedSeat = selectedSeatId ? byId.get(selectedSeatId) : null;

  return (
    <div>
      {/* Legend with counts + floor switch — single line */}
      <div className="flex items-center justify-between gap-2 mb-3 flex-wrap">
        <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-[1.5px] text-[#201E1F]/45">
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-[4px] bg-white border-[1.5px] border-emerald-400" />
            Free <span className="text-emerald-600 font-extrabold">{avail}</span>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-[4px] bg-[#F5E4E4] border border-red-200" />
            Taken <span className="text-[#201E1F]/60 font-extrabold">{floorSeats.length - avail}</span>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-[4px] bg-[#EB6A30]" />
            Yours
          </span>
        </div>
        <div className="inline-flex items-center gap-1.5">
          <span className="text-[10px] font-bold uppercase tracking-[1.5px] text-[#201E1F]/45">Floor</span>
          <div className="inline-flex items-center gap-1 bg-[#F5E4E4] p-1 rounded-full">
            {['Ground Floor', 'First Floor'].map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFloor(f)}
                className={`px-3.5 py-1.5 rounded-full text-[11px] font-extrabold transition-all ${
                  floor === f ? 'bg-[#983132] text-white shadow' : 'text-[#201E1F]/50 hover:text-[#201E1F]'
                }`}
              >
                {f.replace(' Floor', '')}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Map */}
      {useRoom ? (
        <div className="relative rounded-2xl border border-[#F5E4E4] bg-white px-3 pt-9 pb-12 sm:px-4 shadow-[inset_0_2px_12px_rgba(152,49,50,0.05)]">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 bg-[#FFF0E8] border border-[#F5E4E4] border-t-0 px-5 py-1 rounded-b-xl text-[9px] font-extrabold tracking-[2px] text-[#983132]">
            DOOR
          </div>
          <div className={`flex justify-center ${large ? 'gap-3 sm:gap-3.5' : 'gap-2 sm:gap-2.5'}`}>
            {cols.map((col, ci) => (
              <div key={ci} className={`flex flex-col flex-1 min-w-0 ${large ? 'gap-2.5' : 'gap-1.5'}`}>
                {col.map((name, ri) => {
                  if (name === null) return <GapTile key={ri} large={large} />;
                  const seat = findByLayoutName(name);
                  if (!seat) return <GapTile key={ri} large={large} />;
                  return (
                    <SeatTile
                      key={seat.id}
                      seat={seat}
                      pickable={selectable && seat.status === 'Available'}
                      selected={seat.id === selectedSeatId}
                      onTap={tap}
                      large={large}
                    />
                  );
                })}
              </div>
            ))}
          </div>
          <div className="absolute bottom-0 left-0 right-0 flex justify-around pointer-events-none">
            {['TOILET-1', 'TOILET-2'].map((t) => (
              <div key={t} className="bg-[#FFF0E8] border border-[#F5E4E4] border-b-0 px-5 py-1 rounded-t-xl text-[9px] font-extrabold tracking-[2px] text-[#983132]/70">
                {t}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className={`grid ${large ? 'gap-2' : 'gap-1.5'}`} style={{ gridTemplateColumns: `repeat(auto-fill, minmax(${large ? 76 : 64}px, 1fr))` }}>
          {[...floorSeats]
            .sort((a, b) => compareSeatNumbers(a.seatNumber, b.seatNumber))
            .map((seat) => (
              <SeatTile
                key={seat.id}
                seat={seat}
                pickable={selectable && seat.status === 'Available'}
                selected={seat.id === selectedSeatId}
                onTap={tap}
                large={large}
              />
            ))}
        </div>
      )}

      {/* Selection status */}
      <div className="mt-3 min-h-[20px] text-[12px]">
        {floorSeats.length === 0 ? (
          <p className="text-[#201E1F]/45">No seats on this floor yet.</p>
        ) : selectedSeat ? (
          <p className="text-[#201E1F]/75">
            <span className="font-mono font-extrabold text-[#983132]">{selectedSeat.seatNumber}</span>
            <span className="text-[#201E1F]/45"> · {floor}</span>
            <button type="button" onClick={() => onSelect(null)} className="ml-2 underline underline-offset-2 text-[#201E1F]/45 hover:text-[#983132] transition-colors">
              Change
            </button>
          </p>
        ) : selectable ? (
          <p className="text-[#201E1F]/45">Pick any free desk — the admin confirms it at approval.</p>
        ) : (
          <p className="text-[#201E1F]/45">View-only for this plan — the admin assigns your seat at approval.</p>
        )}
      </div>
    </div>
  );
}
