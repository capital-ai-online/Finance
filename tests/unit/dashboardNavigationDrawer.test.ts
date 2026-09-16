import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const read = (relativePath: string) => fs.readFileSync(path.join(process.cwd(), relativePath), 'utf8');

const navigationSource = read('src/app/dashboard/DashboardNavigation.tsx');
const headerSource = read('src/app/dashboard/DashboardHeader.tsx');
const drawerSource = read('src/app/dashboard/DashboardNavigationDrawer.tsx');
const legacyDashboardSource = read('src/components/Dashboard.tsx');

describe('BB-2E app-owned dashboard navigation', () => {
  it('consumes the canonical DashboardView and section contracts for standard navigation', () => {
    expect(navigationSource).toContain("getDashboardNavigationItems } from './dashboardNavigation'");
    expect(navigationSource).toContain("getDashboardSection, type DashboardSection, type DashboardView } from './dashboardViews'");
    expect(navigationSource).toContain('getDashboardNavigationItems(section).map');
    expect(navigationSource).toContain('setExpandedSection(getDashboardSection(activeView))');
    expect(navigationSource).not.toContain("from '../../components");
    expect(navigationSource).not.toContain("from '../../../components");
  });

  it('keeps the productive navigation behind the app-owned BB-2F header boundary', () => {
    expect(legacyDashboardSource).toContain("import { DashboardHeader } from '../app/dashboard/DashboardHeader';");
    expect(legacyDashboardSource).toContain('<DashboardHeader');
    expect(legacyDashboardSource).not.toContain('<DashboardNavigation');
    expect(headerSource).toContain('DashboardNavigation,');
    expect(headerSource).toContain('<DashboardNavigation');
    expect(legacyDashboardSource).not.toContain('const [menuOpen, setMenuOpen]');
    expect(legacyDashboardSource).not.toContain('setMenuOpen(');
    expect(legacyDashboardSource).not.toContain('DashboardExpandedSection');
    expect(legacyDashboardSource).not.toContain('getDashboardSection(activeView)');
    expect(legacyDashboardSource).not.toContain('Slide-out Retractable Hamburger Drawer Navigation (Left-hand side)');
  });

  it('implements modal semantics, Escape, initial focus, focus trap and return focus', () => {
    expect(drawerSource).toContain('role="dialog"');
    expect(drawerSource).toContain('aria-modal="true"');
    expect(drawerSource).toContain('aria-labelledby={labelledBy}');
    expect(drawerSource).toContain("event.key === 'Escape'");
    expect(drawerSource).toContain("event.key !== 'Tab'");
    expect(drawerSource).toContain('initialFocusable.focus()');
    expect(drawerSource).toContain('last.focus()');
    expect(drawerSource).toContain('first.focus()');
    expect(drawerSource).toContain('!panel.contains(activeElement)');
    expect(drawerSource).toContain("triggerId = 'dashboard-main-menu-trigger'");
    expect(drawerSource).toContain('requestAnimationFrame(() => returnTarget.focus())');
    expect(drawerSource).toContain("document.body.style.overflow = 'hidden'");
    expect(drawerSource).toContain('document.body.style.overflow = previousBodyOverflow');
  });

  it('preserves visible focus, reduced-motion handling, responsive width and the 44px target floor', () => {
    expect(drawerSource).toContain('useReducedMotion');
    expect(drawerSource).toContain('w-full');
    expect(drawerSource).toContain('sm:w-80');
    expect(drawerSource).toContain('[&_a]:min-h-[44px]');
    expect(drawerSource).toContain('[&_button]:min-h-[44px]');
    expect(navigationSource).toContain('focus-visible:ring-2');
    expect(navigationSource).toContain('min-h-11 min-w-11');
  });

  it('keeps navigation as presentation-only and does not restore Bond as a selectable universe', () => {
    expect(drawerSource).not.toContain('supabase');
    expect(drawerSource).not.toContain('fetch(');
    expect(drawerSource).not.toContain('score');
    expect(navigationSource).toContain("label: 'Krypto'");
    expect(navigationSource).not.toContain("label: 'Bonds'");
    expect(navigationSource).not.toContain("label: 'Bond'");
  });
});
