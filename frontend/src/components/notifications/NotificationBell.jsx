import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiBell,
  FiCheckCircle,
  FiPackage,
  FiAlertCircle,
  FiClock,
  FiInfo,
  FiCheck,
  FiArrowRight,
} from 'react-icons/fi';
import { toast } from 'react-toastify';
import notificationService from '../../services/notificationService';
import useAuth from '../../hooks/useAuth';

export default function NotificationBell({ className = '' }) {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const dropdownRef = useRef(null);

  const fetchUnreadCount = async () => {
    if (!isAuthenticated) return;
    try {
      const count = await notificationService.getUnreadCount();
      setUnreadCount(count);
    } catch {
      // silent background failure
    }
  };

  const fetchNotifications = async () => {
    if (!isAuthenticated) return;
    try {
      setLoading(true);
      const data = await notificationService.getRecentNotifications(10);
      setNotifications(Array.isArray(data) ? data : []);
    } catch (err) {
      console.warn('Failed to fetch recent notifications', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchUnreadCount();
      const interval = setInterval(fetchUnreadCount, 30000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated]);

  const handleToggle = () => {
    if (!open) {
      fetchNotifications();
    }
    setOpen(!open);
  };

  const handleMarkAsRead = async (n, e) => {
    if (e) e.stopPropagation();
    try {
      await notificationService.markAsRead(n.id);
      setNotifications((prev) =>
        prev.map((item) => (item.id === n.id ? { ...item, read: true } : item))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.warn('Failed to mark notification read', err);
    }

    if (n.actionUrl) {
      setOpen(false);
      navigate(n.actionUrl);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications((prev) => prev.map((item) => ({ ...item, read: true })));
      setUnreadCount(0);
      toast.success('All notifications marked as read.');
    } catch (err) {
      toast.error('Failed to mark all notifications as read.');
    }
  };

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!isAuthenticated) return null;

  const getTypeIcon = (type) => {
    switch (type) {
      case 'RESERVATION':
        return <FiClock className="text-cyan-400" size={16} />;
      case 'STOCK_ALERT':
        return <FiAlertCircle className="text-amber-400" size={16} />;
      case 'PICKUP_REMINDER':
        return <FiPackage className="text-emerald-400" size={16} />;
      default:
        return <FiInfo className="text-primary-300" size={16} />;
    }
  };

  const formatTime = (isoString) => {
    if (!isoString) return '';
    try {
      const date = new Date(isoString);
      const now = new Date();
      const diffMs = now - date;
      const diffMins = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays < 7) return `${diffDays}d ago`;
      return date.toLocaleDateString();
    } catch {
      return '';
    }
  };

  return (
    <div ref={dropdownRef} className={`relative inline-block text-left ${className}`}>
      <button
        type="button"
        onClick={handleToggle}
        className="relative inline-flex items-center justify-center rounded-xl border border-white/20 bg-white/10 p-2 text-white backdrop-blur-md transition-all hover:bg-white/20 hover:border-cyan-400/40 focus:outline-none"
        aria-label="Notifications"
        title="Notifications"
      >
        <FiBell size={17} />
        {unreadCount > 0 && (
          <span className="absolute -top-1.5 -right-1.5 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-gradient-to-r from-rose-500 to-pink-600 px-1 text-[10px] font-black text-white shadow-lg shadow-rose-500/40 animate-pulse">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          className="absolute right-0 mt-2 w-80 sm:w-96 origin-top-right rounded-3xl border border-white/20 bg-slate-950/95 p-4 shadow-2xl backdrop-blur-2xl animate-fade-in z-50 text-white"
          role="menu"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-white">Notifications</span>
              {unreadCount > 0 && (
                <span className="rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 px-2 py-0.5 text-[10px] font-bold">
                  {unreadCount} new
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                className="text-[11px] font-semibold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 hover:underline"
              >
                <FiCheck size={12} /> Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-80 overflow-y-auto divide-y divide-white/10 my-2">
            {loading ? (
              <div className="py-8 text-center text-xs text-primary-200 animate-pulse">
                Loading notifications...
              </div>
            ) : notifications.length > 0 ? (
              notifications.map((n) => (
                <div
                  key={n.id}
                  onClick={(e) => handleMarkAsRead(n, e)}
                  className={`p-3 rounded-2xl flex items-start gap-3 cursor-pointer transition-colors ${
                    n.read ? 'hover:bg-white/5 opacity-80' : 'bg-cyan-950/40 border border-cyan-500/20 hover:bg-cyan-900/40'
                  }`}
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white/10 mt-0.5">
                    {getTypeIcon(n.type)}
                  </div>

                  <div className="flex-1 min-w-0 space-y-0.5">
                    <div className="flex items-center justify-between gap-1">
                      <p className={`text-xs font-bold truncate ${n.read ? 'text-primary-100' : 'text-white'}`}>
                        {n.title}
                      </p>
                      <span className="text-[10px] text-primary-300/60 shrink-0">
                        {formatTime(n.createdAt)}
                      </span>
                    </div>

                    <p className="text-[11px] text-primary-200/80 line-clamp-2 leading-relaxed">
                      {n.message}
                    </p>

                    {n.actionUrl && (
                      <span className="text-[10px] font-semibold text-cyan-400 flex items-center gap-1 pt-1">
                        View details <FiArrowRight size={10} />
                      </span>
                    )}
                  </div>

                  {!n.read && (
                    <span className="h-2 w-2 rounded-full bg-cyan-400 shrink-0 mt-1.5 shadow-sm shadow-cyan-400" />
                  )}
                </div>
              ))
            ) : (
              <div className="py-8 text-center space-y-1">
                <FiBell size={24} className="mx-auto text-primary-300/40" />
                <p className="text-xs font-semibold text-white">No notifications yet</p>
                <p className="text-[11px] text-primary-200/60">
                  Updates on holds, stocks, and verifications will appear here.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
