import client from './client';

// Correct nested path — the v0 scaffold had this wrong (/slots/available?restaurantId=...)
export function getAvailableSlots(restaurantId, date) {
  return client
    .get(`/api/restaurants/${restaurantId}/slots`, { params: { date } })
    .then((r) => r.data);
}
