/**
 * Payment Gateway Sandbox (UAT-only) — /m/payment-gateway
 *
 * Browses the zorbit-pfs-payment_gateway catalog, renders a familiar per-type
 * form (card / UPI / NACH / bank transfer) and submits a MOCK attempt.
 *
 * Non-negotiable UI rule: a full-width red banner at the top reminds every
 * user that this is sandbox-only. Nothing submitted here touches a real
 * payment network; there is no PCI-DSS compliance.
 *
 * Backend: POST /api/payment-gateway/api/v1/G/payment-attempts
 */
import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { API_CONFIG } from '../../config';

interface Gateway {
  hashId: string;
  code: string;
  displayName: string;
  region: string[];
  logoUrl: string | null;
  enabled: boolean;
  config: { type?: string } | null;
}

interface Attempt {
  hashId: string;
  gatewayCode: string;
  amount: number;
  currency: string;
  status: string;
  mockTxnId?: string;
  mockResponse?: {
    mockTxnId?: string;
    environment?: string;
    pciCompliant?: boolean;
    warning?: string;
    echoedFields?: Record<string, unknown>;
  };
}

const REGION_LABELS: Record<string, string> = {
  north_america: 'North America',
  europe: 'Europe',
  uk: 'UK',
  india: 'India',
  south_asia: 'South Asia',
  middle_east: 'Middle East',
  southeast_asia: 'Southeast Asia',
  latam: 'LATAM',
  africa: 'Africa',
};

const API_BASE =
  (API_CONFIG as { paymentGateway?: string }).paymentGateway ||
  '/api/payment-gateway';

function authHeaders(): Record<string, string> {
  const token =
    typeof window !== 'undefined'
      ? localStorage.getItem('zorbit.token') ||
        localStorage.getItem('accessToken') ||
        ''
      : '';
  return token ? { Authorization: `Bearer ${token}` } : {};
}

/* ------------------------------------------------------------------ */
/*  Red banner — non-dismissible, tailwind                             */
/* ------------------------------------------------------------------ */

function SandboxBanner(): JSX.Element {
  return (
    <div className="bg-red-600 text-white font-bold text-xl py-4 px-6 border-4 border-red-800 shadow-lg">
      <div className="max-w-6xl mx-auto flex items-center gap-3">
        <span aria-hidden="true">⚠️</span>
        <div>
          <div className="leading-tight">
            UAT / SANDBOX ENVIRONMENT — DO NOT ENTER REAL CARD OR BANK
            DETAILS.
          </div>
          <div className="text-sm font-semibold opacity-90 mt-0.5">
            This system is NOT PCI-DSS compliant. For testing only.
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Gateway-type-specific mock forms                                   */
/* ------------------------------------------------------------------ */

type FormFields = Record<string, string>;

function CardForm({
  fields,
  setFields,
}: {
  fields: FormFields;
  setFields: (f: FormFields) => void;
}): JSX.Element {
  return (
    <div className="grid grid-cols-2 gap-3">
      <label className="col-span-2 text-sm">
        Card number (mock)
        <input
          type="text"
          value={fields.cardNumber || ''}
          onChange={(e) =>
            setFields({ ...fields, cardNumber: e.target.value })
          }
          placeholder="4111 1111 1111 1111"
          className="mt-1 w-full border rounded px-3 py-2"
        />
      </label>
      <label className="text-sm">
        Expiry
        <input
          type="text"
          value={fields.expiry || ''}
          onChange={(e) => setFields({ ...fields, expiry: e.target.value })}
          placeholder="12/28"
          className="mt-1 w-full border rounded px-3 py-2"
        />
      </label>
      <label className="text-sm">
        CVV
        <input
          type="text"
          value={fields.cvv || ''}
          onChange={(e) => setFields({ ...fields, cvv: e.target.value })}
          placeholder="123"
          className="mt-1 w-full border rounded px-3 py-2"
        />
      </label>
      <label className="col-span-2 text-sm">
        Name on card
        <input
          type="text"
          value={fields.nameOnCard || ''}
          onChange={(e) =>
            setFields({ ...fields, nameOnCard: e.target.value })
          }
          placeholder="Jane Doe"
          className="mt-1 w-full border rounded px-3 py-2"
        />
      </label>
    </div>
  );
}

function UpiForm({
  fields,
  setFields,
}: {
  fields: FormFields;
  setFields: (f: FormFields) => void;
}): JSX.Element {
  return (
    <label className="block text-sm">
      UPI ID (mock)
      <input
        type="text"
        value={fields.upi || ''}
        onChange={(e) => setFields({ ...fields, upi: e.target.value })}
        placeholder="demo@paytm"
        className="mt-1 w-full border rounded px-3 py-2"
      />
    </label>
  );
}

function NachForm({
  fields,
  setFields,
}: {
  fields: FormFields;
  setFields: (f: FormFields) => void;
}): JSX.Element {
  return (
    <div className="grid grid-cols-2 gap-3">
      <label className="col-span-2 text-sm">
        Bank account number (mock)
        <input
          type="text"
          value={fields.bankAccount || ''}
          onChange={(e) =>
            setFields({ ...fields, bankAccount: e.target.value })
          }
          placeholder="0001234567890"
          className="mt-1 w-full border rounded px-3 py-2"
        />
      </label>
      <label className="text-sm">
        IFSC
        <input
          type="text"
          value={fields.ifsc || ''}
          onChange={(e) => setFields({ ...fields, ifsc: e.target.value })}
          placeholder="ZZZZ0000001"
          className="mt-1 w-full border rounded px-3 py-2"
        />
      </label>
      <label className="text-sm">
        Mandate reference
        <input
          type="text"
          value={fields.mandateRef || ''}
          onChange={(e) =>
            setFields({ ...fields, mandateRef: e.target.value })
          }
          placeholder="NACH-DEMO-0001"
          className="mt-1 w-full border rounded px-3 py-2"
        />
      </label>
    </div>
  );
}

function WalletForm({
  fields,
  setFields,
}: {
  fields: FormFields;
  setFields: (f: FormFields) => void;
}): JSX.Element {
  return (
    <label className="block text-sm">
      Wallet phone/email (mock)
      <input
        type="text"
        value={fields.walletId || ''}
        onChange={(e) => setFields({ ...fields, walletId: e.target.value })}
        placeholder="+91 9999999999 or user@wallet"
        className="mt-1 w-full border rounded px-3 py-2"
      />
    </label>
  );
}

function GatewayForm({
  gateway,
  fields,
  setFields,
}: {
  gateway: Gateway;
  fields: FormFields;
  setFields: (f: FormFields) => void;
}): JSX.Element {
  const t = gateway.config?.type || 'card';
  if (t === 'upi' || t === 'upi_mandate') {
    return <UpiForm fields={fields} setFields={setFields} />;
  }
  if (t === 'nach') {
    return <NachForm fields={fields} setFields={setFields} />;
  }
  if (t === 'wallet') {
    return <WalletForm fields={fields} setFields={setFields} />;
  }
  return <CardForm fields={fields} setFields={setFields} />;
}

/* ------------------------------------------------------------------ */
/*  Main page                                                          */
/* ------------------------------------------------------------------ */

const PaymentGatewaySandboxPage: React.FC = () => {
  const [gateways, setGateways] = useState<Gateway[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeRegion, setActiveRegion] = useState<string>('all');
  const [selected, setSelected] = useState<Gateway | null>(null);
  const [fields, setFields] = useState<FormFields>({});
  const [amount, setAmount] = useState('100.00');
  const [currency, setCurrency] = useState('USD');
  const [submitting, setSubmitting] = useState(false);
  const [attempt, setAttempt] = useState<Attempt | null>(null);

  useEffect(() => {
    const url = `${API_BASE}/api/v1/G/payment-gateways`;
    axios
      .get<{ items: Gateway[]; total: number }>(url, { headers: authHeaders() })
      .then((res) => {
        setGateways(res.data.items || []);
        setLoading(false);
      })
      .catch((err) => {
        setError(err?.response?.data?.message || err.message);
        setLoading(false);
      });
  }, []);

  const regions = useMemo(() => {
    const s = new Set<string>();
    gateways.forEach((g) => (g.region || []).forEach((r) => s.add(r)));
    return Array.from(s).sort();
  }, [gateways]);

  const visible = useMemo(() => {
    if (activeRegion === 'all') return gateways;
    return gateways.filter((g) => (g.region || []).includes(activeRegion));
  }, [gateways, activeRegion]);

  const submit = async (): Promise<void> => {
    if (!selected) return;
    setSubmitting(true);
    setAttempt(null);
    try {
      const res = await axios.post<Attempt>(
        `${API_BASE}/api/v1/G/payment-attempts`,
        {
          gatewayCode: selected.code,
          amount: parseFloat(amount || '0') || 0,
          currency,
          mockFields: fields,
        },
        { headers: { ...authHeaders(), 'Content-Type': 'application/json' } },
      );
      setAttempt(res.data);
    } catch (err: any) {
      setAttempt({
        hashId: '',
        gatewayCode: selected.code,
        amount: parseFloat(amount || '0') || 0,
        currency,
        status: 'ERROR',
        mockResponse: {
          warning: err?.response?.data?.message || err.message,
        },
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <SandboxBanner />

      <div className="max-w-6xl mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold mb-1">Payment Gateway Sandbox</h1>
        <p className="text-sm text-slate-600 mb-6">
          Browse the platform catalog of payment gateways and submit a mock
          attempt. Every submission returns a deterministic UAT-MOCK-SUCCESS
          and records a row in <code>payment_attempts</code>.
        </p>

        {loading && (
          <div className="py-12 text-center text-slate-500">
            Loading gateway catalog…
          </div>
        )}

        {error && (
          <div className="rounded border border-red-300 bg-red-50 text-red-800 px-4 py-3 mb-4">
            Failed to load gateways: {error}
          </div>
        )}

        {!loading && !error && (
          <>
            {/* Region tabs */}
            <div className="flex flex-wrap gap-2 mb-4">
              <button
                type="button"
                onClick={() => setActiveRegion('all')}
                className={
                  'px-3 py-1.5 rounded border ' +
                  (activeRegion === 'all'
                    ? 'bg-slate-800 text-white border-slate-800'
                    : 'bg-white border-slate-300 hover:bg-slate-100')
                }
              >
                All ({gateways.length})
              </button>
              {regions.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setActiveRegion(r)}
                  className={
                    'px-3 py-1.5 rounded border ' +
                    (activeRegion === r
                      ? 'bg-slate-800 text-white border-slate-800'
                      : 'bg-white border-slate-300 hover:bg-slate-100')
                  }
                >
                  {REGION_LABELS[r] || r}
                </button>
              ))}
            </div>

            {/* Gateway grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mb-8">
              {visible.map((g) => (
                <button
                  key={g.code}
                  type="button"
                  onClick={() => {
                    setSelected(g);
                    setFields({});
                    setAttempt(null);
                  }}
                  className={
                    'rounded border px-4 py-3 text-left hover:shadow-sm ' +
                    (selected?.code === g.code
                      ? 'border-indigo-500 bg-indigo-50'
                      : 'border-slate-300 bg-white')
                  }
                >
                  <div className="font-semibold text-sm">{g.displayName}</div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    {(g.region || []).map((r) => REGION_LABELS[r] || r).join(', ')}
                  </div>
                  <div className="text-xs text-slate-400 mt-1">
                    {g.config?.type || 'card'}
                  </div>
                </button>
              ))}
            </div>

            {/* Selected gateway form */}
            {selected && (
              <div className="rounded border border-slate-300 bg-white p-5">
                <SandboxBanner />
                <div className="pt-4">
                  <div className="flex items-baseline justify-between mb-3">
                    <h2 className="text-lg font-semibold">
                      {selected.displayName} ({selected.code})
                    </h2>
                    <div className="text-xs text-slate-500">
                      Type: {selected.config?.type || 'card'}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <label className="text-sm">
                      Amount
                      <input
                        type="number"
                        min={0}
                        step="0.01"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        className="mt-1 w-full border rounded px-3 py-2"
                      />
                    </label>
                    <label className="text-sm">
                      Currency
                      <input
                        type="text"
                        maxLength={8}
                        value={currency}
                        onChange={(e) =>
                          setCurrency(e.target.value.toUpperCase())
                        }
                        className="mt-1 w-full border rounded px-3 py-2"
                      />
                    </label>
                  </div>

                  <GatewayForm
                    gateway={selected}
                    fields={fields}
                    setFields={setFields}
                  />

                  <div className="mt-5 flex items-center gap-3">
                    <button
                      type="button"
                      onClick={submit}
                      disabled={submitting}
                      className="bg-indigo-600 disabled:opacity-60 text-white px-5 py-2 rounded"
                    >
                      {submitting ? 'Submitting…' : 'Submit mock payment'}
                    </button>
                    <div className="text-xs text-red-700 font-semibold">
                      Sandbox only — no real money is moved.
                    </div>
                  </div>

                  {attempt && (
                    <div className="mt-5 rounded border border-slate-200 bg-slate-50 p-4">
                      <div className="text-sm font-semibold mb-1">
                        Result: {attempt.status}
                      </div>
                      <div className="text-xs text-slate-700 font-mono whitespace-pre-wrap break-all">
                        {JSON.stringify(attempt, null, 2)}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default PaymentGatewaySandboxPage;
