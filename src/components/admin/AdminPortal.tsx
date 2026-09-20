import React, { useState } from 'react';
import { store, AppState } from '../../lib/store';
import { VerificationDoc, ExceptionIssue, AuditLogEntry, NicSubmission } from '../../types';
import { Language, translations } from '../../lib/i18n';
import { 
  ShieldCheck, 
  UserCheck, 
  AlertTriangle, 
  History, 
  Settings, 
  CheckCircle2, 
  XCircle, 
  FileText, 
  Lock, 
  Search, 
  Clock, 
  Scale, 
  RefreshCw,
  Eye,
  Sliders,
  Maximize2,
  X,
  ExternalLink,
  Camera
} from 'lucide-react';

interface AdminPortalProps {
  state: AppState;
  currentLang: Language;
  onExitAdmin: () => void;
}

export const AdminPortal: React.FC<AdminPortalProps> = ({
  state,
  currentLang,
  onExitAdmin,
}) => {
  const t = translations[currentLang];
  const user = state.currentUser;
  const [adminTab, setAdminTab] = useState<'verifications' | 'exceptions' | 'audit' | 'trust_rules'>('verifications');
  
  // Verification action state
  const [selectedDoc, setSelectedDoc] = useState<VerificationDoc | null>(null);
  const [reviewNotes, setReviewNotes] = useState('Official Sri Lankan NIC verified against Department of Registration standards.');
  
  // Zoom Image State for Front / Back inspection
  const [zoomImage, setZoomImage] = useState<{ url: string; title: string; side: string } | null>(null);

  // Exception action state
  const [selectedException, setSelectedException] = useState<ExceptionIssue | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState('Owner gate log verified against supervisor GPS check-in. Wage adjusted accordingly.');

  // Strict Separation Check: Standard users have no access
  const isAdmin = user && user.roles.includes('admin');

  if (!isAdmin) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-rose-950/60 border border-rose-800 text-rose-400 flex items-center justify-center mb-4">
          <Lock className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-white">403 Forbidden: Isolated Admin System</h2>
        <p className="text-xs text-slate-400 max-w-md mt-2">
          Strict separation enforced. Standard users (Owners, Brokers, Workers) have no visibility or routing into the Coconnect administrative backend.
        </p>
        <button
          onClick={() => {
            store.switchActiveUser('user-admin-1');
            store.switchRole('admin');
          }}
          className="mt-5 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow-md"
        >
          Sign In as Coconnect Staff Admin (Niluka Fernando) →
        </button>
      </div>
    );
  }

  const pendingDocs = state.verificationDocs.filter(d => d.status === 'pending');
  const nicSubmissions = state.nicSubmissions || [];
  const pendingNicSubmissions = nicSubmissions.filter(s => s.status === 'pending');
  const totalPendingVerifications = pendingDocs.length + pendingNicSubmissions.length;
  const openExceptions = state.exceptions.filter(e => e.status !== 'resolved');

  const handleApproveDoc = (docId: string) => {
    store.adminDecideVerification(docId, 'approved', reviewNotes);
    setSelectedDoc(null);
  };

  const handleRejectDoc = (docId: string) => {
    store.adminDecideVerification(docId, 'rejected', reviewNotes);
    setSelectedDoc(null);
  };

  const handleApproveNic = (subId: string) => {
    store.adminDecideNicSubmission(subId, 'approved', 'NIC Front & Back validated. Sri Lankan identity criteria met.');
  };

  const handleRejectNic = (subId: string) => {
    const reason = window.prompt('Enter rejection reason for this NIC submission:', 'Back side address photo is blurry or illegible');
    if (reason) {
      store.adminDecideNicSubmission(subId, 'rejected', reason);
    }
  };

  const handleResolveException = (excId: string) => {
    store.adminResolveException(excId, resolutionNotes);
    setSelectedException(null);
  };

  return (
    <div className="space-y-6">
      
      {/* Admin Header Banner */}
      <div className="bg-slate-900 border border-purple-900/60 rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center space-x-3.5">
          <div className="w-12 h-12 rounded-xl bg-purple-950 border border-purple-700 text-purple-300 flex items-center justify-center font-bold">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl font-bold text-white tracking-tight">Coconnect Internal Control Panel</h1>
              <span className="px-2.5 py-0.5 rounded-full bg-purple-950 text-purple-300 text-xs font-mono font-semibold border border-purple-800">
                ADMIN ROLE
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Staff Officer: <strong className="text-white">{user.name}</strong> • Isolated Admin Monorepo App • Endpoint: <code className="text-purple-300">/admin/*</code>
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={onExitAdmin}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
          >
            ← Return to Client App
          </button>
        </div>
      </div>

      {/* Admin Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <div className="text-xs font-medium text-slate-400">Pending Verifications</div>
          <div className="text-2xl font-bold text-amber-400 mt-1">{pendingDocs.length} Queue</div>
          <div className="text-[11px] text-slate-500 mt-0.5">NIC & Land Titles</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <div className="text-xs font-medium text-slate-400">Active Disputes</div>
          <div className="text-2xl font-bold text-rose-400 mt-1">{openExceptions.length} Open</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Attendance / wages</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <div className="text-xs font-medium text-slate-400">Total Audit Logs</div>
          <div className="text-2xl font-bold text-purple-400 mt-1">{state.auditLogs.length} Events</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Immutable records</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <div className="text-xs font-medium text-slate-400">Active Scoring Rule</div>
          <div className="text-2xl font-bold text-emerald-400 mt-1 font-mono">{state.scoringRule.version}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Frozen until Oct 2026</div>
        </div>
      </div>

      {/* Admin Tabs */}
      <div className="border-b border-slate-800 flex items-center space-x-2">
        <button
          onClick={() => setAdminTab('verifications')}
          className={`pb-3 px-4 text-xs font-semibold flex items-center space-x-2 border-b-2 transition ${
            adminTab === 'verifications' 
              ? 'border-purple-500 text-purple-300' 
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <UserCheck className="w-4 h-4" />
          <span>Identity Verification Queue ({totalPendingVerifications})</span>
        </button>

        <button
          onClick={() => setAdminTab('exceptions')}
          className={`pb-3 px-4 text-xs font-semibold flex items-center space-x-2 border-b-2 transition ${
            adminTab === 'exceptions' 
              ? 'border-purple-500 text-purple-300' 
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Scale className="w-4 h-4 text-rose-400" />
          <span>Exception & Dispute Desk ({openExceptions.length})</span>
        </button>

        <button
          onClick={() => setAdminTab('audit')}
          className={`pb-3 px-4 text-xs font-semibold flex items-center space-x-2 border-b-2 transition ${
            adminTab === 'audit' 
              ? 'border-purple-500 text-purple-300' 
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <History className="w-4 h-4 text-slate-400" />
          <span>Immutable Audit Logs ({state.auditLogs.length})</span>
        </button>

        <button
          onClick={() => setAdminTab('trust_rules')}
          className={`pb-3 px-4 text-xs font-semibold flex items-center space-x-2 border-b-2 transition ${
            adminTab === 'trust_rules' 
              ? 'border-purple-500 text-purple-300' 
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Sliders className="w-4 h-4 text-emerald-400" />
          <span>Trust Score Rule Engine</span>
        </button>
      </div>

      {/* Tab 1: Identity Verification Queue */}
      {adminTab === 'verifications' && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
            <h3 className="text-base font-bold text-white flex items-center space-x-2">
              <UserCheck className="w-5 h-5 text-purple-400" />
              <span>National Identity Card (NIC) & KYC Review Desk</span>
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Verify Sri Lankan National Identity Cards with dual Front and Back side image inspection against Department of Registration standards. Approval automatically awards the <strong className="text-emerald-400">NIC: Verified</strong> badge and adds +0.25 to the user's trust score.
            </p>
          </div>

          {/* Section 1: NIC Submissions (Front & Back Attachments) */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-purple-300 flex items-center space-x-2">
                <Camera className="w-4 h-4" />
                <span>NIC Submissions Queue ({nicSubmissions.length} Total • {pendingNicSubmissions.length} Pending)</span>
              </h4>
              <span className="text-[11px] text-slate-500">Live Firestore Synchronized</span>
            </div>

            {nicSubmissions.length === 0 ? (
              <div className="p-8 text-center bg-slate-900 border border-slate-800 rounded-2xl text-xs text-slate-500">
                No NIC submissions found in the queue.
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
                            {sub.status}
                          </span>
                          <span className="text-xs font-mono text-slate-400">ID: {sub.id}</span>
                          <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-300 capitalize">
                            {sub.role}
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
                        <div className="text-slate-400">NIC Number:</div>
                        <div className="font-mono font-bold text-emerald-400 text-sm bg-slate-950 px-2.5 py-0.5 rounded border border-slate-800 inline-block mt-0.5">
                          {sub.nic_number}
                        </div>
                      </div>
                    </div>

                    {/* Parsed NIC Verification Details */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs bg-slate-950 p-3 rounded-xl border border-slate-800/80">
                      <div>
                        <div className="text-[10px] uppercase text-slate-500 font-bold">NIC Format</div>
                        <div className="text-white font-medium mt-0.5">
                          {sub.nic_format === 'OLD_9V' ? '9-Digit + V/X' : '12-Digit Smart'}
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] uppercase text-slate-500 font-bold">Est. Date of Birth</div>
                        <div className="text-white font-medium mt-0.5">{sub.dob || 'Extracted'}</div>
                      </div>
                      <div>
                        <div className="text-[10px] uppercase text-slate-500 font-bold">Gender</div>
                        <div className="text-white font-medium mt-0.5">{sub.gender || 'Not specified'}</div>
                      </div>
                      <div>
                        <div className="text-[10px] uppercase text-slate-500 font-bold">Submitted Date</div>
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
                          <span className="text-emerald-400">FRONT SIDE (Photo, Name & Number)</span>
                          <span className="font-mono text-slate-500 text-[10px]">{sub.front_file_name}</span>
                        </div>
                        <div className="relative rounded-xl overflow-hidden border border-slate-800 bg-slate-950 aspect-[1.58/1] flex items-center justify-center group shadow-inner">
                          <img 
                            src={sub.front_image_url} 
                            alt={`${sub.user_name} NIC Front`}
                            className="w-full h-full object-cover transition duration-200 group-hover:scale-105"
                          />
                          <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2">
                            <button
                              onClick={() => setZoomImage({ url: sub.front_image_url, title: `${sub.user_name} - NIC Front Side`, side: 'Front' })}
                              className="px-3 py-1.5 rounded-lg bg-white/90 hover:bg-white text-slate-900 text-xs font-bold shadow-lg flex items-center space-x-1.5"
                            >
                              <Maximize2 className="w-3.5 h-3.5" />
                              <span>Inspect Front Side</span>
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Back Card Attachment */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-[11px] font-semibold text-slate-300">
                          <span className="text-blue-400">BACK SIDE (Address, Stamp & Barcode)</span>
                          <span className="font-mono text-slate-500 text-[10px]">{sub.back_file_name}</span>
                        </div>
                        <div className="relative rounded-xl overflow-hidden border border-slate-800 bg-slate-950 aspect-[1.58/1] flex items-center justify-center group shadow-inner">
                          <img 
                            src={sub.back_image_url} 
                            alt={`${sub.user_name} NIC Back`}
                            className="w-full h-full object-cover transition duration-200 group-hover:scale-105"
                          />
                          <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2">
                            <button
                              onClick={() => setZoomImage({ url: sub.back_image_url, title: `${sub.user_name} - NIC Back Side`, side: 'Back' })}
                              className="px-3 py-1.5 rounded-lg bg-white/90 hover:bg-white text-slate-900 text-xs font-bold shadow-lg flex items-center space-x-1.5"
                            >
                              <Maximize2 className="w-3.5 h-3.5" />
                              <span>Inspect Back Side</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {sub.notes && (
                      <p className="text-xs text-slate-400 italic bg-slate-950/50 p-2.5 rounded-lg border border-slate-800/60">
                        User Notes: "{sub.notes}"
                      </p>
                    )}

                    {/* Admin Action Controls */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-slate-800">
                      {isPending ? (
                        <>
                          <div className="text-xs text-slate-400 flex items-center space-x-1.5">
                            <Clock className="w-4 h-4 text-amber-400 animate-pulse" />
                            <span>Awaiting Staff Adjudication</span>
                          </div>
                          <div className="flex items-center space-x-2.5">
                            <button
                              onClick={() => handleRejectNic(sub.id)}
                              className="px-3.5 py-2 rounded-xl bg-rose-950/80 hover:bg-rose-900 text-rose-300 border border-rose-800 text-xs font-semibold shadow-sm flex items-center space-x-1.5 transition"
                            >
                              <XCircle className="w-4 h-4" />
                              <span>Reject with Reason</span>
                            </button>
                            <button
                              onClick={() => handleApproveNic(sub.id)}
                              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md flex items-center space-x-1.5 transition"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                              <span>Approve NIC & Grant Verified Badge (+0.25)</span>
                            </button>
                          </div>
                        </>
                      ) : (
                        <div className="text-xs text-slate-400 flex items-center justify-between w-full">
                          <span>
                            Reviewed by <strong className="text-slate-200">{sub.reviewed_by || 'Admin Officer'}</strong> on {new Date(sub.reviewed_at || Date.now()).toLocaleDateString()}
                          </span>
                          {sub.rejection_reason && (
                            <span className="text-rose-400 italic">Rejection Reason: {sub.rejection_reason}</span>
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
              General Supporting Documents & Deeds ({pendingDocs.length} Pending)
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
                        {doc.status}
                      </span>
                      <span className="text-xs text-slate-400">Doc ID: {doc.id}</span>
                    </div>

                    <h4 className="text-sm font-bold text-white mt-1.5">{doc.user_name} ({doc.role.toUpperCase()})</h4>
                    <p className="text-xs text-slate-400">
                      Phone: <span className="font-mono text-slate-300">{doc.user_phone}</span> • Type: <strong className="text-slate-200">{doc.doc_type.replace(/_/g, ' ')}</strong>
                    </p>
                    <p className="text-[11px] text-slate-500 font-mono mt-0.5">Reference: {doc.blob_ref}</p>
                    {doc.notes && <p className="text-xs text-slate-400 mt-1 italic">Notes: {doc.notes}</p>}
                  </div>

                  <div className="flex items-center space-x-3">
                    {isPending ? (
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleApproveDoc(doc.id)}
                          className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md flex items-center space-x-1.5"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Approve Doc</span>
                        </button>
                        <button
                          onClick={() => handleRejectDoc(doc.id)}
                          className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow-md flex items-center space-x-1.5"
                        >
                          <XCircle className="w-4 h-4" />
                          <span>Reject</span>
                        </button>
                      </div>
                    ) : (
                      <div className="text-xs text-slate-500">
                        Reviewed by {doc.reviewed_by || 'Admin'} on {doc.reviewed_at?.split('T')[0]}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab 2: Exceptions & Disputes */}
      {adminTab === 'exceptions' && (
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
            <h3 className="text-base font-bold text-white flex items-center space-x-2">
              <Scale className="w-5 h-5 text-rose-400" />
              <span>Frozen Exception & Dispute Cases</span>
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Dual-confirmation mismatches freeze the job state until resolved by a Coconnect staff officer. Response deadline enforcement prevents endless lock-ins.
            </p>
          </div>

          <div className="space-y-4">
            {state.exceptions.map((exc) => {
              const job = state.jobs.find(j => j.id === exc.job_id);

              return (
                <div key={exc.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
                  <div className="flex items-start justify-between border-b border-slate-800 pb-3">
                    <div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                        exc.status === 'resolved' ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' :
                        'bg-rose-950 text-rose-300 border border-rose-800'
                      }`}>
                        Dispute: {exc.status}
                      </span>
                      <h4 className="text-sm font-bold text-white mt-1.5">
                        {exc.reason_code.replace(/_/g, ' ')} on {job?.task_type}
                      </h4>
                      <p className="text-xs text-slate-400">
                        Raised by: <strong className="text-slate-200">{exc.raised_by_name}</strong> • Subject: {exc.subject_type} (#{exc.subject_id})
                      </p>
                    </div>

                    <div className="text-right text-xs">
                      <span className="text-slate-400">Deadline:</span>
                      <div className="font-mono text-rose-400 font-semibold">{exc.response_deadline.split('T')[0]}</div>
                    </div>
                  </div>

                  <p className="text-xs text-slate-300 bg-slate-950 p-3 rounded-xl border border-slate-800">
                    "{exc.description}"
                  </p>

                  {exc.status !== 'resolved' ? (
                    <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <input
                        type="text"
                        value={resolutionNotes}
                        onChange={(e) => setResolutionNotes(e.target.value)}
                        placeholder="Resolution statement..."
                        className="w-full sm:w-2/3 px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs"
                      />
                      <button
                        onClick={() => handleResolveException(exc.id)}
                        className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md whitespace-nowrap"
                      >
                        Resolve Dispute & Advance Job
                      </button>
                    </div>
                  ) : (
                    <div className="p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-800 text-emerald-300 text-xs">
                      Resolution: {exc.resolution} (Resolved by {exc.resolved_by})
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab 3: Immutable Audit Log */}
      {adminTab === 'audit' && (
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
            <h3 className="text-base font-bold text-white flex items-center space-x-2">
              <History className="w-5 h-5 text-slate-400" />
              <span>Section 4.1 Immutable System Audit Trail</span>
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Append-only audit log tracking every transition, escrow fund allocation, contact reveal, and PIN confirmation.
            </p>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
            <div className="divide-y divide-slate-800 max-h-[600px] overflow-y-auto font-mono text-xs">
              {state.auditLogs.map((log) => (
                <div key={log.id} className="p-3.5 hover:bg-slate-850 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="space-y-0.5">
                    <div className="flex items-center space-x-2">
                      <span className="text-purple-400 font-bold">[{log.action}]</span>
                      <span className="text-slate-300 font-semibold">{log.actor_name}</span>
                      <span className="text-slate-500 text-[10px]">({log.subject_type})</span>
                    </div>
                    <div className="text-slate-400 text-[11px] font-sans">{log.details}</div>
                  </div>
                  <div className="text-[10px] text-slate-500 whitespace-nowrap">
                    {new Date(log.at).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Trust Score Rule Engine */}
      {adminTab === 'trust_rules' && (
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
            <h3 className="text-base font-bold text-white flex items-center space-x-2">
              <Sliders className="w-5 h-5 text-emerald-400" />
              <span>Versioned Trust Score Engine (Section 5.5)</span>
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              The rules and weights are held stable for 90 days. Every snapshot stores rule_version so historical records remain auditable without retroactive rewriting.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-3 text-xs">
              <div className="font-bold text-white text-sm">Active Formula Weights ({state.scoringRule.version})</div>
              
              <div className="flex justify-between p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-slate-400">Post-Job Star Ratings:</span>
                <span className="font-bold text-amber-400 font-mono">{(state.scoringRule.weights.ratings * 100).toFixed(0)}%</span>
              </div>

              <div className="flex justify-between p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-slate-400">Job Completion Reliability:</span>
                <span className="font-bold text-emerald-400 font-mono">{(state.scoringRule.weights.completion_rate * 100).toFixed(0)}%</span>
              </div>

              <div className="flex justify-between p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-slate-400">Verified NIC Identity Bonus:</span>
                <span className="font-bold text-teal-400 font-mono">{(state.scoringRule.weights.verification_bonus * 100).toFixed(0)}%</span>
              </div>

              <div className="flex justify-between p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-slate-400">Dispute Penalty:</span>
                <span className="font-bold text-rose-400 font-mono">{(state.scoringRule.weights.dispute_penalty * 100).toFixed(0)}%</span>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-3 text-xs">
              <div className="font-bold text-white text-sm">Trust Score Bands & Restrictions</div>
              
              <div className="flex justify-between p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-emerald-400 font-semibold">Elite Tier:</span>
                <span className="text-white font-mono">&ge; {state.scoringRule.bands.elite.toFixed(2)} (Priority Award recommendations)</span>
              </div>

              <div className="flex justify-between p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-teal-400 font-semibold">Trusted Tier:</span>
                <span className="text-white font-mono">&ge; {state.scoringRule.bands.trusted.toFixed(2)} (Standard bidding privileges)</span>
              </div>

              <div className="flex justify-between p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-amber-400 font-semibold">Standard Tier:</span>
                <span className="text-white font-mono">&ge; {state.scoringRule.bands.standard.toFixed(2)} (New accounts)</span>
              </div>

              <div className="flex justify-between p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-rose-400 font-semibold">Restricted Tier:</span>
                <span className="text-white font-mono">&lt; {state.scoringRule.bands.restricted.toFixed(2)} (Bidding suspended pending review)</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Full Resolution NIC Card Image Zoom Modal */}
      {zoomImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <span className={`text-xs px-2.5 py-0.5 rounded font-bold uppercase ${
                  zoomImage.side === 'Front' ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'bg-blue-950 text-blue-300 border border-blue-800'
                }`}>
                  {zoomImage.side} Side Inspector
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
              <span>Inspect photo, stamp, serial number, and security hologram.</span>
              <button
                onClick={() => setZoomImage(null)}
                className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
