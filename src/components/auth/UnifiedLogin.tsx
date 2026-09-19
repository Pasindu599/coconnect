import React, { useState } from 'react';
import { store, AppState } from '../../lib/store';
import { Role } from '../../types';
import { Language, translations } from '../../lib/i18n';
import { 
  Phone, 
  KeyRound, 
  ArrowRight, 
  Trees, 
  HardHat, 
  UserCheck, 
  ShieldCheck, 
  CheckCircle2, 
  AlertCircle,
  Clock,
  Sparkles
} from 'lucide-react';

interface UnifiedLoginProps {
  state: AppState;
  currentLang: Language;
  onLoginSuccess: (role: Role) => void;
}

export const UnifiedLogin: React.FC<UnifiedLoginProps> = ({
  state,
  currentLang,
  onLoginSuccess,
}) => {
  const t = translations[currentLang];
  const [phone, setPhone] = useState('+94 77 123 4567');
  const [selectedRole, setSelectedRole] = useState<Role>('owner');
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [otpCode, setOtpCode] = useState('123456');
  const [error, setError] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(60);

  const handleSendOtp = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!phone || phone.length < 9) {
      setError('Please enter a valid phone number with country code');
      return;
    }
    const res = store.requestOtp(phone);
    if (res.success) {
      setStep('otp');
      setOtpCode(res.code);
      setInfoMessage(`Mock OTP generated: ${res.code} (auto-filled for testing)`);
    }
  };

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const res = store.verifyOtp(phone, otpCode, selectedRole);
    if (res.success && res.user) {
      onLoginSuccess(res.user.active_role);
    } else {
      setError(res.error || 'Verification failed. Please check the code.');
    }
  };

  const handleQuickLogin = (userId: string) => {
    const user = state.users.find(u => u.id === userId);
    if (user) {
      store.switchActiveUser(user.id);
      onLoginSuccess(user.active_role);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background visual accents */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-emerald-900/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-amber-900/15 rounded-full blur-3xl pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-emerald-600 text-white shadow-lg shadow-emerald-500/20 mb-4">
            <Trees className="w-8 h-8" />
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-white">
            {t.app_title}
          </h2>
          <p className="mt-2 text-sm text-slate-400 max-w-sm mx-auto">
            {t.tagline}
          </p>
        </div>

        <div className="mt-8 bg-slate-900 border border-slate-800 py-8 px-4 shadow-2xl rounded-2xl sm:px-10">
          
          {error && (
            <div className="mb-5 p-3 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-200 text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          {infoMessage && (
            <div className="mb-5 p-3 rounded-xl bg-emerald-950/60 border border-emerald-800 text-emerald-200 text-xs flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-400" />
              <span>{infoMessage}</span>
            </div>
          )}

          {step === 'phone' ? (
            <form onSubmit={handleSendOtp} className="space-y-5">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  1. Choose Desired Role
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedRole('owner');
                      setPhone('+94 77 123 4567');
                    }}
                    className={`p-3 rounded-xl border text-center transition flex flex-col items-center justify-center ${
                      selectedRole === 'owner'
                        ? 'border-emerald-500 bg-emerald-950/60 text-emerald-200'
                        : 'border-slate-800 bg-slate-850 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <Trees className="w-5 h-5 mb-1" />
                    <span className="text-xs font-bold">Owner</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setSelectedRole('supervisor');
                      setPhone('+94 71 987 6543');
                    }}
                    className={`p-3 rounded-xl border text-center transition flex flex-col items-center justify-center ${
                      selectedRole === 'supervisor'
                        ? 'border-amber-500 bg-amber-950/60 text-amber-200'
                        : 'border-slate-800 bg-slate-850 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <HardHat className="w-5 h-5 mb-1" />
                    <span className="text-xs font-bold">Supervisor</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setSelectedRole('worker');
                      setPhone('+94 76 555 1234');
                    }}
                    className={`p-3 rounded-xl border text-center transition flex flex-col items-center justify-center ${
                      selectedRole === 'worker'
                        ? 'border-teal-500 bg-teal-950/60 text-teal-200'
                        : 'border-slate-800 bg-slate-850 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <UserCheck className="w-5 h-5 mb-1" />
                    <span className="text-xs font-bold">Worker</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  2. {t.phone_number}
                </label>
                <div className="relative rounded-xl shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Phone className="h-4 w-4 text-slate-500" />
                  </div>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+94 77 000 0000"
                    required
                    className="block w-full pl-10 pr-3 py-3 border border-slate-700 rounded-xl bg-slate-800 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent font-mono"
                  />
                </div>
                <p className="mt-1.5 text-[11px] text-slate-500">
                  Rate-limited OTP sent via SMS. Free mock OTP is provided for instant testing.
                </p>
              </div>

              <button
                type="submit"
                className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm shadow-md transition flex items-center justify-center space-x-2"
              >
                <span>{t.send_otp}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-5">
              <div className="text-center pb-1">
                <div className="text-xs text-slate-400">Code sent to:</div>
                <div className="text-sm font-mono font-bold text-emerald-400">{phone}</div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2 text-center">
                  {t.enter_otp}
                </label>
                <div className="relative rounded-xl shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <KeyRound className="h-4 w-4 text-slate-500" />
                  </div>
                  <input
                    type="text"
                    maxLength={6}
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                    placeholder="123456"
                    required
                    className="block w-full pl-10 pr-3 py-3 border border-slate-700 rounded-xl bg-slate-800 text-white text-center text-xl tracking-widest font-mono font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div className="flex justify-between items-center mt-2 text-xs text-slate-500">
                  <span className="flex items-center space-x-1">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Expires in 14:58</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setStep('phone')}
                    className="text-emerald-400 hover:underline"
                  >
                    Change Phone
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm shadow-md transition flex items-center justify-center space-x-2"
              >
                <span>{t.verify_continue}</span>
                <CheckCircle2 className="w-4 h-4" />
              </button>
            </form>
          )}

          {/* Quick Demo Personas */}
          <div className="mt-8 pt-6 border-t border-slate-800">
            <div className="flex items-center space-x-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>{t.demo_accounts}</span>
            </div>

            <div className="space-y-2">
              <button
                onClick={() => handleQuickLogin('user-owner-1')}
                className="w-full text-left p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-750 border border-slate-700/80 text-xs flex items-center justify-between transition group"
              >
                <div className="flex items-center space-x-2.5">
                  <div className="w-8 h-8 rounded-lg bg-emerald-950 border border-emerald-800 text-emerald-300 flex items-center justify-center">
                    <Trees className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-semibold text-white group-hover:text-emerald-300 transition">Sunil Perera</div>
                    <div className="text-[11px] text-slate-400">Landowner (2 Coconut Estates, 1,470 Trees)</div>
                  </div>
                </div>
                <span className="text-[10px] text-emerald-400 font-mono px-2 py-0.5 rounded bg-slate-900 border border-slate-700">
                  Owner Portal →
                </span>
              </button>

              <button
                onClick={() => handleQuickLogin('user-sup-1')}
                className="w-full text-left p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-750 border border-slate-700/80 text-xs flex items-center justify-between transition group"
              >
                <div className="flex items-center space-x-2.5">
                  <div className="w-8 h-8 rounded-lg bg-amber-950 border border-amber-800 text-amber-300 flex items-center justify-center">
                    <HardHat className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-semibold text-white group-hover:text-amber-300 transition">Kusal Mendis</div>
                    <div className="text-[11px] text-slate-400">Labour Broker / Supervisor (5 Crew Workers)</div>
                  </div>
                </div>
                <span className="text-[10px] text-amber-400 font-mono px-2 py-0.5 rounded bg-slate-900 border border-slate-700">
                  Supervisor Portal →
                </span>
              </button>

              <button
                onClick={() => handleQuickLogin('user-worker-1')}
                className="w-full text-left p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-750 border border-slate-700/80 text-xs flex items-center justify-between transition group"
              >
                <div className="flex items-center space-x-2.5">
                  <div className="w-8 h-8 rounded-lg bg-teal-950 border border-teal-800 text-teal-300 flex items-center justify-center">
                    <UserCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-semibold text-white group-hover:text-teal-300 transition">Chaminda Silva</div>
                    <div className="text-[11px] text-slate-400">Agricultural Worker (Climber, Plucker)</div>
                  </div>
                </div>
                <span className="text-[10px] text-teal-400 font-mono px-2 py-0.5 rounded bg-slate-900 border border-slate-700">
                  Worker Portal →
                </span>
              </button>

              <button
                onClick={() => handleQuickLogin('user-admin-1')}
                className="w-full text-left p-2.5 rounded-xl bg-purple-950/30 hover:bg-purple-950/50 border border-purple-900/60 text-xs flex items-center justify-between transition group"
              >
                <div className="flex items-center space-x-2.5">
                  <div className="w-8 h-8 rounded-lg bg-purple-950 border border-purple-800 text-purple-300 flex items-center justify-center">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-semibold text-white group-hover:text-purple-300 transition">Niluka Fernando</div>
                    <div className="text-[11px] text-slate-400">Coconnect Staff (Verification & Exception Officer)</div>
                  </div>
                </div>
                <span className="text-[10px] text-purple-300 font-mono px-2 py-0.5 rounded bg-purple-900/50 border border-purple-700">
                  Admin Panel →
                </span>
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
