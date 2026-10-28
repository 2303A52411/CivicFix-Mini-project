import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const dark = theme === 'dark';
  return <button type="button" onClick={toggleTheme} className="theme-toggle" aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'} title={dark ? 'Light mode' : 'Dark mode'}>{dark ? <Sun className="h-4 w-4"/> : <Moon className="h-4 w-4"/>}<span className="hidden sm:inline">{dark ? 'Light' : 'Dark'}</span></button>;
}
