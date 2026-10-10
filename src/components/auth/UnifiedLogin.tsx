import React, { useState } from 'react';
import { Language, fmt } from '../../lib/i18n';
import { authApi, RECAPTCHA_CONTAINER_ID } from '../../lib/authApi';
import { authErrorMessage } from '../../lib/authErrors';
import { useCategory, useT } from '../../config/CategoryContext';
import { CategoryIcon } from '../../config/CategoryIcon';
import { CategoryRole, l10n } from '../../config/categories';
import type { Capability, CategoryId, CategoryRoleId } from '../../types/category';
import { 
  Phone, 
  KeyRound, 
  ArrowRight, 
  HardHat, 
  UserCheck, 
  CheckCircle2, 
  AlertCircle,
  ArrowLeft
} from 'lucide-react';

interface UnifiedLoginProps {
  currentLang: Language;
  /** Role pre-selected from a landing-page card. */
  initialRoleId?: CategoryRoleId;
  onLoginSuccess: () => void;
  onBackToHome?: () => void;
  onSwitchCategory?: () => void;
}

// Demo phone numbers of the seeded users, so each role can be tried without typing (mock OTP).
const DEMO_PHONES: Record<CategoryId, Partial<Record<CategoryRoleId, string>>> = {
  coconut: { owner: '+94 77 123 4567', agent: '+94 71 987 6543', worker: '+94 76 555 1234' },
  construction: {
    client: '+94 77 200 0001',
    contractor: '+94 77 200 0002',
    worker: '+94 77 200 0004',
  },
};

// Tailwind needs the full class names present in the source.
const SELECTED: Record<Capability, string> = {
  poster: 'border-emerald-500 bg-emerald-950/60 text-emerald-200',
  bidder: 'border-amber-500 bg-amber-950/60 text-amber-200',
  crew: 'border-teal-500 bg-teal-950/60 text-teal-200',
};

const RoleIcon: React.FC<{ role: CategoryRole; categoryIcon: 'trees' | 'building'; className?: string }> = ({
  role,
  categoryIcon,
  className,
}) => {
  if (role.capability === 'poster') return <CategoryIcon icon={categoryIcon} className={className} />;
  if (role.capability === 'bidder') return <HardHat className={className} />;
  return <UserCheck className={className} />;
};

export const UnifiedLogin: React.FC<UnifiedLoginProps> = ({
  currentLang,
  initialRoleId,
  onLoginSuccess,
  onBackToHome,
  onSwitchCategory,
}) => {
  const t = useT(currentLang);
  const { category } = useCategory();

  const firstRole = category.roles[0].id;
  const startRole = category.roles.some(r => r.id === initialRoleId) ? (initialRoleId as CategoryRoleId) : firstRole;

  const [selectedRoleId, setSelectedRoleId] = useState<CategoryRoleId>(startRole);
  // Demo numbers and the demo code only exist in demo mode; real sign-in starts blank
  const [phone, setPhone] = useState(authApi.isMock ? DEMO_PHONES[category.id][startRole] ?? '+94 7' : '+94 ');
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [otpCode, setOtpCode] = useState(authApi.isMock ? '123456' : '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);

  const handleRoleSelect = (roleId: CategoryRoleId) => {
    setSelectedRoleId(roleId);
    if (authApi.isMock) setPhone(DEMO_PHONES[category.id][roleId] ?? phone);
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!phone || phone.length < 9) {
      setError(t.login_err_phone);
      return;
    }
    setBusy(true);
    try {
      const { demoCode } = await authApi.sendOtp(phone);
      setStep('otp');
      if (demoCode) {
        setOtpCode(demoCode);
        setInfoMessage(fmt(t.login_otp_mock, { code: demoCode }));
      }
    } catch (err) {
      setError(authErrorMessage(err, t));
    } finally {
      setBusy(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await authApi.confirmOtp(phone, otpCode, { category: category.id, role: selectedRoleId });
      onLoginSuccess();
    } catch (err) {
      setError(authErrorMessage(err, t));
    } finally {
      setBusy(false);
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
            <CategoryIcon icon={category.icon} className="w-8 h-8" />
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-white">
            {t.app_title}
          </h2>
          <p className="mt-1.5 text-xs text-slate-400 max-w-sm mx-auto">
            {t.tagline}
          </p>
          <div className="mt-2 inline-flex items-center space-x-2 text-[11px] text-slate-400">
            <span>{t.login_in_category}</span>
            <strong className="text-emerald-300" data-testid="login-category">{l10n(category.label, currentLang)}</strong>
            {onSwitchCategory && (
              <button type="button" onClick={onSwitchCategory} className="underline hover:text-white">
                {t.category_switch}
              </button>
            )}
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 py-7 px-4 shadow-2xl rounded-2xl sm:px-8 space-y-5">
          
          {error && (
            <div role="alert" className="p-3 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-200 text-xs flex items-center space-x-2">
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
                  1. {t.login_step_role}
                </label>
                <div className={`grid gap-2 ${category.roles.length > 3 ? 'grid-cols-2' : 'grid-cols-3'}`}>
                  {category.roles.map(role => (
                    <button
                      key={role.id}
                      type="button"
                      data-testid={`login-role-${role.id}`}
                      aria-pressed={selectedRoleId === role.id}
                      onClick={() => handleRoleSelect(role.id)}
                      className={`p-3 rounded-xl border text-center transition flex flex-col items-center justify-center ${
                        selectedRoleId === role.id
                          ? SELECTED[role.capability]
                          : 'border-slate-800 bg-slate-850 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <RoleIcon role={role} categoryIcon={category.icon} className="w-5 h-5 mb-1" />
                      <span className="text-xs font-bold">{l10n(role.label, currentLang)}</span>
                    </button>
                  ))}
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
                  {t.login_otp_note}
                </p>
                <p className="mt-1 text-[11px] text-slate-500">
                  {t.login_register_note}
                </p>
              </div>

              <button
                type="submit"
                disabled={busy}
                className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white font-bold text-sm shadow-md transition flex items-center justify-center space-x-2"
              >
                <span>{t.send_otp}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div className="text-center pb-1">
                <div className="text-xs text-slate-400">{t.login_code_sent_to}</div>
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
                  {t.common_back}
                </button>
                <button
                  type="submit"
                  disabled={busy}
                  className="w-2/3 py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white text-xs font-bold shadow-md flex items-center justify-center space-x-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{t.verify_continue}</span>
                </button>
              </div>
            </form>
          )}

        </div>

        {/* Invisible reCAPTCHA anchor for real phone sign-in */}
        {!authApi.isMock && <div id={RECAPTCHA_CONTAINER_ID} />}
      </div>
    </div>
  );
};
