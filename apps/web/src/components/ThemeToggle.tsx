import { useState } from 'react';

type Theme = 'light' | 'dark';

/** Must match the inline script in index.html, which applies the saved theme before first paint. */
const THEME_KEY = 'treasure-chess/theme';

function systemTheme(): Theme {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function currentTheme(): Theme {
  const set = document.documentElement.dataset.theme;
  return set === 'light' || set === 'dark' ? set : systemTheme();
}

/** Switches between light and dark, remembering the choice on this device. */
export function ThemeToggle({ className }: { readonly className?: string | undefined }) {
  const [theme, setTheme] = useState<Theme>(currentTheme);
  const next: Theme = theme === 'dark' ? 'light' : 'dark';

  function toggle() {
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem(THEME_KEY, next);
    } catch {
      // Storage may be unavailable (private mode); the choice then lasts for this visit only.
    }
    setTheme(next);
  }

  return (
    <button
      type="button"
      className={className}
      onClick={toggle}
      aria-label={`Switch to ${next} theme`}
      title={`Switch to ${next} theme`}
    >
      <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false">
        {theme === 'dark' ? (
          // Sun: switch to light.
          <g fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <circle cx="12" cy="12" r="4.5" />
            <path d="M12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22M4.9 4.9l1.8 1.8M17.3 17.3l1.8 1.8M4.9 19.1l1.8-1.8M17.3 6.7l1.8-1.8" />
          </g>
        ) : (
          // Moon: switch to dark.
          <path fill="currentColor" d="M20.5 14.6A8.5 8.5 0 0 1 9.4 3.5a8.5 8.5 0 1 0 11.1 11.1Z" />
        )}
      </svg>
    </button>
  );
}
