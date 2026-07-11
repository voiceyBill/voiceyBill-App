import React, { createContext, useContext, useRef, useState, useCallback, useEffect, useMemo } from 'react';

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

interface NotificationStateType {
  notifications: Notification[];
  toasts: Toast[];
}

interface NotificationActionsType {
  showNotification: (notification: Omit<Notification, 'id' | 'timestamp'>) => void;
  showToast: (toast: ShowToastInput) => void;
  dismissToast: (id: string) => void;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;
}

type NotificationContextType = NotificationStateType & NotificationActionsType;

// PERF: state and actions live in separate contexts. Most screens only call
// `useToast()` (actions — a stable object), so showing/dismissing a toast no
// longer re-renders every screen in the app; only the components that actually
// read `toasts`/`notifications` (ToastHost, notifications screen) re-render.
const NotificationStateContext = createContext<NotificationStateType | undefined>(undefined);
const NotificationActionsContext = createContext<NotificationActionsType | undefined>(undefined);

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

  const actions = useMemo(
    () => ({
      showNotification,
      showToast,
      dismissToast,
      removeNotification,
      clearNotifications,
    }),
    [showNotification, showToast, dismissToast, removeNotification, clearNotifications],
  );

  const state = useMemo(() => ({ notifications, toasts }), [notifications, toasts]);

  return (
    <NotificationActionsContext.Provider value={actions}>
      <NotificationStateContext.Provider value={state}>
        {children}
      </NotificationStateContext.Provider>
    </NotificationActionsContext.Provider>
  );
};

export const useNotification = (): NotificationContextType => {
  const state = useContext(NotificationStateContext);
  const actions = useContext(NotificationActionsContext);
  if (!state || !actions) {
    throw new Error('useNotification must be used within NotificationProvider');
  }
  return useMemo(() => ({ ...state, ...actions }), [state, actions]);
};

// Actions only — a stable object, so calling components never re-render from
// toast traffic.
export const useToast = () => {
  const actions = useContext(NotificationActionsContext);
  if (!actions) {
    throw new Error('useToast must be used within NotificationProvider');
  }
  return actions;
};
