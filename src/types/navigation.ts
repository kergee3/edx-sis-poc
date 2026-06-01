import type { ReactElement } from 'react';

export interface NavigationItem {
  label: string;
  path: string;
  icon: ReactElement;
  requiresAuth?: boolean;
}

export function isNavItemDisabled(
  item: NavigationItem,
  isAuthenticated: boolean,
): boolean {
  return Boolean(item.requiresAuth) && !isAuthenticated;
}

export const NAV_DISABLED_TOOLTIP = 'ログインが必要です';
