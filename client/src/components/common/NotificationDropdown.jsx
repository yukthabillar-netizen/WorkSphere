import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { notificationService } from '../../services/notificationService';
import { useSocket } from '../../hooks/useSocket';
import { Avatar } from './Avatar';
import { formatRelativeTime } from '../../lib/utils';
import { Bell, CheckCheck, Loader2 } from 'lucide-react';

export const NotificationDropdown = () => {
  const navigate = useNavigate();
  const socket = useSocket();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const dropdownRef = useRef(null);

  const fetchNotifications = async () => {
    try {
      setIsLoading(true);
      const res = await notificationService.getMyNotifications({ limit: 15 });
      setNotifications(res.data.notifications || []);
      setUnreadCount(res.data.unreadCount || 0);
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  // Realtime notification listener
  useEffect(() => {
    if (!socket) return;

    const handleNewNotification = (notification) => {
      setNotifications((prev) => [notification, ...prev]);
      setUnreadCount((count) => count + 1);
    };

    socket.on('notification:new', handleNewNotification);
    return () => {
      socket.off('notification:new', handleNewNotification);
    };
  }, [socket]);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkAllRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error(err);
    }
  };

  const handleNotificationClick = async (notif) => {
    if (!notif.read) {
      try {
        await notificationService.markAsRead(notif._id);
        setNotifications((prev) =>
          prev.map((n) => (n._id === notif._id ? { ...n, read: true } : n))
        );
        setUnreadCount((count) => Math.max(0, count - 1));
      } catch (err) {
        console.error(err);
      }
    }

    setIsOpen(false);
    if (notif.project?._id && notif.task?._id) {
      navigate(`/projects/${notif.project._id}?task=${notif.task._id}`);
    } else if (notif.project?._id) {
      navigate(`/projects/${notif.project._id}`);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) fetchNotifications();
        }}
        className="relative p-2 rounded-lg text-text-muted hover:text-text hover:bg-surface-2 transition-colors cursor-pointer"
        aria-label="Notifications"
        title="Notifications"
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white shadow-xs">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-surface border border-border shadow-xl py-2 z-50 animate-scale-in flex flex-col max-h-[480px]">
          <div className="flex items-center justify-between px-4 py-2 border-b border-border">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-text">Notifications</span>
              {unreadCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-primary-subtle text-primary text-[11px] font-semibold">
                  {unreadCount} new
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-xs text-primary hover:underline flex items-center gap-1 cursor-pointer"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                Mark all read
              </button>
            )}
          </div>

          <div className="overflow-y-auto flex-1 divide-y divide-border/60">
            {isLoading && notifications.length === 0 ? (
              <div className="p-8 flex justify-center text-text-muted">
                <Loader2 className="w-5 h-5 animate-spin" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center text-xs text-text-muted">
                No notifications yet. You're all caught up!
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif._id}
                  onClick={() => handleNotificationClick(notif)}
                  className={`p-3.5 flex items-start gap-3 transition-colors cursor-pointer hover:bg-surface-2 ${
                    !notif.read ? 'bg-primary/5' : ''
                  }`}
                >
                  <Avatar
                    src={notif.actor?.avatarUrl}
                    name={notif.actor?.name || 'WorkSphere'}
                    size="sm"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-text leading-snug">{notif.message}</p>
                    <span className="text-[10px] text-text-muted mt-1 inline-block">
                      {formatRelativeTime(notif.createdAt)}
                    </span>
                  </div>
                  {!notif.read && (
                    <div className="w-2 h-2 rounded-full bg-primary mt-1 shrink-0" />
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
