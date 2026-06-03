import React, { createContext, useContext, useRef, useState, useCallback } from 'react';

export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info' | 'budget_alert';
  message: string;
  title?: string;
  duration?: number;
  timestamp: string;
}

interface NotificationContextType {
  notifications: Notification[];
  showNotification: (notification: Omit<Notification, 'id' | 'timestamp'>) => void;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const shownNotificationKeysRef = useRef(new Set<string>());

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
    },
    []
  );

  const removeNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        showNotification,
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
