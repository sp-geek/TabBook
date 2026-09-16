import { useEffect, useState } from 'react';
import { listMyBookings, cancelBooking } from '../api/bookings';

export default function MyBookingsPage() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState(null);

  function load() {
    setLoading(true);
    listMyBookings().then(setBookings).finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  async function handleCancel(id) {
    setCancellingId(id);
    try { await cancelBooking(id); load(); } finally { setCancellingId(null); }
  }

  return (
    <main className="content">
      <p className="eyebrow">Your table trail</p>
      <h1>Bookings</h1>

      {loading && <p style={{ color: '#6f7872' }}>Loading…</p>}
      {!loading && bookings.length === 0 && (
        <div className="empty">Your confirmed reservations will appear here.</div>
      )}

      {bookings.map((b) => (
        <div className="booking-row" key={b.id}>
          <div>
            <strong style={{ fontFamily: "'Space Grotesk'", fontSize: 17 }}>
              {new Date(b.date).toLocaleDateString(undefined, { dateStyle: 'medium' })} · {b.slotStart}–{b.slotEnd}
            </strong>
            <p style={{ color: '#6f7872', margin: '4px 0 0' }}>
              Table #{b.tableId} · {b.guests || 1} guest{(b.guests || 1) === 1 ? '' : 's'}
            </p>
            {b.notes && (
              <p style={{ color: '#6f7872', margin: '4px 0 0', fontStyle: 'italic' }}>"{b.notes}"</p>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <span className={`badge ${b.status}`}>{b.status}</span>
            {(b.status === 'PENDING' || b.status === 'CONFIRMED') && (
              <button className="ghost-btn" disabled={cancellingId === b.id} onClick={() => handleCancel(b.id)}>
                {cancellingId === b.id ? 'Cancelling…' : 'Cancel'}
              </button>
            )}
          </div>
        </div>
      ))}
    </main>
  );
}
