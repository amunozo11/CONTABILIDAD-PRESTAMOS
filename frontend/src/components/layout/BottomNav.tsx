'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home, Users, CreditCard, DollarSign, Settings
} from 'lucide-react';

const navItems = [
  { href: '/',          icon: Home,       label: 'Inicio' },
  { href: '/clientes',  icon: Users,       label: 'Clientes' },
  { href: '/cobros',    icon: DollarSign,  label: 'Cobros' },
  { href: '/prestamos', icon: CreditCard,  label: 'Préstamos' },
  { href: '/gastos',    icon: Settings,    label: 'Gastos' },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="bottom-nav" role="navigation" aria-label="Navegación principal">
      {navItems.map(({ href, icon: Icon, label }) => {
        const isActive = pathname === href || (href !== '/' && pathname.startsWith(href));
        return (
          <Link key={href} href={href} className={`nav-item ${isActive ? 'active' : ''}`}>
            <Icon
              size={22}
              strokeWidth={isActive ? 2.5 : 1.8}
              style={{ color: isActive ? 'var(--brand-500)' : 'var(--text-muted)' }}
            />
            <span>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
