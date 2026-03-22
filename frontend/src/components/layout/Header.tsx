import { Link, useLocation } from 'react-router-dom';
import { FileText, LayoutDashboard, Tag } from 'lucide-react';
import UsageCounter from '../freemium/UsageCounter';

export default function Header() {
  const { pathname } = useLocation();

  const navLink = (to: string, label: string, Icon: React.ElementType) => (
    <Link
      to={to}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
        pathname === to
          ? 'bg-indigo-50 text-indigo-700'
          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
      }`}
    >
      <Icon size={15} />
      {label}
    </Link>
  );

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 font-bold text-gray-900">
          <span className="text-indigo-600 text-xl">⚖</span>
          <span className="hidden sm:inline">VertragsCheck <span className="text-indigo-600">AI</span></span>
        </Link>

        {/* Nav */}
        <nav className="flex items-center gap-1">
          {navLink('/', 'Analysieren', FileText)}
          {navLink('/dashboard', 'Verlauf', LayoutDashboard)}
          {navLink('/pricing', 'Preise', Tag)}
        </nav>

        {/* Usage */}
        <UsageCounter />
      </div>
    </header>
  );
}
