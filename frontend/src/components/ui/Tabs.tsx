import { NavLink } from 'react-router-dom';
import type { LucideIcon } from 'lucide-react';
import s from './Tabs.module.css';

export interface TabItem {
  id: string;
  label: string;
  to: string;
  icon?: LucideIcon;
  end?: boolean; // match exactly or prefix
}

interface TabsProps {
  items: TabItem[];
}

export function Tabs({ items }: TabsProps) {
  return (
    <div className={s.tabsContainer}>
      {items.map((tab) => {
        const Icon = tab.icon;
        return (
          <NavLink
            key={tab.id}
            to={tab.to}
            end={tab.end}
            className={({ isActive }) => `${s.tabLink} ${isActive ? s.active : ''}`}
          >
            {Icon && <Icon size={16} className={s.icon} />}
            <span>{tab.label}</span>
          </NavLink>
        );
      })}
    </div>
  );
}
