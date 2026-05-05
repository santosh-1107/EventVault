import { useEffect, useMemo, useState } from 'react';

const MAX_SEATS = 8;

export default function SeatMap({ sections, selectedSeats, onSeatToggle }) {
  const [activeSection, setActiveSection] = useState(sections[0]?.section_id || null);

  useEffect(() => {
    if (!sections.length) {
      setActiveSection(null);
      return;
    }
    if (!sections.some((s) => s.section_id === activeSection)) {
      setActiveSection(sections[0].section_id);
    }
  }, [sections, activeSection]);

  const currentSection = sections.find((s) => s.section_id === activeSection);

  const seatsByRow = useMemo(() => {
    if (!currentSection) return {};
    return currentSection.seats.reduce((acc, seat) => {
      const row = seat.row_label || 'A';
      if (!acc[row]) acc[row] = [];
      acc[row].push(seat);
      return acc;
    }, {});
  }, [currentSection]);

  const getSeatStatus = (seat) => {
    if (selectedSeats.includes(seat.seat_id)) return 'selected';
    const status = (seat.seat_status || seat.status || '').toLowerCase();
    if (status !== 'available') return 'booked';
    return 'available';
  };

  const handleSeatClick = (seat) => {
    const status = getSeatStatus(seat);
    if (status === 'booked') return;

    if (status === 'available' && selectedSeats.length >= MAX_SEATS) {
      return; // Max reached
    }
    onSeatToggle(seat);
  };

  return (
    <div className="space-y-6">
      {/* Section Tabs */}
      {sections.length > 1 && (
        <div className="flex gap-2 flex-wrap">
          {sections.map((section) => (
            <button
              key={section.section_id}
              onClick={() => setActiveSection(section.section_id)}
              className={`px-4 py-2 rounded-xl text-sm font-medium border transition-all ${
                activeSection === section.section_id
                  ? 'bg-brand-500 border-brand-500 text-white shadow-glow'
                  : 'bg-dark-600 border-white/10 text-gray-400 hover:border-white/20 hover:text-white'
              }`}
            >
              {section.section_name}
              <span className="ml-2 text-xs opacity-70">
                ₹{Number(section.seats?.[0]?.price || 0).toLocaleString()}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Stage indicator */}
      <div className="relative">
        <div className="w-full h-10 bg-gradient-to-b from-brand-500/20 to-transparent rounded-xl flex items-center justify-center">
          <span className="text-xs text-brand-400 font-medium tracking-widest uppercase">STAGE / SCREEN</span>
        </div>
      </div>

      {/* Seat Grid */}
      {currentSection && (
        <div className="overflow-x-auto">
          <div className="min-w-max mx-auto space-y-2">
            {Object.entries(seatsByRow)
              .sort(([a], [b]) => a.localeCompare(b))
              .map(([row, seats]) => (
                <div key={row} className="flex items-center gap-2">
                  <span className="w-6 text-xs text-gray-600 font-mono text-right shrink-0">{row}</span>
                  <div className="flex gap-1.5">
                    {seats
                      .sort((a, b) => a.col_number - b.col_number)
                      .map((seat) => {
                        const status = getSeatStatus(seat);
                        return (
                          <button
                            key={seat.seat_id}
                            onClick={() => handleSeatClick(seat)}
                            title={`${seat.seat_label} – ₹${Number(seat.price).toLocaleString()}`}
                            className={`seat-btn seat-${status}`}
                            disabled={status === 'booked'}
                          >
                            {seat.col_number}
                          </button>
                        );
                      })}
                  </div>
                  <span className="w-6 text-xs text-gray-600 font-mono shrink-0">{row}</span>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="flex items-center justify-center gap-6 pt-2">
        {[
          { status: 'available', label: 'Available' },
          { status: 'selected', label: 'Selected' },
          { status: 'booked', label: 'Booked' },
        ].map(({ status, label }) => (
          <div key={status} className="flex items-center gap-2">
            <div className={`seat-btn seat-${status} pointer-events-none`} style={{ width: 20, height: 20, fontSize: 8 }} />
            <span className="text-xs text-gray-500">{label}</span>
          </div>
        ))}
      </div>

      {/* Max seats notice */}
      {selectedSeats.length >= MAX_SEATS && (
        <p className="text-center text-xs text-yellow-500 bg-yellow-500/10 border border-yellow-500/20 rounded-xl py-2 px-4">
          Maximum {MAX_SEATS} seats per booking
        </p>
      )}
    </div>
  );
}
