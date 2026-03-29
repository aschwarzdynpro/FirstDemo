import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Loader2, Eye, EyeOff, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const passwordStrong = password.length >= 8;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!passwordStrong) {
      setError('Passwort muss mindestens 8 Zeichen lang sein.');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await register(email, password);
      navigate('/', { replace: true });
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ??
        'Registrierung fehlgeschlagen.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="mb-8 text-center">
          <span className="text-4xl">⚖</span>
          <h1 className="mt-2 text-2xl font-bold text-gray-900">Konto erstellen</h1>
          <p className="mt-1 text-sm text-gray-500">3 kostenlose Analysen pro Monat</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              E-Mail
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Passwort
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-gray-300 px-4 py-2.5 pr-10 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                placeholder="Mindestens 8 Zeichen"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {password.length > 0 && (
              <p className={`mt-1.5 flex items-center gap-1 text-xs ${passwordStrong ? 'text-green-600' : 'text-amber-600'}`}>
                <CheckCircle2 size={12} />
                {passwordStrong ? 'Sicheres Passwort' : 'Zu kurz — mind. 8 Zeichen'}
              </p>
            )}
          </div>

          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-700 disabled:opacity-60"
          >
            {loading && <Loader2 size={15} className="animate-spin" />}
            Konto erstellen
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-500">
          Bereits registriert?{' '}
          <Link to="/login" className="font-medium text-indigo-600 hover:underline">
            Anmelden
          </Link>
        </p>

        <p className="mt-4 text-center text-xs text-gray-400">
          Mit der Registrierung akzeptieren Sie unsere Nutzungsbedingungen.
        </p>
      </div>
    </div>
  );
}
