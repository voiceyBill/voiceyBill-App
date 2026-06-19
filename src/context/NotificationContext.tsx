import React, { createContext, useContext, useRef, useState, useCallback, useEffect } from 'react';

export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info' | 'budget_alert';
  message: string;
  title?: string;
  duration?: number;
  timestamp: string;
}

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
  title?: string;
  duration?: number;
}

type ShowToastInput = Omit<Toast, 'id'>;

interface NotificationContextType {
  notifications: Notification[];
  toasts: Toast[];
  showNotification: (notification: Omit<Notification, 'id' | 'timestamp'>) => void;
  showToast: (toast: ShowToastInput) => void;
  dismissToast: (id: string) => void;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const shownNotificationKeysRef = useRef(new Set<string>());
  const toastTimersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const dismissToast = useCallback((id: string) => {
    const timer = toastTimersRef.current.get(id);
    if (timer) {
      clearTimeout(timer);
      toastTimersRef.current.delete(id);
    }
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (toast: ShowToastInput) => {
      const id = `toast-${Date.now()}-${Math.random()}`;
      const duration = toast.duration ?? 3500;

      setToasts((prev) => [{ ...toast, id }, ...prev].slice(0, 3));

      const timer = setTimeout(() => dismissToast(id), duration);
      toastTimersRef.current.set(id, timer);
    },
    [dismissToast],
  );

  const showNotification = useCallback(
    (notification: Omit<Notification, 'id' | 'timestamp'>) => {
      const id = `${Date.now()}-${Math.random()}`;
      const notificationKey = [
        notification.type,
        notification.title ?? '',
        notification.message,
      ].join(':');

      setNotifications((prev) => {
        if (shownNotificationKeysRef.current.has(notificationKey)) return prev;

        shownNotificationKeysRef.current.add(notificationKey);

        return [
          {
            ...notification,
            id,
            timestamp: new Date().toISOString(),
          },
          ...prev,
        ];
      });

      showToast({
        type:
          notification.type === 'budget_alert'
            ? 'warning'
            : (notification.type as ToastType),
        title: notification.title,
        message: notification.message,
      });
    },
    [showToast],
  );

  const removeNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  useEffect(() => {
    return () => {
      toastTimersRef.current.forEach((timer) => clearTimeout(timer));
      toastTimersRef.current.clear();
    };
  }, []);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        toasts,
        showNotification,
        showToast,
        dismissToast,
        removeNotification,
        clearNotifications,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within NotificationProvider');
  }
  return context;
};

export const useToast = () => {
  const { showToast, dismissToast } = useNotification();
  return { showToast, dismissToast };
};
