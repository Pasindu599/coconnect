import React, { useState } from 'react';
import { store, AppState } from '../../lib/store';
import { Language, tRole, tReviewStatus, tDocType, tGender } from '../../lib/i18n';
import { useT } from '../../config/CategoryContext';
import { UserCheck, CheckCircle2, XCircle, Clock, Maximize2, X, Camera } from 'lucide-react';

interface VerificationsTabProps {
  state: AppState;
  currentLang: Language;
}

export const VerificationsTab: React.FC<VerificationsTabProps> = ({ state, currentLang }) => {
  const t = useT(currentLang);
  const [reviewNotes, setReviewNotes] = useState(t.review_notes_default);
  // Zoom image state for front / back inspection
  const [zoomImage, setZoomImage] = useState<{ url: string; title: string; side: string } | null>(null);

  const pendingDocs = state.verificationDocs.filter(d => d.status === 'pending');
  const nicSubmissions = state.nicSubmissions || [];
  const pendingNicSubmissions = nicSubmissions.filter(s => s.status === 'pending');

  const handleApproveDoc = (docId: string) => {
    store.adminDecideVerification(docId, 'approved', reviewNotes);
  };

  const handleRejectDoc = (docId: string) => {
    store.adminDecideVerification(docId, 'rejected', reviewNotes);
  };

  const handleApproveNic = (subId: string) => {
    store.adminDecideNicSubmission(subId, 'approved', t.nic_approve_note);
  };

  const handleRejectNic = (subId: string) => {
    const reason = window.prompt(t.nic_reject_prompt, t.nic_reject_default);
    if (reason) {
      store.adminDecideNicSubmission(subId, 'rejected', reason);
    }
  };

  return (
  <>
      <div className="space-y-6">
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
          <h3 className="text-base font-bold text-white flex items-center space-x-2">
            <UserCheck className="w-5 h-5 text-purple-400" />
            <span>{t.kyc_desk_title}</span>
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            {t.kyc_desk_desc_1} <strong className="text-emerald-400">{t.kyc_desk_badge}</strong> {t.kyc_desk_desc_2}
          </p>
        </div>

        {/* Section 1: NIC Submissions (Front & Back Attachments) */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-purple-300 flex items-center space-x-2">
              <Camera className="w-4 h-4" />
              <span>{t.nic_queue_title} ({nicSubmissions.length} {t.common_total} • {pendingNicSubmissions.length} {t.common_pending})</span>
            </h4>
            <span className="text-[11px] text-slate-500">{t.live_database}</span>
          </div>

          {nicSubmissions.length === 0 ? (
            <div className="p-8 text-center bg-slate-900 border border-slate-800 rounded-2xl text-xs text-slate-500">
              {t.no_nic_submissions}
            </div>
          ) : (
            nicSubmissions.map((sub) => {
              const isPending = sub.status === 'pending';

              return (
                <div 
                  key={sub.id} 
                  className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-4 hover:border-slate-700 transition"
                >
                  {/* Header & Meta */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase border ${
                          sub.status === 'approved' ? 'bg-emerald-950 text-emerald-300 border-emerald-800' :
                          sub.status === 'rejected' ? 'bg-rose-950 text-rose-300 border-rose-800' :
                          'bg-amber-950 text-amber-300 border-amber-800 animate-pulse'
                        }`}>
                          {tReviewStatus(sub.status, currentLang)}
                        </span>
                        <span className="text-xs font-mono text-slate-400">{t.land_id}: {sub.id}</span>
                        <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                          {tRole(sub.role, currentLang)}
                        </span>
                      </div>
                      <h4 className="text-base font-bold text-white mt-1">
                        {sub.user_name}
                        <span className="text-xs font-normal text-slate-400 ml-2 font-mono">
                          ({sub.user_phone})
                        </span>
                      </h4>
                    </div>

                    <div className="text-left sm:text-right text-xs">
                      <div className="text-slate-400">{t.nic_number_label}</div>
                      <div className="font-mono font-bold text-emerald-400 text-sm bg-slate-950 px-2.5 py-0.5 rounded border border-slate-800 inline-block mt-0.5">
                        {sub.nic_number}
                      </div>
                    </div>
                  </div>

                  {/* Parsed NIC Verification Details */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs bg-slate-950 p-3 rounded-xl border border-slate-800/80">
                    <div>
                      <div className="text-[10px] uppercase text-slate-500 font-bold">{t.nic_format_label}</div>
                      <div className="text-white font-medium mt-0.5">
                        {sub.nic_format === 'OLD_9V' ? t.format_old_9v : t.format_new_12}
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] uppercase text-slate-500 font-bold">{t.est_dob}</div>
                      <div className="text-white font-medium mt-0.5">{sub.dob || t.extracted}</div>
                    </div>
                    <div>
                      <div className="text-[10px] uppercase text-slate-500 font-bold">{t.gender_label}</div>
                      <div className="text-white font-medium mt-0.5">{sub.gender ? tGender(sub.gender, currentLang) : t.not_specified}</div>
                    </div>
                    <div>
                      <div className="text-[10px] uppercase text-slate-500 font-bold">{t.submitted_date}</div>
                      <div className="text-white font-medium mt-0.5">
                        {new Date(sub.submitted_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>

                  {/* Dual Attachments: Front & Back Sides Side-by-Side */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                    {/* Front Card Attachment */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-[11px] font-semibold text-slate-300">
                        <span className="text-emerald-400">{t.front_side_caption}</span>
                        <span className="font-mono text-slate-500 text-[10px]">{sub.front_file_name}</span>
                      </div>
                      <div className="relative rounded-xl overflow-hidden border border-slate-800 bg-slate-950 aspect-[1.58/1] flex items-center justify-center group shadow-inner">
                        <img 
                          src={sub.front_image_url} 
                          alt={`${sub.user_name} — ${t.nic_front_alt}`}
                          className="w-full h-full object-cover transition duration-200 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2">
                          <button
                            onClick={() => setZoomImage({ url: sub.front_image_url, title: `${sub.user_name} — ${t.nic_front_caption}`, side: 'Front' })}
                            className="px-3 py-1.5 rounded-lg bg-white/90 hover:bg-white text-slate-900 text-xs font-bold shadow-lg flex items-center space-x-1.5"
                          >
                            <Maximize2 className="w-3.5 h-3.5" />
                            <span>{t.inspect_front}</span>
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Back Card Attachment */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-[11px] font-semibold text-slate-300">
                        <span className="text-blue-400">{t.back_side_caption}</span>
                        <span className="font-mono text-slate-500 text-[10px]">{sub.back_file_name}</span>
                      </div>
                      <div className="relative rounded-xl overflow-hidden border border-slate-800 bg-slate-950 aspect-[1.58/1] flex items-center justify-center group shadow-inner">
                        <img 
                          src={sub.back_image_url} 
                          alt={`${sub.user_name} — ${t.nic_back_alt}`}
                          className="w-full h-full object-cover transition duration-200 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2">
                          <button
                            onClick={() => setZoomImage({ url: sub.back_image_url, title: `${sub.user_name} — ${t.nic_back_caption}`, side: 'Back' })}
                            className="px-3 py-1.5 rounded-lg bg-white/90 hover:bg-white text-slate-900 text-xs font-bold shadow-lg flex items-center space-x-1.5"
                          >
                            <Maximize2 className="w-3.5 h-3.5" />
                            <span>{t.inspect_back}</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {sub.notes && (
                    <p className="text-xs text-slate-400 italic bg-slate-950/50 p-2.5 rounded-lg border border-slate-800/60">
                      {t.user_notes}: “{sub.notes}”
                    </p>
                  )}

                  {/* Admin Action Controls */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-slate-800">
                    {isPending ? (
                      <>
                        <div className="text-xs text-slate-400 flex items-center space-x-1.5">
                          <Clock className="w-4 h-4 text-amber-400 animate-pulse" />
                          <span>{t.awaiting_adjudication}</span>
                        </div>
                        <div className="flex items-center space-x-2.5">
                          <button
                            onClick={() => handleRejectNic(sub.id)}
                            className="px-3.5 py-2 rounded-xl bg-rose-950/80 hover:bg-rose-900 text-rose-300 border border-rose-800 text-xs font-semibold shadow-sm flex items-center space-x-1.5 transition"
                          >
                            <XCircle className="w-4 h-4" />
                            <span>{t.reject_with_reason}</span>
                          </button>
                          <button
                            onClick={() => handleApproveNic(sub.id)}
                            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md flex items-center space-x-1.5 transition"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            <span>{t.approve_nic_badge}</span>
                          </button>
                        </div>
                      </>
                    ) : (
                      <div className="text-xs text-slate-400 flex items-center justify-between w-full">
                        <span>
                          {t.reviewed_by} <strong className="text-slate-200">{sub.reviewed_by || t.admin_officer_default}</strong> {t.common_on} {new Date(sub.reviewed_at || Date.now()).toLocaleDateString()}
                        </span>
                        {sub.rejection_reason && (
                          <span className="text-rose-400 italic">{t.rejection_reason_label}: {sub.rejection_reason}</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Section 2: General Verification Documents (Land Deeds, Business Reg) */}
        <div className="space-y-3 pt-4 border-t border-slate-800">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            {t.general_docs_title} ({pendingDocs.length} {t.common_pending})
          </h4>

          {state.verificationDocs.map((doc) => {
            const isPending = doc.status === 'pending';

            return (
              <div key={doc.id} className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                      doc.status === 'approved' ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' :
                      doc.status === 'rejected' ? 'bg-rose-950 text-rose-300 border border-rose-800' :
                      'bg-amber-950 text-amber-300 border border-amber-800 animate-pulse'
                    }`}>
                      {tReviewStatus(doc.status, currentLang)}
                    </span>
                    <span className="text-xs text-slate-400">{t.doc_id_label}: {doc.id}</span>
                  </div>

                  <h4 className="text-sm font-bold text-white mt-1.5">{doc.user_name} ({tRole(doc.role, currentLang)})</h4>
                  <p className="text-xs text-slate-400">
                    {t.worker_phone_label}: <span className="font-mono text-slate-300">{doc.user_phone}</span> • {t.type_label}: <strong className="text-slate-200">{tDocType(doc.doc_type, currentLang)}</strong>
                  </p>
                  <p className="text-[11px] text-slate-500 font-mono mt-0.5">{t.reference_label}: {doc.blob_ref}</p>
                  {doc.notes && <p className="text-xs text-slate-400 mt-1 italic">{t.common_notes}: {doc.notes}</p>}
                </div>

                <div className="flex items-center space-x-3">
                  {isPending ? (
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleApproveDoc(doc.id)}
                        className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md flex items-center space-x-1.5"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>{t.approve_doc}</span>
                      </button>
                      <button
                        onClick={() => handleRejectDoc(doc.id)}
                        className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow-md flex items-center space-x-1.5"
                      >
                        <XCircle className="w-4 h-4" />
                        <span>{t.reject_word}</span>
                      </button>
                    </div>
                  ) : (
                    <div className="text-xs text-slate-500">
                      {t.reviewed_by} {doc.reviewed_by || t.admin_officer_default} {t.common_on} {doc.reviewed_at?.split('T')[0]}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

  {zoomImage && (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-5 space-y-4 shadow-2xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center space-x-2">
              <span className={`text-xs px-2.5 py-0.5 rounded font-bold uppercase ${
                zoomImage.side === 'Front' ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'bg-blue-950 text-blue-300 border border-blue-800'
              }`}>
                {zoomImage.side === 'Front' ? t.front_word : t.back_word} {t.side_inspector}
              </span>
              <h3 className="text-sm font-bold text-white truncate">{zoomImage.title}</h3>
            </div>
            <button
              onClick={() => setZoomImage(null)}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="rounded-xl overflow-hidden border border-slate-800 bg-slate-950 flex items-center justify-center p-2">
            <img
              src={zoomImage.url}
              alt={zoomImage.title}
              className="max-h-[65vh] w-auto object-contain rounded-lg shadow"
            />
          </div>

          <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
            <span>{t.inspector_hint}</span>
            <button
              onClick={() => setZoomImage(null)}
              className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold"
            >
              {t.close_inspector}
            </button>
          </div>
        </div>
      </div>
  )}
  </>
  );
};
