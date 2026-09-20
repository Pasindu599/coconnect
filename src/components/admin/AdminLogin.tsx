import React, { useState } from 'react';
import { Language, translations } from '../../lib/i18n';
import { AppState, store } from '../../lib/store';
import { 
  ShieldCheck, 
  Lock, 
  KeyRound, 
  Mail, 
  ArrowRight, 
  AlertCircle, 
  CheckCircle2, 
  ArrowLeft,
  UserCheck,
  Building2
} from 'lucide-react';

interface AdminLoginProps {
  state: AppState;
  currentLang: Language;
  onLoginSuccess: () => void;
  onBackToHome: () => void;
}

export const AdminLogin: React.FC<AdminLoginProps> = ({
  state,
  currentLang,
  onLoginSuccess,
  onBackToHome,
}) => {
  const t = translations[currentLang] || translations.en;
  
  const [email, setEmail] = useState('niluka.fernando@coconnect.gov.lk');
  const [pin, setPin] = useState('998877');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    setTimeout(() => {
      // Find admin user or authenticate
      const adminUser = state.users.find(u => u.roles.includes('admin'));
      if (adminUser) {
        store.switchActiveUser(adminUser.id);
        store.switchRole('admin');
        onLoginSuccess();
      } else {
        setError('Administrative credentials rejected. Access is strictly audited.');
      }
      setLoading(false);
    }, 400);
  };

  const handleQuickAdminAuth = () => {
    const adminUser = state.users.find(u => u.roles.includes('admin')) || state.users[3];
    if (adminUser) {
      store.switchActiveUser(adminUser.id);
      store.switchRole('admin');
      onLoginSuccess();
    }
  };

  return (
    <div className="min-h-[calc(100vh-6rem)] flex flex-col justify-center items-center py-8 px-4 sm:px-6 relative">
      {/* Background glow */}
      <div className="absolute top-1/4 w-96 h-96 bg-purple-900/15 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-md w-full relative z-10 space-y-6">
        {/* Navigation back */}
        <button
          onClick={onBackToHome}
          className="inline-flex items-center space-x-1.5 text-xs text-slate-400 hover:text-white transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{t.back_to_home}</span>
        </button>

        {/* Header Badge */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-purple-950 border border-purple-800 text-purple-300 shadow-xl shadow-purple-900/20 mb-2">
            <Lock className="w-7 h-7" />
          </div>
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-purple-950/80 border border-purple-800 text-purple-300 text-[11px] font-mono font-bold">
            <Building2 className="w-3.5 h-3.5" />
            <span>ROUTE /admin • RESTRICTED ACCESS</span>
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">
            {t.admin_login_title}
          </h2>
          <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
            {t.admin_login_subtitle}
          </p>
        </div>

        {/* Card Form */}
        <div className="bg-slate-900 border border-slate-800 p-6 sm:p-8 rounded-2xl shadow-2xl space-y-5">
          {error && (
            <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-200 text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                {t.admin_email_label}
              </label>
              <div className="relative rounded-xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-4 w-4 text-slate-500" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@coconnect.gov.lk"
                  required
                  className="block w-full pl-10 pr-3 py-2.5 border border-slate-700 rounded-xl bg-slate-800 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                {t.admin_pin_label}
              </label>
              <div className="relative rounded-xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <KeyRound className="h-4 w-4 text-slate-500" />
                </div>
                <input
                  type="password"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  placeholder="••••••"
                  maxLength={6}
                  required
                  className="block w-full pl-10 pr-3 py-2.5 border border-slate-700 rounded-xl bg-slate-800 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono tracking-widest"
                />
              </div>
              <p className="mt-1 text-[11px] text-slate-500">
                Authorized staff hardware token or registered biometric authentication.
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-bold text-sm shadow-md transition flex items-center justify-center space-x-2"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>{loading ? 'Authenticating...' : t.admin_login_btn}</span>
            </button>
          </form>

          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-800" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-slate-900 px-2 text-slate-500 font-mono text-[10px]">
                Authorized Staff Credentials
              </span>
            </div>
          </div>

          {/* Quick Demo Staff Login */}
          <button
            onClick={handleQuickAdminAuth}
            className="w-full p-3 rounded-xl bg-purple-950/40 hover:bg-purple-950/70 border border-purple-800/80 text-xs flex items-center justify-between transition group"
          >
            <div className="flex items-center space-x-2.5 text-left">
              <div className="w-8 h-8 rounded-lg bg-purple-900/60 border border-purple-700 text-purple-200 flex items-center justify-center">
                <UserCheck className="w-4 h-4" />
              </div>
              <div>
                <div className="font-bold text-white group-hover:text-purple-300 transition">
                  Niluka Fernando
                </div>
                <div className="text-[11px] text-slate-400">
                  Senior KYC & Dispute Officer (Admin)
                </div>
              </div>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-900 text-purple-200 border border-purple-700">
              Sign In →
            </span>
          </button>
        </div>

        {/* Compliance Footer */}
        <div className="text-center text-[11px] text-slate-500 font-mono">
          <span>Official audit logs are cryptographically hashed and immutable.</span>
        </div>
      </div>
    </div>
  );
};
