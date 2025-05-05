import { useNotifications } from "@/context/NotificationContext";

export function BellIcon() {
  const { notifications, markRead } = useNotifications();
  const unread = notifications.filter((n: any) => !n.read).length;

  return (
    <div className="relative">
      <i className="icon-bell" />
      {unread > 0 && (
        <span className="absolute top-0 right-0 bg-red-500 rounded-full px-1 text-xs">
          {unread}
        </span>
      )}
    </div>
  );
}
