import React, { useState } from 'react';
import { store, AppState } from '../../lib/store';
import { Language, translations } from '../../lib/i18n';
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
  UserCheck
} from 'lucide-react';

interface UserProfilePageProps {
  state: AppState;
  currentLang: Language;
}

export const UserProfilePage: React.FC<UserProfilePageProps> = ({
  state,
  currentLang,
}) => {
  const t = translations[currentLang];
  const user = state.currentUser;
  
  // Verification upload state
  const [docType, setDocType] = useState<'NIC_FRONT' | 'NIC_BACK' | 'LAND_DEED' | 'BUSINESS_REG'>('NIC_FRONT');
  const [fileName, setFileName] = useState<string>('nic_scan_photo.jpg');
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);

  if (!user) {
    return (
      <div className="p-8 text-center text-slate-400">
        Please log in to view profile.
      </div>
    );
  }

  const userDocs = state.verificationDocs.filter(d => d.user_id === user.id);
  const userRatings = state.ratings.filter(r => r.to_user_id === user.id);

  const handleUploadDoc = (e: React.FormEvent) => {
    e.preventDefault();
    store.uploadVerificationDoc(docType, fileName);
    setUploadSuccess(`Uploaded ${docType.replace(/_/g, ' ')} successfully. Status changed to Pending Officer Review.`);
    setTimeout(() => setUploadSuccess(null), 5000);
  };

  const getNicBadge = (status: string) => {
    switch (status) {
      case 'verified':
        return { label: 'Verified', color: 'bg-emerald-950 text-emerald-300 border-emerald-800' };
      case 'pending':
        return { label: 'Pending Officer Review', color: 'bg-amber-950 text-amber-300 border-amber-800' };
      case 'rejected':
        return { label: 'Rejected (Re-upload needed)', color: 'bg-rose-950 text-rose-300 border-rose-800' };
      default:
        return { label: 'Unverified', color: 'bg-slate-800 text-slate-300 border-slate-700' };
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
                NIC: {nicBadge.label}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1 flex items-center space-x-2">
              <Phone className="w-3.5 h-3.5 text-slate-500" />
              <span className="font-mono text-slate-300">{user.phone}</span>
              <span>•</span>
              <span className="capitalize text-slate-300">Active: {user.active_role}</span>
            </p>
          </div>
        </div>

        {/* Trust Score Display Card */}
        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex items-center space-x-4 self-start sm:self-auto">
          <div>
            <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Coconnect Trust Score</div>
            <div className="text-2xl font-bold text-emerald-400 font-mono flex items-center space-x-1.5 mt-0.5">
              <Star className="w-5 h-5 fill-current text-amber-400" />
              <span>{user.trust_score.toFixed(2)} / 5.0</span>
            </div>
          </div>
          <div className="text-[10px] text-slate-500 font-mono">
            Rule: {state.scoringRule.version}
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
              <span>Multi-Role Management</span>
            </h3>
            <span className="text-[11px] text-slate-400">Section 6 RBAC</span>
          </div>

          <p className="text-xs text-slate-400">
            Coconnect allows a single verified user to hold multiple roles (e.g. an Owner acting as a Supervisor). The token carries your active role.
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
                    <span className="capitalize">{r === 'owner' ? 'Landowner' : r === 'supervisor' ? 'Labour Broker / Supervisor' : 'Agricultural Worker'}</span>
                  </div>

                  <div>
                    {isActive ? (
                      <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-900 text-emerald-300 border border-emerald-700">
                        Active Role
                      </span>
                    ) : (
                      <button
                        onClick={() => store.switchRole(r)}
                        className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition"
                      >
                        Switch →
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
              <span>Trust Score Formula Breakdown</span>
            </h3>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-amber-300 border border-slate-700">
              Frozen 90-Days
            </span>
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="flex justify-between items-center p-2 rounded-lg bg-slate-950 border border-slate-800/80">
              <span className="text-slate-400">Ratings Weight (40%)</span>
              <span className="text-amber-400 font-mono font-bold">
                {userRatings.length > 0 ? (userRatings.reduce((s, r) => s + r.score, 0) / userRatings.length).toFixed(2) : '4.80'} / 5.0
              </span>
            </div>

            <div className="flex justify-between items-center p-2 rounded-lg bg-slate-950 border border-slate-800/80">
              <span className="text-slate-400">Completion Rate (35%)</span>
              <span className="text-emerald-400 font-mono font-bold">100% (No abandons)</span>
            </div>

            <div className="flex justify-between items-center p-2 rounded-lg bg-slate-950 border border-slate-800/80">
              <span className="text-slate-400">NIC Identity Bonus (15%)</span>
              <span className="text-teal-400 font-mono font-bold">
                {user.nic_status === 'verified' ? '+0.25 Applied' : 'Pending Verification'}
              </span>
            </div>

            <div className="flex justify-between items-center p-2 rounded-lg bg-slate-950 border border-slate-800/80">
              <span className="text-slate-400">Dispute Deductions (10%)</span>
              <span className="text-slate-300 font-mono font-bold">0.0 (Clean record)</span>
            </div>
          </div>
        </div>

      </div>

      {/* Identity Verification Document Upload Form (POST /users/me/verification) */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 text-white font-bold text-base">
            <FileText className="w-5 h-5 text-emerald-400" />
            <span>Upload Verification Documents (POST /users/me/verification)</span>
          </div>
          <span className="text-xs text-slate-400">Admin Queue Reviewed</span>
        </div>

        <p className="text-xs text-slate-400">
          Upload National Identity Card (NIC) scans, Land Titles, or Business Registration. All uploads are stored in Azure private containers and reviewed exclusively by Coconnect administrative staff.
        </p>

        {uploadSuccess && (
          <div className="p-3.5 rounded-xl bg-emerald-950/70 border border-emerald-800 text-emerald-200 text-xs flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>{uploadSuccess}</span>
          </div>
        )}

        <form onSubmit={handleUploadDoc} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-[11px] font-semibold text-slate-300 mb-1">Document Type</label>
            <select
              value={docType}
              onChange={(e) => setDocType(e.target.value as any)}
              className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs"
            >
              <option value="NIC_FRONT">NIC Card (Front Photo)</option>
              <option value="NIC_BACK">NIC Card (Back Photo)</option>
              <option value="LAND_DEED">Estate Land Deed / Title</option>
              <option value="BUSINESS_REG">Labour Contractor Business Reg</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-300 mb-1">File Attachment (Simulated SAS)</label>
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
              <span>Submit for Verification</span>
            </button>
          </div>
        </form>

        {/* Existing uploaded documents */}
        <div className="pt-4 border-t border-slate-800">
          <div className="text-xs font-semibold text-slate-300 mb-2">My Submitted Documents:</div>
          <div className="space-y-2">
            {userDocs.length === 0 ? (
              <p className="text-xs text-slate-500 italic">No documents uploaded yet.</p>
            ) : (
              userDocs.map((doc) => (
                <div key={doc.id} className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs">
                  <div>
                    <div className="font-semibold text-white">{doc.doc_type.replace(/_/g, ' ')}</div>
                    <div className="text-[11px] text-slate-500 font-mono">{doc.blob_ref}</div>
                    {doc.notes && <div className="text-[11px] text-slate-400 mt-0.5">{doc.notes}</div>}
                  </div>

                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                    doc.status === 'approved' ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' :
                    doc.status === 'rejected' ? 'bg-rose-950 text-rose-300 border border-rose-800' :
                    'bg-amber-950 text-amber-300 border border-amber-800'
                  }`}>
                    {doc.status}
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
          <span>Performance Ratings & Reviews Received ({userRatings.length})</span>
        </h3>

        {userRatings.length === 0 ? (
          <p className="text-xs text-slate-500 italic">No ratings received yet. Ratings are submitted during job dual-confirmation.</p>
        ) : (
          <div className="space-y-3">
            {userRatings.map((rate) => (
              <div key={rate.id} className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="font-semibold text-white">Review by {rate.from_name}</div>
                  <div className="flex items-center text-amber-400 font-bold">
                    ⭐ {rate.score} / 5 Stars
                  </div>
                </div>
                <div className="flex flex-wrap gap-1">
                  {rate.review_tags.map((tag, idx) => (
                    <span key={idx} className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                      {tag}
                    </span>
                  ))}
                </div>
                <p className="text-slate-300 italic pt-1">"{rate.comment}"</p>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};
