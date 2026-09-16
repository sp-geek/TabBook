const crypto = require('crypto');
const getRazorpayInstance = require('../lib/razorpay');
const getPrisma = require('../lib/prisma');

function httpError(status, message) {
  const err = new Error(message);
  err.status = status;
  return err;
}

async function createOrderForBooking({ bookingId, userId }) {
  const db = await getPrisma();

  const booking = await db.orm.public.Booking.where({ id: Number(bookingId) }).first();
  if (!booking) {
    throw httpError(404, 'Booking not found');
  }
  if (booking.userId !== userId) {
    throw httpError(403, 'This booking does not belong to you');
  }
  if (booking.status !== 'PENDING') {
    throw httpError(400, `Booking is not payable (status: ${booking.status})`);
  }

  // Price comes from the restaurant the table belongs to, set by the owner,
  // multiplied by party size — not a flat per-booking fee.
  const table = await db.orm.public.Table.where({ id: booking.tableId }).first();
  const restaurant = await db.orm.public.Restaurant.where({ id: table.restaurantId }).first();
  const bookingFeeInr = restaurant.bookingPrice * booking.guests;

  const existingPayment = await db.orm.public.Payment.where({ bookingId: booking.id }).first();
  if (existingPayment && existingPayment.status === 'SUCCESS') {
    throw httpError(400, 'This booking has already been paid for');
  }

  const razorpay = getRazorpayInstance();
  const amountInPaise = Math.round(bookingFeeInr * 100);

  const order = await razorpay.orders.create({
    amount: amountInPaise,
    currency: 'INR',
    receipt: `booking_${booking.id}`,
    notes: { bookingId: String(booking.id) },
  });

  let payment;
  if (existingPayment) {
    payment = await db.orm.public.Payment.where({ id: existingPayment.id }).update({
      gatewayOrderId: order.id,
      amount: bookingFeeInr,
      status: 'PENDING',
    });
  } else {
    payment = await db.orm.public.Payment.create({
      bookingId: booking.id,
      amount: bookingFeeInr,
      gatewayOrderId: order.id,
      status: 'PENDING',
    });
  }

  return {
    payment,
    razorpayOrderId: order.id,
    razorpayKeyId: process.env.RAZORPAY_KEY_ID, // safe to expose, it's the public key
    amount: amountInPaise,
    currency: 'INR',
  };
}

async function verifyAndConfirmPayment({
  userId,
  razorpay_order_id,
  razorpay_payment_id,
  razorpay_signature,
}) {
  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    throw httpError(400, 'razorpay_order_id, razorpay_payment_id, and razorpay_signature are required');
  }

  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest('hex');

  if (expectedSignature !== razorpay_signature) {
    throw httpError(400, 'Invalid payment signature');
  }

  const db = await getPrisma();

  const payment = await db.orm.public.Payment.where({ gatewayOrderId: razorpay_order_id }).first();
  if (!payment) {
    throw httpError(404, 'Payment record not found for this order');
  }

  const booking = await db.orm.public.Booking.where({ id: payment.bookingId }).first();
  if (!booking || booking.userId !== userId) {
    throw httpError(403, 'This payment does not belong to you');
  }

  const updatedPayment = await db.orm.public.Payment.where({ id: payment.id }).update({
    status: 'SUCCESS',
  });

  const updatedBooking = await db.orm.public.Booking.where({ id: booking.id }).update({
    status: 'CONFIRMED',
  });

  return { payment: updatedPayment, booking: updatedBooking };
}

module.exports = { createOrderForBooking, verifyAndConfirmPayment };
