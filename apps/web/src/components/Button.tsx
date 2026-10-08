import type { ButtonHTMLAttributes } from 'react';
import styles from './Button.module.css';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  readonly variant?: 'default' | 'primary' | 'quiet';
}

export function Button({ variant = 'default', className, type = 'button', ...rest }: ButtonProps) {
  const classes = [styles.button, variant !== 'default' && styles[variant], className];
  return <button type={type} className={classes.filter(Boolean).join(' ')} {...rest} />;
}
