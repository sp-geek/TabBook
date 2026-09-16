import client from './client';

export function listTables(restaurantId) {
  return client.get(`/api/restaurants/${restaurantId}/tables`).then((r) => r.data);
}

export function createTable(restaurantId, data) {
  return client.post(`/api/restaurants/${restaurantId}/tables`, data).then((r) => r.data);
}

export function updateTablePosition(restaurantId, tableId, { posX, posY }) {
  return client
    .patch(`/api/restaurants/${restaurantId}/tables/${tableId}/position`, { posX, posY })
    .then((r) => r.data);
}
