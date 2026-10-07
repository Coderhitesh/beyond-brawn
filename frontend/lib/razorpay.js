let loader = null;

// Loads Razorpay Checkout once, on demand (only the checkout page pays this cost).
export function loadRazorpay() {
  if (typeof window === 'undefined') return Promise.resolve(false);
  if (window.Razorpay) return Promise.resolve(true);
  if (!loader) {
    loader = new Promise((resolve) => {
      const s = document.createElement('script');
      s.src = 'https://checkout.razorpay.com/v1/checkout.js';
      s.async = true;
      s.onload = () => resolve(true);
      s.onerror = () => {
        loader = null;
        resolve(false);
      };
      document.body.appendChild(s);
    });
  }
  return loader;
}

/*
 * Opens Razorpay Checkout for a server-created order.
 * Resolves with { razorpay_order_id, razorpay_payment_id, razorpay_signature } on success.
 * Rejects with Error('dismissed') when the shopper closes the window, or the gateway's failure message.
 * The result is NOT proof of payment: the caller must send it to /api/payments/verify.
 */
export function openRazorpay(rzp) {
  return new Promise((resolve, reject) => {
    let failure = null;
    const instance = new window.Razorpay({
      key: rzp.keyId,
      order_id: rzp.orderId,
      amount: rzp.amount,
      currency: rzp.currency,
      name: rzp.name,
      description: rzp.description,
      prefill: rzp.prefill,
      theme: { color: '#000000' },
      retry: { enabled: true, max_count: 3 },
      handler: (response) => resolve(response),
      modal: { ondismiss: () => reject(new Error(failure || 'dismissed')), confirm_close: true },
    });
    instance.on('payment.failed', (res) => {
      failure = (res.error && res.error.description) || 'Payment failed';
    });
    instance.open();
  });
}
