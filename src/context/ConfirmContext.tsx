import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import ConfirmDialog from '../components/common/ConfirmDialog';

export type ConfirmOptions = {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  destructive?: boolean;
  /**
   * Optional async action run when the user confirms. While it runs, the
   * confirm button shows a spinner and the dialog stays open + locked, so the
   * user sees the work is in progress. The dialog closes when it settles.
   * The action owns its own error handling (e.g. showing a toast).
   */
  onConfirm?: () => Promise<void> | void;
};

type ConfirmContextType = {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
};

const ConfirmContext = createContext<ConfirmContextType | undefined>(undefined);

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [options, setOptions] = useState<ConfirmOptions | null>(null);
  const resolveRef = useRef<((value: boolean) => void) | null>(null);

  const confirm = useCallback((opts: ConfirmOptions) => {
    return new Promise<boolean>((resolve) => {
      resolveRef.current = resolve;
      setOptions(opts);
      setLoading(false);
      setVisible(true);
    });
  }, []);

  const finish = (result: boolean) => {
    setVisible(false);
    setLoading(false);
    setOptions(null);
    resolveRef.current?.(result);
    resolveRef.current = null;
  };

  const handleConfirm = async () => {
    const action = options?.onConfirm;
    if (!action) {
      finish(true);
      return;
    }
    // Run the action inline so the button can show progress and the dialog
    // stays up until it's done.
    setLoading(true);
    try {
      await action();
    } finally {
      finish(true);
    }
  };

  const handleCancel = () => {
    if (loading) return; // can't cancel while the action is running
    finish(false);
  };

  return (
    <ConfirmContext.Provider value={useMemo(() => ({ confirm }), [confirm])}>
      {children}
      {options ? (
        <ConfirmDialog
          visible={visible}
          loading={loading}
          title={options.title}
          message={options.message}
          confirmText={options.confirmText}
          cancelText={options.cancelText}
          destructive={options.destructive}
          onConfirm={handleConfirm}
          onCancel={handleCancel}
        />
      ) : null}
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error('useConfirm must be used within ConfirmProvider');
  return ctx;
}
