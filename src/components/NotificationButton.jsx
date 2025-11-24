import React from "react";
import { Bell, X } from "lucide-react";

export default function NotificationButton({ userEmail }) {
  const [open, setOpen] = React.useState(false);
  const [notifications, setNotifications] = React.useState([]);
  const [unreadCount, setUnreadCount] = React.useState(0);

  // TODO: Load notifications from API
  React.useEffect(() => {
    if (open && userEmail) {
      // Placeholder for loading notifications
      // const loadNotifications = async () => {
      //   const r = await fetch(getApiUrl(`/api/notifications?email=${encodeURIComponent(userEmail)}`));
      //   const j = await r.json();
      //   if (j?.ok) setNotifications(j.data || []);
      // };
      // loadNotifications();
    }
  }, [open, userEmail]);

  React.useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  if (!userEmail) return null;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="relative px-3 py-2 rounded-lg text-sm font-medium border border-gray-700 hover:bg-gray-800 transition"
        title="Notifications"
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setOpen(false)}></div>

          <div className="relative w-full max-w-md mx-4 bg-gray-900 border border-gray-700 rounded-xl shadow-2xl overflow-hidden flex flex-col" style={{ height: 'auto', maxHeight: '80vh', transform: 'translateY(45%)' }}>
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-800 flex-shrink-0">
              <h3 className="text-lg font-semibold text-white">Notifications</h3>
              <button
                onClick={() => setOpen(false)}
                className="text-gray-400 hover:text-white transition"
              >
                <X size={18} />
              </button>
            </div>

            {/* Notifications List */}
            <div className="p-4 space-y-3 overflow-y-auto flex-1">
              {notifications.length === 0 ? (
                <div className="text-center py-8 text-gray-400 text-sm">
                  No notifications yet
                </div>
              ) : (
                notifications.map((notification, index) => (
                  <div key={index} className="bg-gray-800 border border-gray-700 rounded-lg p-3">
                    <div className="text-white text-sm">{notification.message || "Notification"}</div>
                    {notification.timestamp && (
                      <div className="text-xs text-gray-500 mt-1">
                        {new Date(notification.timestamp).toLocaleString()}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

