import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { FileText, LayoutDashboard, Tag, LogIn, LogOut, UserCircle, Menu, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import UsageCounter from '../freemium/UsageCounter';
import { cn } from '../../lib/utils';

export default function Header() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
    setMobileOpen(false);
  };

  const navItems = [
    { to: '/', label: 'Analysieren', Icon: FileText },
    { to: '/dashboard', label: 'Verlauf', Icon: LayoutDashboard },
    { to: '/pricing', label: 'Preise', Icon: Tag },
  ];

  const navLink = (to: string, label: string, Icon: React.ElementType, onClick?: () => void) => (
    <Link
      to={to}
      onClick={onClick}
      className={cn(
        'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
        pathname === to
          ? 'bg-indigo-50 text-indigo-700'
          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
      )}
    >
      <Icon size={15} />
      {label}
    </Link>
  );

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 font-bold text-gray-900 shrink-0">
          <span className="text-indigo-600 text-xl">⚖</span>
          <span className="hidden sm:inline">VertragsCheck <span className="text-indigo-600">AI</span></span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1">
          {navItems.map(({ to, label, Icon }) => navLink(to, label, Icon))}
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-2">
          <UsageCounter />

          {user ? (
            <div className="hidden md:flex items-center gap-2">
              <span className="flex items-center gap-1.5 text-sm text-gray-600">
                <UserCircle size={16} />
                <span className="hidden lg:inline max-w-[140px] truncate">{user.email}</span>
              </span>
              <button
                onClick={handleLogout}
                className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-sm text-gray-500 hover:bg-gray-100 hover:text-gray-700"
              >
                <LogOut size={15} />
                <span className="hidden lg:inline">Abmelden</span>
              </button>
            </div>
          ) : (
            <Link
              to="/login"
              className="hidden md:flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-indigo-700"
            >
              <LogIn size={14} />
              Anmelden
            </Link>
          )}

          {/* Mobile menu toggle */}
          <button
            className="md:hidden rounded-lg p-1.5 text-gray-500 hover:bg-gray-100"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="Menü"
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="md:hidden border-t border-gray-100 bg-white px-4 py-3 space-y-1">
          {navItems.map(({ to, label, Icon }) => navLink(to, label, Icon, () => setMobileOpen(false)))}

          <div className="pt-2 border-t border-gray-100 mt-2">
            {user ? (
              <>
                <p className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-500">
                  <UserCircle size={15} />
                  {user.email}
                </p>
                <button
                  onClick={handleLogout}
                  className="flex w-full items-center gap-1.5 rounded-md px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100"
                >
                  <LogOut size={15} />
                  Abmelden
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium text-indigo-600 hover:bg-indigo-50"
                >
                  <LogIn size={15} />
                  Anmelden
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100"
                >
                  Kostenlos registrieren
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
