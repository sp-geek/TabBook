import client from './client';

// tableId + date + slotStart/slotEnd identify the slot being booked.
// guests is capped server-side by the table's capacity; notes is a free-text
// special request (e.g. "window seat please").
export function createBooking({ tableId, date, slotStart, slotEnd, guests, notes }) {
  return client
    .post('/api/bookings', { tableId, date, slotStart, slotEnd, guests, notes })
    .then((r) => r.data);
}

export function listMyBookings() {
  return client.get('/api/bookings/mine').then((r) => r.data);
}

export function cancelBooking(id) {
  return client.patch(`/api/bookings/${id}/cancel`).then((r) => r.data);
}
