import React from "react";
import { Bell } from "lucide-react";
import { useTheme } from "../contexts/ThemeContext.jsx";

export default function NotificationButton({ userEmail }) {
  const { isLight } = useTheme();
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
        className={`relative px-3 py-2 rounded-md border text-sm flex items-center justify-center transition ${
          isLight 
            ? 'border-gray-300 bg-white hover:bg-gray-50' 
            : 'border-white/10 bg-white/5 hover:bg-white/10'
        }`}
        title="Notifications"
        aria-label="Notifications"
      >
        <Bell className={`w-5 h-5 ${isLight ? 'text-black' : 'text-white'}`} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-semibold animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          <div 
            className="fixed inset-0 z-[100] bg-transparent" 
            onClick={() => setOpen(false)}
          />
          <div 
            className={`absolute right-0 top-full mt-2 w-80 rounded-md backdrop-blur-sm shadow-xl z-[101] border-2 ${
              isLight 
                ? 'bg-white border-gray-300' 
                : 'bg-gray-900 border-gray-700'
            }`}
            style={{
              animation: 'dropdownFadeIn 0.2s ease-out forwards',
              transformOrigin: 'top right'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div 
              className={`flex items-center justify-between p-3 border-b flex-shrink-0 ${isLight ? 'border-gray-200' : 'border-white/10'}`}
              style={{
                animation: 'menuItemSlideIn 0.2s ease-out 0s forwards'
              }}
            >
              <h3 className={`text-sm font-semibold ${isLight ? 'text-black' : 'text-white'}`}>Notifications</h3>
              {unreadCount > 0 && (
                <span className={`text-xs ${isLight ? 'text-gray-600' : 'text-gray-400'}`}>{unreadCount} unread</span>
              )}
            </div>

            {/* Notifications List */}
            <div className="max-h-96 overflow-y-auto">
              {notifications.length === 0 ? (
                <div 
                  className={`text-center py-8 text-sm ${isLight ? 'text-gray-600' : 'text-gray-400'}`}
                  style={{
                    animation: 'menuItemSlideIn 0.2s ease-out 0.05s forwards'
                  }}
                >
                  No notifications yet
                </div>
              ) : (
                <div className="p-2">
                  {notifications.map((notification, index) => (
                    <div 
                      key={index} 
                      className={`p-3 rounded-md transition cursor-pointer border-b last:border-b-0 ${
                        isLight 
                          ? 'hover:bg-gray-50 border-gray-200' 
                          : 'hover:bg-white/5 border-white/5'
                      }`}
                      style={{
                        animation: `menuItemSlideIn 0.2s ease-out ${0.1 + (index * 0.05)}s forwards`
                      }}
                    >
                      <div className={`text-sm ${isLight ? 'text-black' : 'text-white'}`}>{notification.message || "Notification"}</div>
                      {notification.timestamp && (
                        <div className={`text-xs mt-1 ${isLight ? 'text-gray-600' : 'text-gray-500'}`}>
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
    </div>
  );
}

