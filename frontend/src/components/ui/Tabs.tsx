import { useEffect, useRef, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { ChevronDown, type LucideIcon } from 'lucide-react';
import clsx from 'clsx';
import s from './Tabs.module.css';

export interface TabItem {
  id: string;
  label: string;
  to: string;
  icon?: LucideIcon;
  end?: boolean;
  /** Nested destinations shown as a dropdown + secondary row when active. */
  children?: TabItem[];
}

interface TabsProps {
  items: TabItem[];
}

/** Flatten grouped tabs for breadcrumbs / search lookups. */
export function flattenTabItems(items: TabItem[]): TabItem[] {
  return items.flatMap((item) =>
    item.children?.length ? item.children : [item],
  );
}

function pathMatches(pathname: string, item: TabItem): boolean {
  if (item.end) return pathname === item.to;
  return pathname === item.to || pathname.startsWith(`${item.to}/`);
}

function isGroupActive(pathname: string, item: TabItem): boolean {
  if (item.children?.length) {
    return item.children.some((child) => pathMatches(pathname, child));
  }
  return pathMatches(pathname, item);
}

function findActiveGroup(items: TabItem[], pathname: string): TabItem | null {
  return items.find((item) => item.children?.length && isGroupActive(pathname, item)) ?? null;
}

function TabDropdown({ item, active }: { item: TabItem; active: boolean }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const Icon = item.icon;
  const children = item.children ?? [];

  useEffect(() => {
    if (!open) return;
    const onPointer = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div className={s.dropdown} ref={rootRef}>
      <button
        type="button"
        className={clsx(s.tabLink, s.dropdownTrigger, active && s.active)}
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((v) => !v)}
      >
        {Icon && <Icon size={16} className={s.icon} />}
        <span>{item.label}</span>
        <ChevronDown size={14} className={clsx(s.chevron, open && s.chevronOpen)} />
      </button>
      {open && (
        <div className={s.menu} role="menu">
          {children.map((child) => {
            const ChildIcon = child.icon;
            return (
              <NavLink
                key={child.id}
                to={child.to}
                end={child.end}
                role="menuitem"
                className={({ isActive }) => clsx(s.menuItem, isActive && s.menuItemActive)}
                onClick={() => setOpen(false)}
              >
                {ChildIcon && <ChildIcon size={15} className={s.icon} />}
                <span>{child.label}</span>
              </NavLink>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function Tabs({ items }: TabsProps) {
  const { pathname } = useLocation();
  const activeGroup = findActiveGroup(items, pathname);

  return (
    <div className={s.tabsRoot}>
      <div className={s.tabsContainer} role="tablist">
        {items.map((tab) => {
          if (tab.children?.length) {
            return (
              <TabDropdown
                key={tab.id}
                item={tab}
                active={isGroupActive(pathname, tab)}
              />
            );
          }

          const Icon = tab.icon;
          return (
            <NavLink
              key={tab.id}
              to={tab.to}
              end={tab.end}
              className={({ isActive }) => clsx(s.tabLink, isActive && s.active)}
            >
              {Icon && <Icon size={16} className={s.icon} />}
              <span>{tab.label}</span>
            </NavLink>
          );
        })}
      </div>

      {activeGroup?.children && (
        <div className={s.subTabs} role="tablist" aria-label={activeGroup.label}>
          {activeGroup.children.map((child) => {
            const Icon = child.icon;
            return (
              <NavLink
                key={child.id}
                to={child.to}
                end={child.end}
                className={({ isActive }) => clsx(s.subTab, isActive && s.subTabActive)}
              >
                {Icon && <Icon size={14} className={s.icon} />}
                <span>{child.label}</span>
              </NavLink>
            );
          })}
        </div>
      )}
    </div>
  );
}
