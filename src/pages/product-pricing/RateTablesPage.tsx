import React, { useState, useEffect } from 'react';
import { Calculator, Plus, Eye, RefreshCw } from 'lucide-react';

const API_BASE = '/api/product-pricing/api/v1/O/O-OZPY/product-pricing';

const RateTablesPage: React.FC = () => {
  const [tables, setTables] = useState<any[]>([]);
  const [selected, setSelected] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [lookupResult, setLookupResult] = useState<any>(null);
  const [lookupForm, setLookupForm] = useState({ age: '35', gender: 'Male', network: 'CN', copay: '0%' });

  const token = localStorage.getItem('zorbit_token') || '';

  const fetchTables = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/rate-tables`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      const list = Array.isArray(data) ? data : data.rateTables || data.data || [];
      setTables(list);
    } catch (e) {
      console.error('Failed to fetch rate tables', e);
    }
    setLoading(false);
  };

  const fetchTable = async (hashId: string) => {
    try {
      const res = await fetch(`${API_BASE}/rate-tables/${hashId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setSelected(data);
    } catch (e) {
      console.error('Failed to fetch rate table', e);
    }
  };

  const doLookup = async () => {
    if (!selected) return;
    try {
      const res = await fetch(`${API_BASE}/lookup`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rateTableHashId: selected.hashId,
          age: parseInt(lookupForm.age),
          gender: lookupForm.gender,
          network: lookupForm.network,
          copay: lookupForm.copay,
        }),
      });
      setLookupResult(await res.json());
    } catch (e) {
      console.error('Lookup failed', e);
    }
  };

  useEffect(() => { fetchTables(); }, []);

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-3">
            <Calculator className="text-primary-600" size={28} />
            Rate Tables
          </h1>
          <p className="text-gray-500 mt-1">Premium rate tables for insurance products</p>
        </div>
        <button onClick={fetchTables} className="btn-secondary flex items-center gap-2">
          <RefreshCw size={16} /> Refresh
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400">Loading rate tables...</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Rate Tables List */}
          <div className="lg:col-span-1 space-y-3">
            <h2 className="font-semibold text-lg mb-3">Available Tables ({tables.length})</h2>
            {tables.map((t: any) => (
              <div
                key={t.hashId || t._id}
                onClick={() => fetchTable(t.hashId || t._id)}
                className={`p-4 rounded-xl border cursor-pointer transition-all hover:shadow-md ${
                  selected?.hashId === t.hashId
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-primary-300'
                }`}
              >
                <div className="font-semibold">{t.insurerName}</div>
                <div className="text-sm text-gray-500">{t.productName} — {t.variant || 'Default'}</div>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700">{t.status}</span>
                  <span className="text-xs text-gray-400">{t.currency}</span>
                  <span className="text-xs text-gray-400">{t.hashId}</span>
                </div>
              </div>
            ))}
            {tables.length === 0 && (
              <div className="text-center py-8 text-gray-400">No rate tables found. Import one to get started.</div>
            )}
          </div>

          {/* Rate Table Detail + Lookup */}
          <div className="lg:col-span-2">
            {selected ? (
              <div className="space-y-6">
                {/* Header */}
                <div className="p-5 rounded-xl border border-gray-200 dark:border-gray-700">
                  <h2 className="text-xl font-bold">{selected.insurerName} — {selected.productName}</h2>
                  <p className="text-gray-500">{selected.variant} | {selected.region} | {selected.currency}</p>
                  <div className="flex gap-4 mt-3 text-sm">
                    <span>Rates: <strong>{selected.rates?.length || 0}</strong></span>
                    <span>Age Bands: <strong>{selected.parameters?.ageBands?.length || 0}</strong></span>
                    <span>Networks: <strong>{selected.parameters?.networks?.length || 0}</strong></span>
                    <span>Status: <strong className="text-green-600">{selected.status}</strong></span>
                  </div>
                </div>

                {/* Premium Lookup */}
                <div className="p-5 rounded-xl border border-primary-200 bg-primary-50/50 dark:bg-primary-900/10 dark:border-primary-800">
                  <h3 className="font-semibold mb-3">Premium Calculator</h3>
                  <div className="grid grid-cols-4 gap-3">
                    <div>
                      <label className="text-xs text-gray-500 block mb-1">Age</label>
                      <input type="number" value={lookupForm.age} onChange={e => setLookupForm({...lookupForm, age: e.target.value})}
                        className="input-field w-full" />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 block mb-1">Gender</label>
                      <select value={lookupForm.gender} onChange={e => setLookupForm({...lookupForm, gender: e.target.value})}
                        className="input-field w-full">
                        <option>Male</option>
                        <option>Female</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 block mb-1">Network</label>
                      <select value={lookupForm.network} onChange={e => setLookupForm({...lookupForm, network: e.target.value})}
                        className="input-field w-full">
                        {(selected.parameters?.networks || []).map((n: string) => (
                          <option key={n}>{n}</option>
                        ))}
                        {(selected.parameters?.plans || []).map((p: string) => (
                          <option key={p}>{p}</option>
                        ))}
                      </select>
                    </div>
                    <div className="flex items-end">
                      <button onClick={doLookup} className="btn-primary w-full">Calculate</button>
                    </div>
                  </div>
                  {lookupResult && (
                    <div className="mt-4 p-3 bg-white dark:bg-gray-800 rounded-lg">
                      <div className="text-sm text-gray-500">Age Band: {lookupResult.ageBand}</div>
                      <div className="text-2xl font-bold text-primary-600 mt-1">
                        {selected.currency} {lookupResult.netRate?.toLocaleString(undefined, {minimumFractionDigits: 2})}
                      </div>
                      <div className="text-xs text-gray-400 mt-1">Annual premium per person</div>
                    </div>
                  )}
                </div>

                {/* Rate Grid */}
                <div className="p-5 rounded-xl border border-gray-200 dark:border-gray-700">
                  <h3 className="font-semibold mb-3">Rate Grid ({selected.rates?.length || 0} entries)</h3>
                  <div className="overflow-x-auto max-h-96">
                    <table className="w-full text-sm">
                      <thead className="sticky top-0 bg-gray-50 dark:bg-gray-800">
                        <tr>
                          <th className="text-left p-2">Age Band</th>
                          <th className="text-left p-2">Gender</th>
                          <th className="text-left p-2">{selected.parameters?.networks?.length ? 'Network' : 'Plan'}</th>
                          <th className="text-left p-2">Copay</th>
                          <th className="text-right p-2">Net Rate ({selected.currency})</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(selected.rates || []).slice(0, 100).map((r: any, i: number) => (
                          <tr key={i} className="border-t border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                            <td className="p-2 font-mono text-xs">{r.ageBand}</td>
                            <td className="p-2">{r.gender}</td>
                            <td className="p-2">{r.network || r.plan || '-'}</td>
                            <td className="p-2">{r.copay}</td>
                            <td className="p-2 text-right font-mono">{r.netRate?.toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {(selected.rates?.length || 0) > 100 && (
                      <div className="text-center py-2 text-gray-400 text-sm">Showing first 100 of {selected.rates.length} entries</div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-64 text-gray-400">
                Select a rate table to view details and calculate premiums
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default RateTablesPage;
