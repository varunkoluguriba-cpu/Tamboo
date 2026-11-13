// Razorpay Standard Checkout for the web. Resolves with the signed result on success;
// rejects with { cancelled: true } if the customer closes the sheet, or the failure description.
export type RzpResult = { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string };
type Opts = { key: string; order_id: string; amount: number; currency: string; name: string; description: string; prefill?: { name?: string; contact?: string } };

declare global { interface Window { Razorpay?: new (o: unknown) => { open: () => void; on: (e: string, cb: (r: { error?: { description?: string } }) => void) => void } } }

let loading: Promise<void> | null = null;
function loadScript(): Promise<void> {
  if (window.Razorpay) return Promise.resolve();
  if (!loading) {
    loading = new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = 'https://checkout.razorpay.com/v1/checkout.js';
      s.onload = () => resolve();
      s.onerror = () => { loading = null; reject(new Error('Could not load the payment page. Check your connection.')); };
      document.body.appendChild(s);
    });
  }
  return loading;
}

export async function payWithRazorpay(o: Opts): Promise<RzpResult> {
  await loadScript();
  return new Promise((resolve, reject) => {
    let failed = '';
    const rzp = new window.Razorpay!({
      ...o,
      theme: { color: '#4d0013' },
      handler: (r: RzpResult) => resolve(r),
      modal: { ondismiss: () => reject(failed ? new Error(failed) : { cancelled: true }) },
    });
    rzp.on('payment.failed', (r) => { failed = r.error?.description || 'Payment failed'; });
    rzp.open();
  });
}
