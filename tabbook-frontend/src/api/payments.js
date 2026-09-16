import client from './client';

export function createPaymentOrder(bookingId) {
  return client.post('/api/payments/create-order', { bookingId }).then((r) => r.data);
}

export function verifyPayment({ razorpay_order_id, razorpay_payment_id, razorpay_signature }) {
  return client
    .post('/api/payments/verify', { razorpay_order_id, razorpay_payment_id, razorpay_signature })
    .then((r) => r.data);
}
