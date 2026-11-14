import { Bell, Check, CheckCheck, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { deleteNotification, markNotificationRead } from '../services/finditApi';
import { UserNotification } from '../types/findit';

interface NotificationsPageProps {
  notifications: UserNotification[];
  loading: boolean;
}

export function NotificationsPage({ notifications, loading }: NotificationsPageProps) {
  const unread = notifications.filter((n) => !n.read);

  const handleMarkAllRead = async () => {
    await Promise.all(unread.map((n) => markNotificationRead(n.notificationId)));
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-bold text-slate-900">Notifications</h2>
          <p className="mt-1 text-sm text-slate-600">
            Real-time alerts for Smart Matches, claim verifications, and completed returns.
          </p>
        </div>

        {unread.length > 0 && (
          <button
            type="button"
            onClick={handleMarkAllRead}
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-800 hover:bg-slate-50"
          >
            <CheckCheck className="h-3.5 w-3.5 text-sky-600" />
            <span>Mark All Read ({unread.length})</span>
          </button>
        )}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-20 animate-pulse rounded-xl bg-white border border-slate-200" />
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <Bell className="mx-auto h-10 w-10 text-slate-300" />
          <h3 className="font-display mt-3 text-lg font-bold text-slate-900">
            No notifications yet
          </h3>
          <p className="mt-1 text-sm text-slate-500">
            Smart Matching and claim updates appear here automatically.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white divide-y divide-slate-100">
          {notifications.map((n) => {
            const targetLink =
              n.type === 'match' || n.type === 'return'
                ? `/items/${n.relatedId}`
                : n.type === 'claim'
                ? '/my-claims'
                : '/dashboard';
            return (
              <div
                key={n.notificationId}
                className={`flex flex-wrap items-start justify-between gap-4 p-4 transition ${
                  n.read ? 'bg-white' : 'bg-sky-50/50'
                }`}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 text-xs">
                    <span className="font-semibold uppercase tracking-wider text-sky-700">
                      {n.type}
                    </span>
                    {!n.read && (
                      <span className="font-semibold text-teal-700">· Unread</span>
                    )}
                  </div>
                  <Link
                    to={targetLink}
                    onClick={() => !n.read && void markNotificationRead(n.notificationId)}
                    className="font-display mt-1 block text-sm font-bold text-slate-900 hover:text-sky-700"
                  >
                    {n.title}
                  </Link>
                  <p className="mt-0.5 text-xs text-slate-600">{n.message}</p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {!n.read && (
                    <button
                      type="button"
                      onClick={() => void markNotificationRead(n.notificationId)}
                      title="Mark as read"
                      className="cursor-pointer rounded-lg border border-slate-200 bg-white p-1.5 text-slate-600 hover:text-sky-700"
                    >
                      <Check className="h-3.5 w-3.5" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => void deleteNotification(n.notificationId)}
                    title="Delete notification"
                    className="cursor-pointer rounded-lg border border-slate-200 bg-white p-1.5 text-slate-500 hover:text-red-600"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
