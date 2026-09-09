declare module '@cashfreepayments/cashfree-js' {
  export interface CashfreeCheckoutOptions {
    paymentSessionId: string;
    redirectTarget?: '_self' | '_blank' | '_top' | '_modal';
    returnUrl?: string;
  }

  export interface CashfreeInstance {
    checkout(options: CashfreeCheckoutOptions): Promise<{
      paymentDetails?: { paymentMessage: string };
      error?: { message: string; type: string };
    }>;
  }

  export interface LoadOptions {
    mode: 'sandbox' | 'production';
  }

  export function load(options: LoadOptions): Promise<CashfreeInstance>;
}
