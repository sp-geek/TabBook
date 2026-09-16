import client from './client';

export function register({ name, email, password, role }) {
  return client.post('/api/auth/register', { name, email, password, role }).then((r) => r.data);
}

export function login({ email, password }) {
  return client.post('/api/auth/login', { email, password }).then((r) => r.data);
}
