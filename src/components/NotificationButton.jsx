import React from "react";
import { Bell } from "lucide-react";

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

  if (!userEmail) return null;

  return (
    <div className="relative">
      <button
        onClick={(e) => {
          e.stopPropagation();
          setOpen(v => !v);
        }}
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
        <>
          <div 
            className="fixed inset-0 z-[100]" 
            onClick={() => setOpen(false)}
          />
          <div 
            className="absolute right-0 top-full mt-2 w-80 rounded-md border border-white/10 bg-gray-900/95 backdrop-blur-sm shadow-xl z-[101] transition-all duration-200 ease-out"
            style={{
              animation: 'dropdownFadeIn 0.2s ease-out',
              transformOrigin: 'top right'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-3 border-b border-white/10 flex-shrink-0">
              <h3 className="text-sm font-semibold text-white">Notifications</h3>
              {unreadCount > 0 && (
                <span className="text-xs text-gray-400">{unreadCount} unread</span>
              )}
            </div>

            {/* Notifications List */}
            <div className="max-h-96 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="text-center py-8 text-gray-400 text-sm">
                  No notifications yet
                </div>
              ) : (
                <div className="p-2">
                  {notifications.map((notification, index) => (
                    <div 
                      key={index} 
                      className="p-3 rounded-md hover:bg-white/5 transition cursor-pointer border-b border-white/5 last:border-b-0"
                      style={{
                        animation: `notificationSlideIn 0.2s ease-out ${index * 0.05}s both`
                      }}
                    >
                      <div className="text-white text-sm">{notification.message || "Notification"}</div>
                      {notification.timestamp && (
                        <div className="text-xs text-gray-500 mt-1">
                          {new Date(notification.timestamp).toLocaleString()}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
      <style>{`
        @keyframes dropdownFadeIn {
          from {
            opacity: 0;
            transform: translateY(-8px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        
        @keyframes notificationSlideIn {
          from {
            opacity: 0;
            transform: translateX(-8px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
      `}</style>
    </div>
  );
}

