function loadScript(src) {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) { resolve(); return; }
    const script = document.createElement('script');
    script.src = src;
    script.onload = resolve;
    script.onerror = () => reject(new Error('Failed to load Razorpay checkout script'));
    document.body.appendChild(script);
  });
}

export async function openRazorpayCheckout({ keyId, orderId, amount, name = 'tabbook' }) {
  await loadScript('https://checkout.razorpay.com/v1/checkout.js');
  return new Promise((resolve, reject) => {
    const options = {
      key: keyId,
      amount,
      currency: 'INR',
      name,
      description: 'Table booking payment',
      order_id: orderId,
      handler: (response) => resolve(response),
      modal: { ondismiss: () => reject(new Error('Payment cancelled')) },
      theme: { color: '#ff654d' },
    };
    const rzp = new window.Razorpay(options);
    rzp.on('payment.failed', (response) => reject(new Error(response.error?.description || 'Payment failed')));
    rzp.open();
  });
}
