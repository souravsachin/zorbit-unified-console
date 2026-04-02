import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  FileText,
  Shield,
  CreditCard,
  FileCheck,
  Settings,
  CheckCheck,
  X,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import {
  getUnreadCount,
  getNotifications,
  markAsRead,
  markAllAsRead,
  NotificationItem,
} from '../../services/notifications';
import { useRealtime } from '../../hooks/useRealtime';

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  quotation: <FileText size={16} className="text-blue-500" />,
  underwriting: <Shield size={16} className="text-orange-500" />,
  payment: <CreditCard size={16} className="text-green-500" />,
  policy: <FileCheck size={16} className="text-purple-500" />,
  system: <Settings size={16} className="text-gray-500" />,
};

const PRIORITY_COLORS: Record<string, string> = {
  urgent: 'border-l-red-500',
  high: 'border-l-orange-400',
  normal: 'border-l-transparent',
  low: 'border-l-transparent',
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

const NotificationBell: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const userId = user?.id || 'U-DEMO';
  const { connected: wsConnected, subscribe, emit } = useRealtime();

  const fetchUnreadCount = useCallback(async () => {
    try {
      const count = await getUnreadCount(userId);
      setUnreadCount(count);
    } catch {
      // silent — notification service may not be running
    }
  }, [userId]);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getNotifications(userId, { limit: 15 });
      setNotifications(result.data);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // WebSocket: listen for real-time notification pushes.
  // Falls back to HTTP polling every 60s if WebSocket is not connected.
  useEffect(() => {
    fetchUnreadCount();

    // If WebSocket connected, listen for live pushes
    if (wsConnected) {
      const unsubNew = subscribe('notification:new', (data: unknown) => {
        const payload = data as { data: NotificationItem };
        if (payload?.data) {
          setNotifications((prev) => [payload.data, ...prev].slice(0, 15));
          setUnreadCount((c) => c + 1);
        }
      });
      const unsubRead = subscribe('notification:read', (data: unknown) => {
        const payload = data as { notificationId: string };
        if (payload?.notificationId) {
          setNotifications((prev) =>
            prev.map((n) =>
              n.hashId === payload.notificationId ? { ...n, read: true } : n,
            ),
          );
          setUnreadCount((c) => Math.max(0, c - 1));
        }
      });

      // Slower fallback poll when WS is active (every 5 min as safety net)
      intervalRef.current = setInterval(fetchUnreadCount, 300000);

      return () => {
        unsubNew();
        unsubRead();
        if (intervalRef.current) clearInterval(intervalRef.current);
      };
    }

    // No WebSocket — poll every 60s (original behavior)
    intervalRef.current = setInterval(fetchUnreadCount, 60000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [fetchUnreadCount, wsConnected, subscribe]);

  // Fetch notifications when dropdown opens
  useEffect(() => {
    if (open) fetchNotifications();
  }, [open, fetchNotifications]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const handleNotificationClick = async (notif: NotificationItem) => {
    if (!notif.read) {
      try {
        await markAsRead(userId, notif.hashId);
        setNotifications((prev) =>
          prev.map((n) => (n.hashId === notif.hashId ? { ...n, read: true } : n)),
        );
        setUnreadCount((c) => Math.max(0, c - 1));
        // Notify other tabs/sessions via WebSocket
        if (wsConnected) {
          emit('notification:mark_read', { notificationId: notif.hashId });
        }
      } catch {
        // silent
      }
    }
    if (notif.actionUrl) {
      setOpen(false);
      navigate(notif.actionUrl);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead(userId);
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch {
      // silent
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setOpen(!open)}
        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors relative"
        title="Notifications"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-96 max-h-[480px] bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl z-50 flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-sm font-semibold">Notifications</h3>
            <div className="flex items-center space-x-2">
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center space-x-1"
                >
                  <CheckCheck size={14} />
                  <span>Mark all read</span>
                </button>
              )}
              <button
                onClick={() => setOpen(false)}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
              >
                <X size={14} />
              </button>
            </div>
          </div>

          {/* Notification list */}
          <div className="overflow-y-auto flex-1">
            {loading && notifications.length === 0 ? (
              <div className="p-4 text-center text-sm text-gray-500">Loading...</div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center text-sm text-gray-500">
                <Bell size={32} className="mx-auto mb-2 opacity-30" />
                No notifications yet
              </div>
            ) : (
              notifications.map((notif) => (
                <button
                  key={notif.hashId}
                  onClick={() => handleNotificationClick(notif)}
                  className={`w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-750 dark:hover:bg-opacity-50 border-b border-gray-100 dark:border-gray-700 last:border-b-0 border-l-4 ${PRIORITY_COLORS[notif.priority] || ''} ${
                    !notif.read ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''
                  } transition-colors`}
                >
                  <div className="flex items-start space-x-3">
                    <div className="mt-0.5 flex-shrink-0">
                      {CATEGORY_ICONS[notif.category] || CATEGORY_ICONS.system}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <p className={`text-sm truncate ${!notif.read ? 'font-semibold' : 'font-normal'}`}>
                          {notif.subject}
                        </p>
                        {!notif.read && (
                          <span className="flex-shrink-0 w-2 h-2 bg-blue-500 rounded-full" />
                        )}
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">
                        {notif.body}
                      </p>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className="text-[10px] text-gray-400">
                          {timeAgo(notif.createdAt)}
                        </span>
                        {notif.sourceModule && (
                          <span className="text-[10px] text-gray-400 bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded">
                            {notif.sourceModule}
                          </span>
                        )}
                        {notif.priority === 'urgent' && (
                          <span className="text-[10px] text-red-600 font-semibold">URGENT</span>
                        )}
                        {notif.priority === 'high' && (
                          <span className="text-[10px] text-orange-500 font-semibold">HIGH</span>
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
