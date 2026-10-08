import { type ReactNode, useEffect, useId, useRef } from 'react';
import styles from './Dialog.module.css';

interface DialogProps {
  readonly open: boolean;
  readonly title: string;
  readonly onClose: () => void;
  readonly children: ReactNode;
  /** Buttons shown along the bottom. */
  readonly actions?: ReactNode;
  readonly size?: 'small' | 'large';
}

/** Modal dialog built on the native <dialog> element (focus trapping and Escape are built in). */
export function Dialog({ open, title, onClose, children, actions, size = 'large' }: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      className={[styles.dialog, size === 'small' && styles.small].filter(Boolean).join(' ')}
      aria-labelledby={titleId}
      onClose={onClose}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose(); // backdrop click
      }}
    >
      <div className={styles.content}>
        <header className={styles.header}>
          <h2 id={titleId}>{title}</h2>
          <button type="button" className={styles.close} onClick={onClose} aria-label="Close">
            ×
          </button>
        </header>
        {children}
        {actions && <div className={styles.actions}>{actions}</div>}
      </div>
    </dialog>
  );
}
