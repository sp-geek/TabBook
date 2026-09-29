import client from './client';

export function register({ name, email, password, role }) {
  return client.post('/api/auth/register', { name, email, password, role }).then((r) => r.data);
}

export function login({ email, password }) {
  return client.post('/api/auth/login', { email, password }).then((r) => r.data);
}

export function getProfile() {
  return client.get('/api/auth/me').then((r) => r.data);
}

export function updateProfile({ name, email, currentPassword, newPassword }) {
  return client
    .patch('/api/auth/me', { name, email, currentPassword, newPassword })
    .then((r) => r.data);
}
