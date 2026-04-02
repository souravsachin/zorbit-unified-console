import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  CreditCard,
  Building2,
  Smartphone,
  Shield,
  Lock,
  CheckCircle,
  Loader2,
  AlertCircle,
  ChevronRight,
} from 'lucide-react';
import axios from 'axios';
import { API_CONFIG } from '../../config';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface PaymentInfo {
  paymentId: string;
  quotationHashId: string;
  quotationNumber?: string;
  productName?: string;
  amount: number;
  currency: string;
  customerName?: string;
  customerEmail?: string;
  status: string;
  expiresAt: string;
  organizationHashId?: string;
}

interface CompletionResult {
  success: boolean;
  transactionId: string;
  completedAt: string;
  amount: number;
  currency: string;
}

type PaymentMethod = 'card' | 'bank_transfer' | 'apple_pay';

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function formatCurrency(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat('en-AE', {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${currency} ${amount.toFixed(2)}`;
  }
}

function formatCardNumber(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 16);
  return digits.replace(/(.{4})/g, '$1 ').trim();
}

function formatExpiry(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 4);
  if (digits.length > 2) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return digits;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

const PaymentGatewayPage: React.FC = () => {
  const { paymentId } = useParams<{ paymentId: string }>();
  const base = API_CONFIG.UW_WORKFLOW_URL;

  const [payment, setPayment] = useState<PaymentInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [method, setMethod] = useState<PaymentMethod>('card');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [cardName, setCardName] = useState('');

  // Processing state
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<CompletionResult | null>(null);

  useEffect(() => {
    const fetchPayment = async () => {
      try {
        const res = await axios.get(
          `${base}/api/v1/G/uw-workflow/payments/${paymentId}`,
        );
        setPayment(res.data);
        if (res.data.status === 'completed') {
          setResult({
            success: true,
            transactionId: res.data.transactionId || 'N/A',
            completedAt: res.data.completedAt || new Date().toISOString(),
            amount: res.data.amount,
            currency: res.data.currency,
          });
        }
      } catch {
        setError('Payment not found or link has expired.');
      } finally {
        setLoading(false);
      }
    };
    if (paymentId) fetchPayment();
  }, [paymentId, base]);

  const handlePay = async () => {
    if (!payment) return;
    setProcessing(true);
    setError(null);

    // Simulate processing delay
    await new Promise((resolve) => setTimeout(resolve, 2000));

    try {
      const res = await axios.post(
        `${base}/api/v1/G/uw-workflow/payments/${paymentId}/complete`,
        { paymentMethod: method },
      );
      setResult(res.data);
    } catch (err: unknown) {
      const msg =
        (err as any)?.response?.data?.message || 'Payment processing failed.';
      setError(msg);
    } finally {
      setProcessing(false);
    }
  };

  /* ---------------------------------------------------------------- */
  /*  Loading / Error states                                           */
  /* ---------------------------------------------------------------- */

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  if (!payment && !result) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-gray-900 mb-2">
            Payment Not Found
          </h1>
          <p className="text-gray-500">
            {error || 'This payment link is invalid or has expired.'}
          </p>
        </div>
      </div>
    );
  }

  /* ---------------------------------------------------------------- */
  /*  Success Screen                                                   */
  /* ---------------------------------------------------------------- */

  if (result) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50 to-green-100 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          {/* Animated checkmark */}
          <div className="relative mx-auto w-20 h-20 mb-6">
            <div className="absolute inset-0 bg-emerald-100 rounded-full animate-ping opacity-20" />
            <div className="relative w-20 h-20 bg-emerald-500 rounded-full flex items-center justify-center">
              <CheckCircle className="h-10 w-10 text-white" />
            </div>
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-1">
            Payment Successful
          </h1>
          <p className="text-gray-500 mb-6">
            Your payment has been processed successfully.
          </p>

          <div className="bg-gray-50 rounded-xl p-4 space-y-3 text-left mb-6">
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Amount Paid</span>
              <span className="text-sm font-bold text-gray-900">
                {formatCurrency(result.amount, result.currency)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Transaction ID</span>
              <span className="text-sm font-mono text-gray-900">
                {result.transactionId}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Date</span>
              <span className="text-sm text-gray-900">
                {new Date(result.completedAt).toLocaleString()}
              </span>
            </div>
            {payment && (
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Quotation</span>
                <span className="text-sm text-gray-900">
                  {payment.quotationNumber || payment.quotationHashId}
                </span>
              </div>
            )}
          </div>

          <p className="text-xs text-gray-400 mb-4">
            A confirmation email will be sent to your registered email address.
          </p>

          <button
            onClick={() => (window.location.href = '/')}
            className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold transition-colors"
          >
            Return to Portal
          </button>
        </div>

        {/* Footer */}
        <div className="fixed bottom-4 left-0 right-0 text-center">
          <p className="text-xs text-gray-400">
            Powered by <span className="font-semibold">Zorbit Payments</span>
          </p>
        </div>
      </div>
    );
  }

  /* ---------------------------------------------------------------- */
  /*  Payment Form                                                     */
  /* ---------------------------------------------------------------- */

  const isExpired = payment!.expiresAt && new Date() > new Date(payment!.expiresAt);

  if (isExpired || payment!.status === 'expired') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-amber-50 to-orange-100 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <AlertCircle className="h-12 w-12 text-amber-400 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-gray-900 mb-2">
            Payment Link Expired
          </h1>
          <p className="text-gray-500">
            This payment link has expired. Please contact your insurance advisor
            to generate a new link.
          </p>
        </div>
      </div>
    );
  }

  const p = payment!;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-indigo-600 rounded-2xl mb-3">
            <span className="text-white font-bold text-xl">Z</span>
          </div>
          <h1 className="text-lg font-bold text-gray-900">Secure Payment</h1>
          <p className="text-sm text-gray-500">
            AWNIC Insurance Payments
          </p>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Order Summary */}
          <div className="bg-gradient-to-r from-indigo-600 to-blue-600 px-6 py-5 text-white">
            <div className="flex items-center justify-between mb-3">
              <span className="text-indigo-200 text-xs uppercase tracking-wider font-semibold">
                Order Summary
              </span>
              <span className="text-xs bg-white/20 rounded-full px-2.5 py-0.5 font-medium">
                {p.paymentId}
              </span>
            </div>
            <div className="space-y-1.5">
              <div className="flex justify-between text-sm">
                <span className="text-indigo-200">Quotation</span>
                <span className="font-medium">
                  {p.quotationNumber || p.quotationHashId}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-indigo-200">Product</span>
                <span className="font-medium">{p.productName || 'Insurance Product'}</span>
              </div>
              {p.customerName && (
                <div className="flex justify-between text-sm">
                  <span className="text-indigo-200">Customer</span>
                  <span className="font-medium">{p.customerName}</span>
                </div>
              )}
            </div>
            <div className="mt-4 pt-3 border-t border-white/20 flex justify-between items-end">
              <span className="text-indigo-200 text-sm">Total Amount</span>
              <span className="text-2xl font-bold tracking-tight">
                {formatCurrency(p.amount, p.currency)}
              </span>
            </div>
          </div>

          <div className="p-6 space-y-5">
            {/* Payment Method Selection */}
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2 block">
                Payment Method
              </label>
              <div className="grid grid-cols-3 gap-2">
                {([
                  { id: 'card' as const, label: 'Card', Icon: CreditCard },
                  { id: 'bank_transfer' as const, label: 'Bank Transfer', Icon: Building2 },
                  { id: 'apple_pay' as const, label: 'Apple Pay', Icon: Smartphone },
                ]).map(({ id, label, Icon }) => (
                  <button
                    key={id}
                    onClick={() => setMethod(id)}
                    className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all text-sm font-medium ${
                      method === id
                        ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                        : 'border-gray-200 hover:border-gray-300 text-gray-600'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Card Form */}
            {method === 'card' && (
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1 block">
                    Card Number
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={cardNumber}
                      onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                      placeholder="4242 4242 4242 4242"
                      maxLength={19}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none text-sm font-mono transition-all"
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 flex gap-1">
                      <img
                        src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='32' height='20' viewBox='0 0 32 20'%3E%3Crect width='32' height='20' rx='3' fill='%231A1F71'/%3E%3Ctext x='16' y='14' text-anchor='middle' fill='white' font-size='9' font-weight='bold' font-family='Arial'%3EVISA%3C/text%3E%3C/svg%3E"
                        alt="Visa"
                        className="h-5"
                      />
                      <img
                        src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='32' height='20' viewBox='0 0 32 20'%3E%3Crect width='32' height='20' rx='3' fill='%23252525'/%3E%3Ccircle cx='12' cy='10' r='6' fill='%23EB001B' opacity='0.8'/%3E%3Ccircle cx='20' cy='10' r='6' fill='%23F79E1B' opacity='0.8'/%3E%3C/svg%3E"
                        alt="Mastercard"
                        className="h-5"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-gray-600 mb-1 block">
                      Expiry Date
                    </label>
                    <input
                      type="text"
                      value={cardExpiry}
                      onChange={(e) => setCardExpiry(formatExpiry(e.target.value))}
                      placeholder="MM/YY"
                      maxLength={5}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none text-sm font-mono transition-all"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-600 mb-1 block">
                      CVV
                    </label>
                    <input
                      type="text"
                      value={cardCvv}
                      onChange={(e) =>
                        setCardCvv(e.target.value.replace(/\D/g, '').slice(0, 4))
                      }
                      placeholder="123"
                      maxLength={4}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none text-sm font-mono transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1 block">
                    Cardholder Name
                  </label>
                  <input
                    type="text"
                    value={cardName}
                    onChange={(e) => setCardName(e.target.value)}
                    placeholder="JOHN DOE"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none text-sm uppercase transition-all"
                  />
                </div>
              </div>
            )}

            {/* Bank Transfer */}
            {method === 'bank_transfer' && (
              <div className="bg-blue-50 rounded-xl p-4 text-sm text-blue-800 space-y-2">
                <p className="font-semibold">Bank Transfer Details</p>
                <div className="space-y-1 text-xs">
                  <p><span className="text-blue-500">Bank:</span> Emirates NBD</p>
                  <p><span className="text-blue-500">Account:</span> 1234-5678-9012-3456</p>
                  <p><span className="text-blue-500">IBAN:</span> AE07 0331 0000 1234 5678 901</p>
                  <p><span className="text-blue-500">SWIFT:</span> EABORAEDXXX</p>
                  <p><span className="text-blue-500">Reference:</span> {p.paymentId}</p>
                </div>
                <p className="text-xs text-blue-600 mt-2">
                  Click "Confirm Payment" after completing the transfer.
                </p>
              </div>
            )}

            {/* Apple Pay */}
            {method === 'apple_pay' && (
              <div className="bg-gray-900 rounded-xl p-5 text-center">
                <Smartphone className="h-8 w-8 text-white mx-auto mb-2" />
                <p className="text-white text-sm font-medium mb-1">
                  Apple Pay
                </p>
                <p className="text-gray-400 text-xs">
                  Click the button below to complete payment with Apple Pay.
                </p>
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="bg-red-50 rounded-xl px-4 py-3 flex items-center gap-2 text-sm text-red-600">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                {error}
              </div>
            )}

            {/* Pay Button */}
            <button
              onClick={handlePay}
              disabled={processing}
              className="w-full py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-semibold text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-200"
            >
              {processing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Processing Payment...
                </>
              ) : method === 'apple_pay' ? (
                <>
                  <Smartphone className="h-4 w-4" />
                  Pay with Apple Pay
                </>
              ) : method === 'bank_transfer' ? (
                <>
                  <Building2 className="h-4 w-4" />
                  Confirm Payment
                </>
              ) : (
                <>
                  Pay {formatCurrency(p.amount, p.currency)}
                  <ChevronRight className="h-4 w-4" />
                </>
              )}
            </button>

            {/* Security badges */}
            <div className="flex items-center justify-center gap-4 pt-2">
              <div className="flex items-center gap-1 text-xs text-gray-400">
                <Lock className="h-3 w-3" />
                <span>SSL Encrypted</span>
              </div>
              <div className="flex items-center gap-1 text-xs text-gray-400">
                <Shield className="h-3 w-3" />
                <span>PCI-DSS Compliant</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-6 space-y-2">
          <p className="text-xs text-gray-400">
            Powered by <span className="font-semibold text-gray-500">Zorbit Payments</span>
          </p>
          <p className="text-[10px] text-gray-400">
            This is a secure payment gateway. Your card details are never stored on our servers.
          </p>
        </div>
      </div>
    </div>
  );
};

export default PaymentGatewayPage;
