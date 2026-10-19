import type { ReactNode } from 'react';
import { formatRoute } from './route.ts';
import { Tracking } from './tracking.tsx';
import './TopBar.css';

export interface TopBarProps {
  /** The course name, a link to the home page. */
  title: string;
  /** The muted line beside the course name (the home page's meta; the module's name). */
  subtitle?: ReactNode;
  /** The right-hand end of the bar (the frame's progress dots and "Screen n of m"). */
  children?: ReactNode;
}

/** The bar across the top of every page: the course name, a subtitle, the end slot, tracking. */
export function TopBar({ title, subtitle, children }: TopBarProps) {
  return (
    <header className="topbar">
      <a className="topbar-brand" href={formatRoute({ page: 'home' })}>
        {title}
      </a>
      {subtitle !== undefined && <span className="topbar-subtitle">{subtitle}</span>}
      <span className="topbar-end">
        {children}
        <Tracking />
      </span>
    </header>
  );
}
