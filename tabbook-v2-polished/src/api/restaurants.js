import client from './client';

export function listRestaurants() {
  return client.get('/api/restaurants').then((r) => r.data);
}

export function getRestaurant(id) {
  return client.get(`/api/restaurants/${id}`).then((r) => r.data);
}

export function createRestaurant(data) {
  return client.post('/api/restaurants', data).then((r) => r.data);
}

export function updateRestaurant(id, data) {
  return client.patch(`/api/restaurants/${id}`, data).then((r) => r.data);
}

export function deleteRestaurant(id) {
  return client.delete(`/api/restaurants/${id}`).then((r) => r.data);
}

export function getRestaurantBookings(id) {
  return client.get(`/api/restaurants/${id}/bookings`).then((r) => r.data);
}

export function uploadRestaurantImage(restaurantId, file) {
  const formData = new FormData();
  formData.append('image', file);
  return client
    .post(`/api/restaurants/${restaurantId}/images`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    .then((r) => r.data);
}

export function deleteRestaurantImage(restaurantId, imageId) {
  return client.delete(`/api/restaurants/${restaurantId}/images/${imageId}`).then((r) => r.data);
}
