import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { getRestaurant } from '../api/restaurants';
import { getAvailableSlots } from '../api/slots';
import { createBooking, cancelBooking } from '../api/bookings';
import { createPaymentOrder, verifyPayment } from '../api/payments';
import { openRazorpayCheckout } from '../razorpay';
import { useAuth } from '../context/AuthContext';
import TableCanvas from '../components/TableCanvas';

function todayISO() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export default function RestaurantDetailPage() {
  const { id } = useParams();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [restaurant, setRestaurant] = useState(null);
  const [date, setDate] = useState(todayISO());
  const [slots, setSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [selectedArea, setSelectedArea] = useState(null);
  const [selectedTableId, setSelectedTableId] = useState(null);
  const [activePhoto, setActivePhoto] = useState(0);
  const [guests, setGuests] = useState(1);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [status, setStatus] = useState({ type: null, message: '' });
  const [booking, setBooking] = useState(false);

  useEffect(() => {
    getRestaurant(id)
      .then((r) => {
        setRestaurant(r);
        const areas = [...new Set((r.tables || []).map((t) => t.area || 'Main Floor'))];
        setSelectedArea(areas[0] || 'Main Floor');
      })
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!date) return;
    setSlotsLoading(true);
    setSelectedSlot(null);
    setSelectedTableId(null);
    getAvailableSlots(id, date)
      .then((res) => setSlots(res.slots))
      .catch(() => setSlots([]))
      .finally(() => setSlotsLoading(false));
  }, [id, date]);

  const areas = useMemo(
    () => [...new Set((restaurant?.tables || []).map((t) => t.area || 'Main Floor'))],
    [restaurant]
  );
  const tablesInArea = useMemo(
    () => (restaurant?.tables || []).filter((t) => (t.area || 'Main Floor') === selectedArea),
    [restaurant, selectedArea]
  );
  const selectedTable = useMemo(
    () => (restaurant?.tables || []).find((t) => t.id === selectedTableId) || null,
    [restaurant, selectedTableId]
  );
  const photos = useMemo(
    () => (restaurant?.images || []).slice().sort((a, b) => a.position - b.position),
    [restaurant]
  );

  useEffect(() => {
    // Guest count can't exceed the newly selected table's capacity.
    if (selectedTable && guests > selectedTable.capacity) {
      setGuests(selectedTable.capacity);
    }
  }, [selectedTable]); // eslint-disable-line react-hooks/exhaustive-deps

  function handleSelectSlot(slot) {
    setSelectedSlot(slot);
    setSelectedTableId(null);
    setStatus({ type: null, message: '' });
  }

  async function handleBookAndPay() {
    if (!isAuthenticated) { navigate('/login'); return; }
    if (!selectedSlot || !selectedTableId) return;

    setBooking(true);
    setStatus({ type: null, message: '' });
    let newBooking = null;

    try {
      newBooking = await createBooking({
        tableId: selectedTableId,
        date,
        slotStart: selectedSlot.slotStart,
        slotEnd: selectedSlot.slotEnd,
        guests,
        notes: notes.trim() || undefined,
      });

      const order = await createPaymentOrder(newBooking.id);
      const rzpResponse = await openRazorpayCheckout({
        keyId: order.razorpayKeyId,
        orderId: order.razorpayOrderId,
        amount: order.amount,
      });
      await verifyPayment(rzpResponse);

      setStatus({ type: 'success', message: 'Reservation confirmed. Check "Bookings" for details.' });
      setSelectedSlot(null);
      setSelectedTableId(null);
      setGuests(1);
      setNotes('');
      getAvailableSlots(id, date).then((res) => setSlots(res.slots));
    } catch (err) {
      if (newBooking) {
        try {
          await cancelBooking(newBooking.id);
          getAvailableSlots(id, date).then((res) => setSlots(res.slots));
        } catch { /* best-effort cleanup */ }
      }
      const cancelled = err.message === 'Payment cancelled';
      setStatus({
        type: 'error',
        message: cancelled
          ? 'Payment cancelled — your table hold has been released. Feel free to try again.'
          : err.response?.data?.error || err.message || 'Something went wrong',
      });
    } finally {
      setBooking(false);
    }
  }

  if (loading) return <main className="content"><p style={{ color: '#6f7872' }}>Loading…</p></main>;
  if (!restaurant) return <main className="content"><p style={{ color: '#6f7872' }}>Restaurant not found.</p></main>;

  const availableTableIds = selectedSlot ? selectedSlot.availableTableIds : [];

  return (
    <main className="booking">
      <Link className="back" to="/">← Back to discover</Link>

      <div className="booking-grid">
        <div>
          {photos.length > 0 ? (
            <div className="gallery">
              <img className="gallery-main" src={photos[activePhoto]?.url} alt="" />
              {photos.length > 1 && (
                <div className="gallery-strip">
                  {photos.map((p, i) => (
                    <img
                      key={p.id}
                      src={p.url}
                      alt=""
                      className={i === activePhoto ? 'selected' : ''}
                      onClick={() => setActivePhoto(i)}
                    />
                  ))}
                </div>
              )}
            </div>
          ) : (
            <img className="hero-image" style={{ height: 260, width: '100%' }} src="/placeholder.svg" alt="" />
          )}

          <p className="section-label">{restaurant.name}</p>
          <h1 style={{ fontSize: 34, margin: '0 0 4px' }}>{restaurant.name}</h1>
          <p style={{ color: '#6f7872', margin: 0 }}>
            {restaurant.address}
            {restaurant.city ? `, ${restaurant.city}` : ''}
            {restaurant.cuisine ? ` · ${restaurant.cuisine}` : ''} · {restaurant.openTime}–{restaurant.closeTime}
            {' · ₹'}{restaurant.bookingPrice ?? 100} per guest
          </p>
          {restaurant.description && (
            <p style={{ color: '#6f7872', marginTop: 10 }}>{restaurant.description}</p>
          )}

          <p className="section-label">1. Choose your time</p>
          <input
            type="date"
            className="field"
            style={{ maxWidth: 220 }}
            value={date}
            min={todayISO()}
            onChange={(e) => setDate(e.target.value)}
          />
          <div className="pills" style={{ marginTop: 14 }}>
            {slotsLoading && <p style={{ color: '#6f7872', fontSize: 14 }}>Loading slots…</p>}
            {!slotsLoading &&
              slots.map((slot) => (
                <button
                  key={slot.slotStart}
                  disabled={slot.availableTableCount === 0}
                  className={selectedSlot?.slotStart === slot.slotStart ? 'selected' : ''}
                  onClick={() => handleSelectSlot(slot)}
                >
                  {slot.slotStart}
                </button>
              ))}
          </div>

          {areas.length > 1 && (
            <>
              <p className="section-label">2. Choose your area</p>
              <div className="tabs">
                {areas.map((a) => (
                  <button
                    key={a}
                    className={selectedArea === a ? 'selected' : ''}
                    onClick={() => setSelectedArea(a)}
                  >
                    {a}
                  </button>
                ))}
              </div>
            </>
          )}

          <p className="section-label">{areas.length > 1 ? '3.' : '2.'} Pick a table</p>
          <TableCanvas
            tables={tablesInArea}
            mode="view"
            availableTableIds={selectedSlot ? availableTableIds : []}
            selectedTableId={selectedTableId}
            onSelectTable={setSelectedTableId}
          />

          {selectedTableId && (
            <>
              <p className="section-label">{areas.length > 1 ? '4.' : '3.'} Party details</p>
              <div style={{ display: 'flex', gap: 10 }}>
                <input
                  className="field"
                  type="number"
                  min={1}
                  max={selectedTable?.capacity || 99}
                  style={{ maxWidth: 140 }}
                  value={guests}
                  onChange={(e) => setGuests(Math.max(1, Number(e.target.value)))}
                />
                <input
                  className="field"
                  placeholder="Notes (e.g. window seat please)"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
              {selectedTable && (
                <p className="hint" style={{ marginTop: 4 }}>
                  This table seats up to {selectedTable.capacity} guests.
                </p>
              )}
            </>
          )}
        </div>

        <aside className="summary">
          <p className="eyebrow">Your reservation</p>
          <h2>{restaurant.name}</h2>
          <p>
            {selectedSlot ? `${date} · ${selectedSlot.slotStart}` : 'Pick a time and table'}
          </p>
          {selectedTableId && (
            <div className="row">
              <span>Table</span>
              <span>#{selectedTableId}</span>
            </div>
          )}
          {selectedTableId && (
            <div className="row">
              <span>Guests</span>
              <span>{guests}</span>
            </div>
          )}
          <div className="row">
            <span>Price</span>
            <span>₹{(restaurant.bookingPrice ?? 100) * (selectedTableId ? guests : 1)}</span>
          </div>

          {status.message && (
            <div className={`status-msg ${status.type === 'success' ? 'success' : 'error'}`}>
              {status.message}
            </div>
          )}

          <button
            className="primary"
            disabled={!selectedSlot || !selectedTableId || booking}
            onClick={handleBookAndPay}
          >
            {booking ? 'Processing…' : 'Book & pay →'}
          </button>
        </aside>
      </div>
    </main>
  );
}
