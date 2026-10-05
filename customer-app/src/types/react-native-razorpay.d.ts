declare module 'react-native-razorpay' {
  export type RazorpayOptions = {
    key: string;
    amount: number | string;
    currency?: string;
    order_id?: string;
    name?: string;
    description?: string;
    image?: string;
    prefill?: { name?: string; email?: string; contact?: string };
    theme?: { color?: string; hide_topbar?: boolean };
    [key: string]: any;
  };

  export type PaymentSuccessData = {
    razorpay_payment_id: string;
    razorpay_order_id: string;
    razorpay_signature: string;
  };

  export type PaymentErrorData = {
    code: number;
    description: string;
    source?: string;
    step?: string;
    reason?: string;
    metadata?: { order_id?: string; payment_id?: string };
  };

  export default class RazorpayCheckout {
    static open(options: RazorpayOptions): Promise<PaymentSuccessData>;
    static onExternalWalletSelection(callback: (data: { external_wallet: string }) => void): void;
  }
}
