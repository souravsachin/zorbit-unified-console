import React, { useEffect, useState } from 'react';
import { Car, FileText, Shield, MapPin, Plus, ExternalLink, Loader2, CheckCircle2, XCircle, RefreshCw } from 'lucide-react';
import api from '../../services/api';
import { API_CONFIG } from '../../config';
import { useAuth } from '../../hooks/useAuth';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface Quotation {
  hashId: string;
  quotationNumber?: string;
  status?: string;
  vehicleMake?: string;
  vehicleModel?: string;
  coverageType?: string;
  sumInsured?: number;
  createdAt: string;
}

interface CoverageType {
  code: string;
  label: string;
  description: string;
}

interface Addon {
  code: string;
  label: string;
  description: string;
  defaultSelected: boolean;
}

interface HealthStatus {
  status: string;
  service: string;
  mongodb?: { connected: boolean; readyState: number };
  timestamp: string;
}

/* ------------------------------------------------------------------ */
/*  API Endpoints Reference                                            */
/* ------------------------------------------------------------------ */

const API_ENDPOINTS = [
  { method: 'GET', path: '/api/v1/G/mi-quotation/health', description: 'Service health check' },
  { method: 'POST', path: '/api/v1/O/:orgId/mi-quotation/quotations', description: 'Create motor quotation' },
  { method: 'GET', path: '/api/v1/O/:orgId/mi-quotation/quotations', description: 'List motor quotations' },
  { method: 'GET', path: '/api/v1/O/:orgId/mi-quotation/quotations/:hashId', description: 'Get quotation details' },
  { method: 'POST', path: '/api/v1/O/:orgId/mi-quotation/quotations/:hashId/drivers', description: 'Add driver to quotation' },
  { method: 'GET', path: '/api/v1/O/:orgId/mi-quotation/vehicles/makes', description: 'Vehicle makes (20 seeded)' },
  { method: 'GET', path: '/api/v1/O/:orgId/mi-quotation/vehicles/makes/:make/models', description: 'Vehicle models for make' },
  { method: 'GET', path: '/api/v1/O/:orgId/mi-quotation/vehicles/body-types', description: 'Vehicle body types' },
  { method: 'GET', path: '/api/v1/O/:orgId/mi-quotation/vehicles/fuel-types', description: 'Fuel types' },
  { method: 'GET', path: '/api/v1/O/:orgId/mi-quotation/vehicles/transmission-types', description: 'Transmission types' },
  { method: 'GET', path: '/api/v1/O/:orgId/mi-quotation/coverage/types', description: 'Coverage types (3)' },
  { method: 'GET', path: '/api/v1/O/:orgId/mi-quotation/coverage/addons', description: 'Available add-ons' },
  { method: 'GET', path: '/api/v1/O/:orgId/mi-quotation/coverage/geo-areas', description: 'Geographic areas' },
];

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

const MIQuotationPage: React.FC = () => {
  const { orgId } = useAuth();
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [quotationsTotal, setQuotationsTotal] = useState(0);
  const [makes, setMakes] = useState<string[]>([]);
  const [coverageTypes, setCoverageTypes] = useState<CoverageType[]>([]);
  const [addons, setAddons] = useState<Addon[]>([]);
  const [geoAreas, setGeoAreas] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const base = API_CONFIG.MI_QUOTATION_URL;
      const [healthRes, quotRes, makesRes, covRes, addonsRes, geoRes] = await Promise.allSettled([
        api.get(`${base}/api/v1/G/mi-quotation/health`),
        api.get(`${base}/api/v1/O/${orgId}/mi-quotation/quotations`),
        api.get(`${base}/api/v1/O/${orgId}/mi-quotation/vehicles/makes`),
        api.get(`${base}/api/v1/O/${orgId}/mi-quotation/coverage/types`),
        api.get(`${base}/api/v1/O/${orgId}/mi-quotation/coverage/addons`),
        api.get(`${base}/api/v1/O/${orgId}/mi-quotation/coverage/geo-areas`),
      ]);

      if (healthRes.status === 'fulfilled') setHealth(healthRes.value.data);
      if (quotRes.status === 'fulfilled') {
        const d = quotRes.value.data;
        const list = d?.data || d?.items || (Array.isArray(d) ? d : []);
        setQuotations(list);
        setQuotationsTotal(d?.total ?? list.length);
      }
      if (makesRes.status === 'fulfilled') {
        const d = makesRes.value.data;
        setMakes(Array.isArray(d) ? d : d?.data || []);
      }
      if (covRes.status === 'fulfilled') {
        const d = covRes.value.data;
        setCoverageTypes(Array.isArray(d) ? d : d?.data || []);
      }
      if (addonsRes.status === 'fulfilled') {
        const d = addonsRes.value.data;
        setAddons(Array.isArray(d) ? d : d?.data || []);
      }
      if (geoRes.status === 'fulfilled') {
        const d = geoRes.value.data;
        setGeoAreas(Array.isArray(d) ? d : d?.data || []);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [orgId]);

  const isHealthy = health?.status === 'healthy' || health?.status === 'ok';

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-lime-100 dark:bg-lime-900/40">
            <Car className="w-7 h-7 text-lime-600 dark:text-lime-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">MI Quotation System</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Motor insurance quotation — vehicle makes, coverage types, add-ons, geographic areas
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchData}
            className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors"
          >
            <RefreshCw className={`h-4 w-4 text-gray-500 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <a
            href="https://zorbit.scalatics.com/api/mi-quotation/api-docs"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg border border-indigo-200 dark:border-indigo-700 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors"
          >
            <ExternalLink className="h-4 w-4" />
            Swagger Docs
          </a>
        </div>
      </div>

      {/* Health Status */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 px-4 py-3">
        <div className="flex items-center gap-3">
          {loading ? (
            <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
          ) : isHealthy ? (
            <CheckCircle2 className="h-5 w-5 text-green-500" />
          ) : (
            <XCircle className="h-5 w-5 text-red-500" />
          )}
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Service: <span className="font-mono">{health?.service || 'zorbit-app-mi_quotation'}</span>
          </span>
          <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${isHealthy ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
            {health?.status || 'checking...'}
          </span>
          {health?.mongodb && (
            <span className={`text-xs px-2 py-0.5 rounded-full ${health.mongodb.connected ? 'bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400' : 'bg-red-50 text-red-600'}`}>
              MongoDB: {health.mongodb.connected ? 'connected' : 'disconnected'}
            </span>
          )}
          <span className="text-xs text-gray-400 ml-auto font-mono">Port 3123</span>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl px-4 py-3 text-sm">
          {error}
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 px-4 py-3">
          <p className="text-xs text-gray-500 dark:text-gray-400">Quotations</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{quotationsTotal}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 px-4 py-3">
          <p className="text-xs text-gray-500 dark:text-gray-400">Vehicle Makes</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{makes.length}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 px-4 py-3">
          <p className="text-xs text-gray-500 dark:text-gray-400">Coverage Types</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{coverageTypes.length}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 px-4 py-3">
          <p className="text-xs text-gray-500 dark:text-gray-400">Add-ons</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{addons.length}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 px-4 py-3">
          <p className="text-xs text-gray-500 dark:text-gray-400">Geo Areas</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{geoAreas.length}</p>
        </div>
      </div>

      {/* Vehicle Makes */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 px-4 py-3">
        <div className="flex items-center gap-2 mb-3">
          <Car className="h-4 w-4 text-lime-500" />
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Vehicle Makes</h2>
          <span className="text-xs text-gray-400">({makes.length})</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {makes.map((make) => (
            <span key={make} className="text-xs font-medium px-2.5 py-1 rounded-lg bg-lime-50 dark:bg-lime-900/20 text-lime-700 dark:text-lime-400 border border-lime-200 dark:border-lime-800">
              {make}
            </span>
          ))}
          {makes.length === 0 && !loading && (
            <span className="text-xs text-gray-400">No vehicle makes data</span>
          )}
        </div>
      </div>

      {/* Coverage Types */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700 flex items-center gap-2">
          <Shield className="h-4 w-4 text-blue-500" />
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Coverage Types</h2>
          <span className="text-xs text-gray-400">({coverageTypes.length})</span>
        </div>
        {coverageTypes.length > 0 ? (
          <div className="divide-y divide-gray-50 dark:divide-gray-700/50">
            {coverageTypes.map((cov) => (
              <div key={cov.code} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/20 transition-colors">
                <span className="text-xs font-mono text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-2 py-0.5 rounded w-40 text-center">
                  {cov.code}
                </span>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{cov.label}</p>
                  <p className="text-xs text-gray-400">{cov.description}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="px-4 py-6 text-center text-sm text-gray-400">No coverage types data</div>
        )}
      </div>

      {/* Add-ons */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700 flex items-center gap-2">
          <Plus className="h-4 w-4 text-green-500" />
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Available Add-ons</h2>
          <span className="text-xs text-gray-400">({addons.length})</span>
        </div>
        {addons.length > 0 ? (
          <div className="divide-y divide-gray-50 dark:divide-gray-700/50">
            {addons.map((addon) => (
              <div key={addon.code} className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-700/20 transition-colors">
                <span className="text-xs font-mono text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-2 py-0.5 rounded w-44 text-center truncate">
                  {addon.code}
                </span>
                <div className="flex-1">
                  <p className="text-sm text-gray-800 dark:text-gray-200">{addon.label}</p>
                  <p className="text-xs text-gray-400">{addon.description}</p>
                </div>
                {addon.defaultSelected && (
                  <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
                    default
                  </span>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="px-4 py-6 text-center text-sm text-gray-400">No add-ons data</div>
        )}
      </div>

      {/* Geographic Areas */}
      {geoAreas.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 px-4 py-3">
          <div className="flex items-center gap-2 mb-2">
            <MapPin className="h-4 w-4 text-orange-500" />
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Geographic Areas</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {geoAreas.map((area) => (
              <span key={area} className="text-xs font-medium px-2.5 py-1 rounded-lg bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400 border border-orange-200 dark:border-orange-800">
                {area}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Quotations List */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700 flex items-center gap-2">
          <FileText className="h-4 w-4 text-lime-500" />
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Motor Quotations</h2>
          <span className="text-xs text-gray-400">({quotationsTotal})</span>
        </div>
        {quotations.length > 0 ? (
          <div className="divide-y divide-gray-50 dark:divide-gray-700/50">
            {quotations.slice(0, 20).map((q) => (
              <div key={q.hashId} className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-700/20 transition-colors">
                <span className="text-xs font-mono text-gray-500 w-24 truncate">{q.hashId}</span>
                <span className="text-sm text-gray-800 dark:text-gray-200 flex-1">
                  {q.vehicleMake ? `${q.vehicleMake} ${q.vehicleModel || ''}` : q.quotationNumber || 'Quotation'}
                </span>
                {q.coverageType && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400">
                    {q.coverageType}
                  </span>
                )}
                {q.status && (
                  <span className="text-xs text-gray-400">{q.status}</span>
                )}
                <span className="text-xs text-gray-400">{new Date(q.createdAt).toLocaleDateString()}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="px-4 py-6 text-center text-sm text-gray-400">
            No motor quotations yet. Create a quotation via the API to see data here.
          </div>
        )}
      </div>

      {/* API Endpoints */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700 flex items-center gap-2">
          <ExternalLink className="h-4 w-4 text-gray-500" />
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white">API Endpoints</h2>
          <span className="text-xs text-gray-400">({API_ENDPOINTS.length})</span>
        </div>
        <div className="divide-y divide-gray-50 dark:divide-gray-700/50">
          {API_ENDPOINTS.map((ep, idx) => (
            <div key={idx} className="flex items-center gap-3 px-4 py-2 text-xs">
              <span className={`font-mono font-bold w-12 ${ep.method === 'GET' ? 'text-green-600' : 'text-blue-600'}`}>
                {ep.method}
              </span>
              <span className="font-mono text-gray-600 dark:text-gray-400 flex-1">{ep.path}</span>
              <span className="text-gray-400">{ep.description}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MIQuotationPage;
