import React, { useState } from 'react';
import { store, AppState } from '../../lib/store';
import {
  Language,
  getT,
  fmt,
  tRole,
  tRoleLong,
  tReviewStatus,
  tDocType,
  tReviewTag,
} from '../../lib/i18n';
import { Role } from '../../types';
import { 
  User, 
  ShieldCheck, 
  Star, 
  Upload, 
  FileText, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  ArrowRightLeft, 
  Lock, 
  Phone, 
  Building, 
  HardHat, 
  Trees, 
  UserCheck,
  Eye,
  Camera,
  Sparkles
} from 'lucide-react';
import { NicSubmissionModal } from '../verification/NicSubmissionModal';

interface UserProfilePageProps {
  state: AppState;
  currentLang: Language;
}

export const UserProfilePage: React.FC<UserProfilePageProps> = ({
  state,
  currentLang,
}) => {
  const t = getT(currentLang);
  const user = state.currentUser;
  
  // Verification upload state
  const [isNicModalOpen, setIsNicModalOpen] = useState(false);
  const [docType, setDocType] = useState<'NIC_FRONT' | 'NIC_BACK' | 'LAND_DEED' | 'BUSINESS_REG'>('NIC_FRONT');
  const [fileName, setFileName] = useState<string>('nic_scan_photo.jpg');
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);

  if (!user) {
    return (
      <div className="p-8 text-center text-slate-400">
        {getT(currentLang).profile_login_required}
      </div>
    );
  }

  const userSubmission = state.nicSubmissions?.find(s => s.user_id === user.id);

  const userDocs = state.verificationDocs.filter(d => d.user_id === user.id);
  const userRatings = state.ratings.filter(r => r.to_user_id === user.id);

  const handleUploadDoc = (e: React.FormEvent) => {
    e.preventDefault();
    store.uploadVerificationDoc(docType, fileName);
    setUploadSuccess(fmt(t.upload_success, { doc: tDocType(docType, currentLang) }));
    setTimeout(() => setUploadSuccess(null), 5000);
  };

  const getNicBadge = (status: string) => {
    switch (status) {
      case 'verified':
        return { label: t.nic_badge_verified, color: 'bg-emerald-950 text-emerald-300 border-emerald-800' };
      case 'pending':
        return { label: t.nic_badge_pending, color: 'bg-amber-950 text-amber-300 border-amber-800' };
      case 'rejected':
        return { label: t.nic_badge_rejected, color: 'bg-rose-950 text-rose-300 border-rose-800' };
      default:
        return { label: t.nic_badge_unverified, color: 'bg-slate-800 text-slate-300 border-slate-700' };
    }
  };

  const nicBadge = getNicBadge(user.nic_status);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      
      {/* Profile Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 rounded-2xl bg-emerald-950 border border-emerald-800 text-emerald-300 flex items-center justify-center font-bold text-2xl shadow-inner">
            {user.name.charAt(0)}
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl font-bold text-white">{user.name}</h1>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${nicBadge.color}`}>
                {t.roster_nic}: {nicBadge.label}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1 flex items-center space-x-2">
              <Phone className="w-3.5 h-3.5 text-slate-500" />
              <span className="font-mono text-slate-300">{user.phone}</span>
              <span>•</span>
              <span className="text-slate-300">{t.profile_active_label}: {tRole(user.active_role, currentLang)}</span>
            </p>
          </div>
        </div>

        {/* Trust Score Display Card */}
        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex items-center space-x-4 self-start sm:self-auto">
          <div>
            <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">{t.trust_score_card}</div>
            <div className="text-2xl font-bold text-emerald-400 font-mono flex items-center space-x-1.5 mt-0.5">
              <Star className="w-5 h-5 fill-current text-amber-400" />
              <span>{user.trust_score.toFixed(2)} / 5.0</span>
            </div>
          </div>
          <div className="text-[10px] text-slate-500 font-mono">
            {t.rule_label}: {state.scoringRule.version}
          </div>
        </div>
      </div>

      {/* Grid: Trust Breakdown & Roles */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        
        {/* Active Roles & Role Switcher */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center space-x-2">
              <ArrowRightLeft className="w-4 h-4 text-emerald-400" />
              <span>{t.multi_role_title}</span>
            </h3>
            <span className="text-[11px] text-slate-400">{t.rbac_note}</span>
          </div>

          <p className="text-xs text-slate-400">
            {t.multi_role_desc}
          </p>

          <div className="space-y-2">
            {(['owner', 'supervisor', 'worker'] as Role[]).map((r) => {
              const hasRole = user.roles.includes(r);
              const isActive = user.active_role === r;

              return (
                <div 
                  key={r}
                  className={`p-3 rounded-xl border flex items-center justify-between text-xs transition ${
                    isActive 
                      ? 'bg-emerald-950/60 border-emerald-600 text-emerald-200 font-bold' 
                      : 'bg-slate-950 border-slate-800 text-slate-300'
                  }`}
                >
                  <div className="flex items-center space-x-2.5">
                    {r === 'owner' && <Trees className="w-4 h-4 text-emerald-400" />}
                    {r === 'supervisor' && <HardHat className="w-4 h-4 text-amber-400" />}
                    {r === 'worker' && <UserCheck className="w-4 h-4 text-teal-400" />}
                    <span>{tRoleLong(r, currentLang)}</span>
                  </div>

                  <div>
                    {isActive ? (
                      <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-900 text-emerald-300 border border-emerald-700">
                        {t.active_role_badge}
                      </span>
                    ) : (
                      <button
                        onClick={() => store.switchRole(r)}
                        className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition"
                      >
                        {t.switch_arrow}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Trust Score Versioned Engine Breakdown */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center space-x-2">
              <ShieldCheck className="w-4 h-4 text-amber-400" />
              <span>{t.trust_breakdown_title}</span>
            </h3>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-amber-300 border border-slate-700">
              {t.frozen_90}
            </span>
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="flex justify-between items-center p-2 rounded-lg bg-slate-950 border border-slate-800/80">
              <span className="text-slate-400">{t.weight_ratings}</span>
              <span className="text-amber-400 font-mono font-bold">
                {userRatings.length > 0 ? (userRatings.reduce((s, r) => s + r.score, 0) / userRatings.length).toFixed(2) : '4.80'} / 5.0
              </span>
            </div>

            <div className="flex justify-between items-center p-2 rounded-lg bg-slate-950 border border-slate-800/80">
              <span className="text-slate-400">{t.weight_completion}</span>
              <span className="text-emerald-400 font-mono font-bold">{t.completion_value}</span>
            </div>

            <div className="flex justify-between items-center p-2 rounded-lg bg-slate-950 border border-slate-800/80">
              <span className="text-slate-400">{t.weight_nic}</span>
              <span className="text-teal-400 font-mono font-bold">
                {user.nic_status === 'verified' ? t.nic_applied : t.nic_pending_verification}
              </span>
            </div>

            <div className="flex justify-between items-center p-2 rounded-lg bg-slate-950 border border-slate-800/80">
              <span className="text-slate-400">{t.weight_dispute}</span>
              <span className="text-slate-300 font-mono font-bold">{t.dispute_clean}</span>
            </div>
          </div>
        </div>

      </div>

      {/* Dedicated National Identity Card (NIC) Submission & Attachments Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                {t.nic_verification}
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${nicBadge.color}`}>
                  {tReviewStatus(user.nic_status, currentLang)}
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                {t.nic_section_desc}
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsNicModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-md transition flex items-center space-x-2 shrink-0 self-start sm:self-auto"
          >
            <Camera className="w-4 h-4" />
            <span>{userSubmission || user.nic_front_url ? t.update_nic_attachments : t.submit_nic_front_back}</span>
          </button>
        </div>

        {/* Display Card Preview if submitted or verified */}
        {userSubmission || user.nic_front_url || user.nic_back_url ? (
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs border-b border-slate-800/80 pb-3">
              <div className="flex items-center space-x-2 text-slate-300">
                <span className="text-slate-400">{t.registered_nic}</span>
                <span className="font-mono font-bold text-white text-sm bg-slate-900 px-2.5 py-0.5 rounded border border-slate-700">
                  {userSubmission?.nic_number || user.nic_number || t.pending_entry}
                </span>
                {userSubmission?.nic_format && (
                  <span className="text-[11px] text-emerald-400 font-medium">
                    ({userSubmission.nic_format === 'OLD_9V' ? t.format_old_9v : t.format_new_12})
                  </span>
                )}
              </div>
              <div className="text-[11px] text-slate-500">
                {t.submitted_label}: {new Date(userSubmission?.submitted_at || user.nic_submitted_at || Date.now()).toLocaleDateString()}
              </div>
            </div>

            {/* Front and Back Image Thumbnails */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Front Side */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400">
                  <span className="text-emerald-400">{t.nic_front_caption}</span>
                  <span>{userSubmission?.front_file_name || 'nic_front.jpg'}</span>
                </div>
                <div className="relative rounded-xl overflow-hidden border border-slate-800 bg-slate-900 aspect-[1.58/1] flex items-center justify-center group">
                  <img
                    src={userSubmission?.front_image_url || user.nic_front_url}
                    alt={t.nic_front_alt}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <button
                      type="button"
                      onClick={() => setIsNicModalOpen(true)}
                      className="px-3 py-1 bg-white text-slate-900 rounded-lg text-xs font-semibold shadow"
                    >
                      {t.inspect_replace}
                    </button>
                  </div>
                </div>
              </div>

              {/* Back Side */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400">
                  <span className="text-blue-400">{t.nic_back_caption}</span>
                  <span>{userSubmission?.back_file_name || 'nic_back.jpg'}</span>
                </div>
                <div className="relative rounded-xl overflow-hidden border border-slate-800 bg-slate-900 aspect-[1.58/1] flex items-center justify-center group">
                  <img
                    src={userSubmission?.back_image_url || user.nic_back_url}
                    alt={t.nic_back_alt}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <button
                      type="button"
                      onClick={() => setIsNicModalOpen(true)}
                      className="px-3 py-1 bg-white text-slate-900 rounded-lg text-xs font-semibold shadow"
                    >
                      {t.inspect_replace}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {user.nic_rejection_reason && (
              <div className="p-3 rounded-lg bg-rose-950/60 border border-rose-800 text-xs text-rose-300 flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{t.rejection_reason_label}: {user.nic_rejection_reason}. {t.resubmit_hint}</span>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-slate-950/60 p-5 rounded-xl border border-dashed border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="space-y-1 text-center sm:text-left">
              <p className="text-xs font-semibold text-slate-200">{t.no_nic_attached}</p>
              <p className="text-[11px] text-slate-400">
                {t.no_nic_hint}
              </p>
            </div>
            <button
              onClick={() => setIsNicModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-md transition flex items-center space-x-2 shrink-0"
            >
              <Upload className="w-4 h-4" />
              <span>{t.attach_nic}</span>
            </button>
          </div>
        )}
      </div>

      {/* Identity Verification Document Upload Form (POST /users/me/verification) */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 text-white font-bold text-base">
            <FileText className="w-5 h-5 text-emerald-400" />
            <span>{t.upload_docs_title}</span>
          </div>
          <span className="text-xs text-slate-400">{t.admin_queue_reviewed}</span>
        </div>

        <p className="text-xs text-slate-400">
          {t.upload_docs_desc}
        </p>

        {uploadSuccess && (
          <div className="p-3.5 rounded-xl bg-emerald-950/70 border border-emerald-800 text-emerald-200 text-xs flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>{uploadSuccess}</span>
          </div>
        )}

        <form onSubmit={handleUploadDoc} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-[11px] font-semibold text-slate-300 mb-1">{t.document_type}</label>
            <select
              value={docType}
              onChange={(e) => setDocType(e.target.value as any)}
              className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs"
            >
              <option value="NIC_FRONT">{tDocType('NIC_FRONT', currentLang)}</option>
              <option value="NIC_BACK">{tDocType('NIC_BACK', currentLang)}</option>
              <option value="LAND_DEED">{tDocType('LAND_DEED', currentLang)}</option>
              <option value="BUSINESS_REG">{tDocType('BUSINESS_REG', currentLang)}</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-300 mb-1">{t.file_attachment}</label>
            <input
              type="text"
              value={fileName}
              onChange={(e) => setFileName(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs font-mono"
            />
          </div>

          <div className="flex items-end">
            <button
              type="submit"
              className="w-full py-2 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-md transition flex items-center justify-center space-x-2"
            >
              <Upload className="w-4 h-4" />
              <span>{t.submit_for_verification}</span>
            </button>
          </div>
        </form>

        {/* Existing uploaded documents */}
        <div className="pt-4 border-t border-slate-800">
          <div className="text-xs font-semibold text-slate-300 mb-2">{t.my_documents}</div>
          <div className="space-y-2">
            {userDocs.length === 0 ? (
              <p className="text-xs text-slate-500 italic">{t.no_documents}</p>
            ) : (
              userDocs.map((doc) => (
                <div key={doc.id} className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs">
                  <div>
                    <div className="font-semibold text-white">{tDocType(doc.doc_type, currentLang)}</div>
                    <div className="text-[11px] text-slate-500 font-mono">{doc.blob_ref}</div>
                    {doc.notes && <div className="text-[11px] text-slate-400 mt-0.5">{doc.notes}</div>}
                  </div>

                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    doc.status === 'approved' ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' :
                    doc.status === 'rejected' ? 'bg-rose-950 text-rose-300 border border-rose-800' :
                    'bg-amber-950 text-amber-300 border border-amber-800'
                  }`}>
                    {tReviewStatus(doc.status, currentLang)}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Ratings & Reviews Received */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
        <h3 className="text-base font-bold text-white flex items-center space-x-2">
          <Star className="w-5 h-5 text-amber-400 fill-current" />
          <span>{t.ratings_received} ({userRatings.length})</span>
        </h3>

        {userRatings.length === 0 ? (
          <p className="text-xs text-slate-500 italic">{t.no_ratings}</p>
        ) : (
          <div className="space-y-3">
            {userRatings.map((rate) => (
              <div key={rate.id} className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="font-semibold text-white">{t.review_by} {rate.from_name}</div>
                  <div className="flex items-center text-amber-400 font-bold">
                    ⭐ {rate.score} / 5 {t.common_stars}
                  </div>
                </div>
                <div className="flex flex-wrap gap-1">
                  {rate.review_tags.map((tag, idx) => (
                    <span key={idx} className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                      {tReviewTag(tag, currentLang)}
                    </span>
                  ))}
                </div>
                <p className="text-slate-300 italic pt-1">"{rate.comment}"</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* NIC Front and Back Submission Modal */}
      <NicSubmissionModal
        isOpen={isNicModalOpen}
        onClose={() => setIsNicModalOpen(false)}
        state={state}
        currentLang={currentLang}
      />
    </div>
  );
};
