import React, { useState, useEffect } from 'react';
import { store } from '../../lib/store';
import { Role } from '../../types';
import { Language, translations } from '../../lib/i18n';
import { 
  Phone, 
  KeyRound, 
  ArrowRight, 
  Trees, 
  HardHat, 
  UserCheck, 
  CheckCircle2, 
  AlertCircle,
  ArrowLeft
} from 'lucide-react';

interface UnifiedLoginProps {
  currentLang: Language;
  initialRole?: Role;
  onLoginSuccess: (role: Role) => void;
  onBackToHome?: () => void;
}

export const UnifiedLogin: React.FC<UnifiedLoginProps> = ({
  currentLang,
  initialRole = 'owner',
  onLoginSuccess,
  onBackToHome,
}) => {
  const t = translations[currentLang] || translations.en;
  const [selectedRole, setSelectedRole] = useState<Role>(initialRole === 'admin' ? 'owner' : initialRole);
  const [phone, setPhone] = useState('+94 77 123 4567');
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [otpCode, setOtpCode] = useState('123456');
  const [error, setError] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(60);

  useEffect(() => {
    if (initialRole && initialRole !== 'admin') {
      setSelectedRole(initialRole);
      if (initialRole === 'owner') setPhone('+94 77 123 4567');
      if (initialRole === 'supervisor') setPhone('+94 71 987 6543');
      if (initialRole === 'worker') setPhone('+94 76 555 1234');
    }
  }, [initialRole]);

  const handleRoleSelect = (role: Role) => {
    setSelectedRole(role);
    if (role === 'owner') setPhone('+94 77 123 4567');
    if (role === 'supervisor') setPhone('+94 71 987 6543');
    if (role === 'worker') setPhone('+94 76 555 1234');
  };

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

  return (
    <div className="min-h-[calc(100vh-6rem)] bg-slate-950 flex flex-col justify-center py-8 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background visual accents */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-emerald-900/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-amber-900/15 rounded-full blur-3xl pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 space-y-4">
        {onBackToHome && (
          <button
            onClick={onBackToHome}
            className="inline-flex items-center space-x-1.5 text-xs text-slate-400 hover:text-white transition pb-1"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{t.back_to_home}</span>
          </button>
        )}

        <div className="text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-emerald-600 text-white shadow-lg shadow-emerald-500/20 mb-3">
            <Trees className="w-8 h-8" />
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-white">
            {t.app_title}
          </h2>
          <p className="mt-1.5 text-xs text-slate-400 max-w-sm mx-auto">
            {t.tagline}
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 py-7 px-4 shadow-2xl rounded-2xl sm:px-8 space-y-5">
          
          {error && (
            <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-200 text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          {infoMessage && (
            <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-800 text-emerald-200 text-xs flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-400" />
              <span>{infoMessage}</span>
            </div>
          )}

          {step === 'phone' ? (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  1. {t.active_role}
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => handleRoleSelect('owner')}
                    className={`p-3 rounded-xl border text-center transition flex flex-col items-center justify-center ${
                      selectedRole === 'owner'
                        ? 'border-emerald-500 bg-emerald-950/60 text-emerald-200'
                        : 'border-slate-800 bg-slate-850 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <Trees className="w-5 h-5 mb-1" />
                    <span className="text-xs font-bold">{t.landowner.split(' ')[0]}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleRoleSelect('supervisor')}
                    className={`p-3 rounded-xl border text-center transition flex flex-col items-center justify-center ${
                      selectedRole === 'supervisor'
                        ? 'border-amber-500 bg-amber-950/60 text-amber-200'
                        : 'border-slate-800 bg-slate-850 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <HardHat className="w-5 h-5 mb-1" />
                    <span className="text-xs font-bold">{t.supervisor.split(' ')[0]}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleRoleSelect('worker')}
                    className={`p-3 rounded-xl border text-center transition flex flex-col items-center justify-center ${
                      selectedRole === 'worker'
                        ? 'border-teal-500 bg-teal-950/60 text-teal-200'
                        : 'border-slate-800 bg-slate-850 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <UserCheck className="w-5 h-5 mb-1" />
                    <span className="text-xs font-bold">{t.worker.split(' ')[0]}</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
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
                    className="block w-full pl-10 pr-3 py-2.5 border border-slate-700 rounded-xl bg-slate-800 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                  />
                </div>
                <p className="mt-1 text-[11px] text-slate-500">
                  Rate-limited OTP sent via SMS. Free mock code is provided automatically for testing.
                </p>
              </div>

              <button
                type="submit"
                className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-md transition flex items-center justify-center space-x-2"
              >
                <span>{t.send_otp}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div className="text-center pb-1">
                <div className="text-xs text-slate-400">Code sent to:</div>
                <div className="text-sm font-mono font-bold text-emerald-400">{phone}</div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  {t.enter_otp}
                </label>
                <div className="relative rounded-xl shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <KeyRound className="h-4 w-4 text-slate-500" />
                  </div>
                  <input
                    type="text"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                    maxLength={6}
                    placeholder="123456"
                    required
                    className="block w-full pl-10 pr-3 py-2.5 border border-slate-700 rounded-xl bg-slate-800 text-white text-center text-lg tracking-widest font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="flex space-x-2">
                <button
                  type="button"
                  onClick={() => setStep('phone')}
                  className="w-1/3 py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                >
                  Back
                </button>
                <button
                  type="submit"
                  className="w-2/3 py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md flex items-center justify-center space-x-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{t.verify_continue}</span>
                </button>
              </div>
            </form>
          )}

        </div>
      </div>
    </div>
  );
};
