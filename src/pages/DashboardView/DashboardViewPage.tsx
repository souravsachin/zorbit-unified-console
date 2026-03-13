import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Pencil } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../components/shared/Toast';
import { dashboardService, Widget } from '../../services/dashboard';
import WidgetCard from '../../components/widgets/WidgetCard';
import QuickActions from '../../components/QuickActions/QuickActions';

/** Number of CSS Grid columns */
const GRID_COLS = 12;

const DashboardViewPage: React.FC = () => {
  const { orgId } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [widgets, setWidgets] = useState<Widget[]>([]);
  const [loading, setLoading] = useState(true);
  const intervalsRef = useRef<Map<string, ReturnType<typeof setInterval>>>(new Map());

  const fetchWidgets = useCallback(async () => {
    try {
      const res = await dashboardService.getViewWidgets(orgId);
      setWidgets(Array.isArray(res.data) ? res.data : []);
    } catch {
      toast('Failed to load dashboard widgets', 'error');
    } finally {
      setLoading(false);
    }
  }, [orgId, toast]);

  useEffect(() => {
    fetchWidgets();
  }, [fetchWidgets]);

  // Set up per-widget auto-refresh intervals
  useEffect(() => {
    const map = intervalsRef.current;
    // Clear old intervals
    map.forEach((id) => clearInterval(id));
    map.clear();

    widgets.forEach((w) => {
      const interval = w.config?.refreshInterval as number | undefined;
      if (interval && interval > 0) {
        const id = setInterval(() => {
          // Re-fetch all widgets (individual metric fetch would require metric_query execution)
          fetchWidgets();
        }, interval * 1000);
        map.set(w.id, id);
      }
    });

    return () => {
      map.forEach((id) => clearInterval(id));
      map.clear();
    };
  }, [widgets, fetchWidgets]);

  // Compute grid row count from widget positions
  const maxRow = widgets.reduce(
    (max, w) => Math.max(max, w.positionY + w.positionH),
    0,
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Dashboard</h1>
        </div>
        {/* Skeleton grid */}
        <div className="grid grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="card h-40 animate-pulse">
              <div className="h-8 bg-gray-100 dark:bg-gray-700 rounded-t-xl" />
              <div className="p-4 space-y-3">
                <div className="h-6 bg-gray-200 dark:bg-gray-600 rounded w-1/2 mx-auto" />
                <div className="h-4 bg-gray-100 dark:bg-gray-700 rounded w-1/3 mx-auto" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (widgets.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <button onClick={() => navigate('/dashboard-designer')} className="btn-primary flex items-center space-x-2">
            <Pencil size={18} />
            <span>Design Dashboard</span>
          </button>
        </div>
        <QuickActions />
        <div className="card p-12 text-center">
          <p className="text-gray-500 dark:text-gray-400">
            No dashboard widgets configured. Contact your admin.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <button onClick={() => navigate('/dashboard-designer')} className="btn-primary flex items-center space-x-2">
          <Pencil size={18} />
          <span>Design Dashboard</span>
        </button>
      </div>

      <QuickActions />

      <div
        className="grid gap-4"
        style={{
          gridTemplateColumns: `repeat(${GRID_COLS}, 1fr)`,
          gridTemplateRows: `repeat(${maxRow}, 80px)`,
        }}
      >
        {widgets.map((w) => (
          <div
            key={w.id}
            style={{
              gridColumn: `${w.positionX + 1} / span ${w.positionW}`,
              gridRow: `${w.positionY + 1} / span ${w.positionH}`,
            }}
          >
            <WidgetCard widget={w} />
          </div>
        ))}
      </div>
    </div>
  );
};

export default DashboardViewPage;
