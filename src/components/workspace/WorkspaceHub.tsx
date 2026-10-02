import React, { useState, useEffect } from 'react';
import { useT } from '../../config/CategoryContext';
import { AppState, store } from '../../lib/store';
import { 
  googleSignIn, 
  googleSignOut, 
  getAccessToken, 
  initAuth,
  auth 
} from '../../lib/firebase';
import { 
  listDriveFiles, 
  uploadFileToDrive, 
  deleteDriveFile,
  DriveFileItem
} from '../../lib/workspaceApi';
import { 
  HardDrive, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  FileText, 
  Plus, 
  Trash2, 
  ExternalLink, 
  RefreshCw, 
  Database, 
  ShieldCheck, 
  FolderSync, 
  ArrowUpRight,
  Download,
  Lock
} from 'lucide-react';
import { User } from 'firebase/auth';
import { Language, fmt } from '../../lib/i18n';

interface WorkspaceHubProps {
  state: AppState;
  currentLang: Language;
}

export const WorkspaceHub: React.FC<WorkspaceHubProps> = ({ state, currentLang }) => {
  const t = useT(currentLang);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Drive State
  const [driveFiles, setDriveFiles] = useState<DriveFileItem[]>([]);
  const [isLoadingDrive, setIsLoadingDrive] = useState(false);
  const [backupSuccessMessage, setBackupSuccessMessage] = useState<string | null>(null);

  // Confirmation Modal State
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    actionLabel: string;
    onConfirm: () => Promise<void>;
  }>({
    isOpen: false,
    title: '',
    description: '',
    actionLabel: '',
    onConfirm: async () => {},
  });

  // Track auth state
  useEffect(() => {
    const unsubscribe = initAuth(
      (user, token) => {
        setCurrentUser(user);
        setAccessToken(token);
      },
      () => {
        setCurrentUser(null);
        setAccessToken(null);
      }
    );
    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, []);

  // Fetch Drive files when token is available
  useEffect(() => {
    if (accessToken) {
      loadDriveFiles(accessToken);
    }
  }, [accessToken]);

  const handleSignIn = async () => {
    setIsLoadingAuth(true);
    setAuthError(null);
    try {
      const res = await googleSignIn();
      if (res) {
        setCurrentUser(res.user);
        setAccessToken(res.accessToken);
        await loadDriveFiles(res.accessToken);
      }
    } catch (err: any) {
      console.error('Sign-in error:', err);
      setAuthError(err.message || t.ws_err_auth);
    } finally {
      setIsLoadingAuth(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await googleSignOut();
      setCurrentUser(null);
      setAccessToken(null);
      setDriveFiles([]);
    } catch (err: any) {
      console.error('Sign-out error:', err);
    }
  };

  const loadDriveFiles = async (token: string) => {
    setIsLoadingDrive(true);
    try {
      const files = await listDriveFiles(token);
      setDriveFiles(files);
    } catch (err: any) {
      console.error('Load Drive files error:', err);
    } finally {
      setIsLoadingDrive(false);
    }
  };

  // Backup Labour Contracts to Google Drive
  const handleBackupLabourContracts = async () => {
    if (!accessToken) return;
    setIsLoadingDrive(true);
    try {
      const content = JSON.stringify(
        {
          generated_at: new Date().toISOString(),
          platform: 'Coconnect Coconut Labour Hiring Platform',
          contracts: state.awards.map((a) => {
            const job = state.jobs.find((j) => j.id === a.job_id);
            return {
              award_id: a.id,
              job_id: a.job_id,
              task_type: job?.task_type,
              estate_name: job?.estate_name,
              supervisor_name: a.supervisor_name,
              escrow_amount_lkr: a.escrow_amount,
              escrow_status: a.escrow_status,
              fee_payment_ref: a.fee_payment_ref,
              awarded_at: a.awarded_at,
            };
          }),
        },
        null,
        2
      );

      const filename = `Coconnect_Labour_Agreements_${new Date().toISOString().split('T')[0]}.json`;
      await uploadFileToDrive(accessToken, filename, content, 'application/json');
      await loadDriveFiles(accessToken);
      setBackupSuccessMessage(fmt(t.ws_backup_success, { file: filename }));
      setTimeout(() => setBackupSuccessMessage(null), 5000);
    } catch (err: any) {
      console.error('Export error:', err);
      setAuthError(err.message || t.ws_err_contracts);
    } finally {
      setIsLoadingDrive(false);
    }
  };

  // Backup Land Registry & Estates to Google Drive
  const handleBackupEstates = async () => {
    if (!accessToken) return;
    setIsLoadingDrive(true);
    try {
      const content = JSON.stringify(
        {
          generated_at: new Date().toISOString(),
          owner_name: state.currentUser?.name,
          owner_phone: state.currentUser?.phone,
          estates: state.estates.map((e) => ({
            id: e.id,
            name: e.name,
            area_acres: e.area_acres,
            location: e.location,
            tree_count: e.tree_count,
            coordinates: { lat: e.lat, lng: e.lng },
            notes: e.notes,
            created_at: e.created_at,
          })),
        },
        null,
        2
      );

      const filename = `Coconnect_Estate_Registry_${new Date().toISOString().split('T')[0]}.json`;
      await uploadFileToDrive(accessToken, filename, content, 'application/json');
      await loadDriveFiles(accessToken);
      setBackupSuccessMessage(fmt(t.ws_backup_success, { file: filename }));
      setTimeout(() => setBackupSuccessMessage(null), 5000);
    } catch (err: any) {
      console.error('Export error:', err);
      setAuthError(err.message || t.ws_err_estates);
    } finally {
      setIsLoadingDrive(false);
    }
  };

  // Backup NIC Verification Records to Google Drive
  const handleBackupNicRecords = async () => {
    if (!accessToken) return;
    setIsLoadingDrive(true);
    try {
      const content = JSON.stringify(
        {
          exported_at: new Date().toISOString(),
          system: 'Coconnect KYC & Identity Verification Registry',
          total_submissions: state.nicSubmissions?.length || 0,
          submissions: (state.nicSubmissions || []).map((sub) => ({
            id: sub.id,
            user_name: sub.user_name,
            user_phone: sub.user_phone,
            role: sub.role,
            nic_number: sub.nic_number,
            nic_format: sub.nic_format,
            gender: sub.gender,
            dob: sub.dob,
            status: sub.status,
            submitted_at: sub.submitted_at,
            reviewed_at: sub.reviewed_at,
            reviewed_by: sub.reviewed_by
          })),
        },
        null,
        2
      );

      const filename = `Coconnect_NIC_KYC_Records_${new Date().toISOString().split('T')[0]}.json`;
      await uploadFileToDrive(accessToken, filename, content, 'application/json');
      await loadDriveFiles(accessToken);
      setBackupSuccessMessage(fmt(t.ws_backup_success, { file: filename }));
      setTimeout(() => setBackupSuccessMessage(null), 5000);
    } catch (err: any) {
      console.error('Export error:', err);
      setAuthError(err.message || t.ws_err_nic);
    } finally {
      setIsLoadingDrive(false);
    }
  };

  const handleDeleteDriveFilePrompt = (file: DriveFileItem) => {
    setConfirmDialog({
      isOpen: true,
      title: t.ws_delete_title,
      description: fmt(t.ws_delete_desc, { name: file.name }),
      actionLabel: t.ws_delete_action,
      onConfirm: async () => {
        if (!accessToken) return;
        await deleteDriveFile(accessToken, file.id);
        await loadDriveFiles(accessToken);
        setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
      },
    });
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
            <HardDrive className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl font-bold text-white">{t.ws_title}</h1>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-950 text-blue-300 font-medium border border-blue-800">
                {t.ws_badge}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              {t.ws_sub}
            </p>
          </div>
        </div>

        {/* Auth Status & Connect Button */}
        <div className="flex items-center space-x-3">
          {currentUser ? (
            <div className="flex items-center space-x-3 bg-slate-950/80 px-4 py-2 rounded-xl border border-slate-800">
              <div className="w-8 h-8 rounded-full bg-emerald-700 text-white flex items-center justify-center text-xs font-bold">
                {currentUser.displayName?.charAt(0) || currentUser.email?.charAt(0) || 'U'}
              </div>
              <div className="text-left hidden sm:block">
                <div className="text-xs font-semibold text-white leading-tight">
                  {currentUser.displayName || t.ws_google_account}
                </div>
                <div className="text-[10px] text-slate-400 leading-tight">
                  {currentUser.email}
                </div>
              </div>
              <button
                onClick={handleSignOut}
                className="text-xs text-slate-400 hover:text-white px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 transition"
              >
                {t.ws_disconnect}
              </button>
            </div>
          ) : (
            <button
              onClick={handleSignIn}
              disabled={isLoadingAuth}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md transition flex items-center space-x-2 disabled:opacity-50"
            >
              <HardDrive className="w-4 h-4" />
              <span>{isLoadingAuth ? t.ws_connecting : t.ws_connect}</span>
            </button>
          )}
        </div>
      </div>

      {authError && (
        <div className="p-4 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-200 text-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{authError}</span>
        </div>
      )}

      {backupSuccessMessage && (
        <div className="p-4 rounded-xl bg-emerald-950/60 border border-emerald-800 text-emerald-200 text-xs flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{backupSuccessMessage}</span>
        </div>
      )}

      {/* Cloud Firestore & Google Drive Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>{t.ws_card_firestore}</span>
            <Database className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-base font-bold text-white flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>{t.ws_firestore_active}</span>
          </div>
          <p className="text-[11px] text-slate-400">
            {t.ws_firestore_desc}
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>{t.ws_card_drive}</span>
            <HardDrive className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-base font-bold text-white flex items-center space-x-2">
            <span className={`w-2.5 h-2.5 rounded-full ${currentUser ? 'bg-blue-500' : 'bg-slate-600'}`}></span>
            <span>{currentUser ? fmt(t.ws_synced_files, { n: driveFiles.length }) : t.ws_requires_connection}</span>
          </div>
          <p className="text-[11px] text-slate-400">
            {t.ws_drive_desc}
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>{t.ws_card_nic}</span>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-base font-bold text-white">
            {state.nicSubmissions?.length || 0} {t.ws_submissions}
          </div>
          <p className="text-[11px] text-slate-400">
            {t.ws_nic_desc}
          </p>
        </div>
      </div>

      {/* Main Drive Sync & Management Console */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div>
            <h2 className="text-base font-bold text-white flex items-center space-x-2">
              <HardDrive className="w-5 h-5 text-blue-400" />
              <span>{t.ws_console_title}</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              {t.ws_console_sub}
            </p>
          </div>

          {currentUser && (
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={handleBackupLabourContracts}
                disabled={isLoadingDrive}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center space-x-1.5 transition border border-slate-700 disabled:opacity-50"
              >
                <Download className="w-3.5 h-3.5 text-blue-400" />
                <span>{t.ws_export_agreements} ({state.awards.length})</span>
              </button>
              <button
                onClick={handleBackupEstates}
                disabled={isLoadingDrive}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center space-x-1.5 transition border border-slate-700 disabled:opacity-50"
              >
                <Download className="w-3.5 h-3.5 text-emerald-400" />
                <span>{t.ws_export_estates} ({state.estates.length})</span>
              </button>
              <button
                onClick={handleBackupNicRecords}
                disabled={isLoadingDrive}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center space-x-1.5 transition border border-slate-700 disabled:opacity-50"
              >
                <Download className="w-3.5 h-3.5 text-purple-400" />
                <span>{t.ws_export_nic} ({state.nicSubmissions?.length || 0})</span>
              </button>
              <button
                onClick={() => accessToken && loadDriveFiles(accessToken)}
                disabled={isLoadingDrive}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
                title={t.ws_refresh_title}
              >
                <RefreshCw className={`w-4 h-4 ${isLoadingDrive ? 'animate-spin' : ''}`} />
              </button>
            </div>
          )}
        </div>

        {!currentUser ? (
          <div className="py-12 text-center max-w-md mx-auto space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-blue-950/60 border border-blue-800/80 text-blue-400 flex items-center justify-center mx-auto">
              <HardDrive className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-white">{t.ws_connect}</h3>
            <p className="text-xs text-slate-400">
              {t.ws_connect_desc}
            </p>
            <button
              onClick={handleSignIn}
              disabled={isLoadingAuth}
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs shadow-lg shadow-blue-500/20 transition inline-flex items-center space-x-2"
            >
              <HardDrive className="w-4 h-4" />
              <span>{isLoadingAuth ? t.ws_opening_auth : t.ws_connect_with}</span>
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>{t.ws_files_label}</span>
              <span>{fmt(t.ws_files_found, { n: driveFiles.length })}</span>
            </div>

            {isLoadingDrive ? (
              <div className="py-12 text-center text-xs text-slate-400 flex items-center justify-center space-x-2">
                <RefreshCw className="w-4 h-4 animate-spin text-blue-400" />
                <span>{t.ws_loading_files}</span>
              </div>
            ) : driveFiles.length === 0 ? (
              <div className="p-8 text-center bg-slate-950/40 rounded-xl border border-slate-800/80 text-xs text-slate-500">
                {t.ws_no_files}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {driveFiles.map((file) => (
                  <div
                    key={file.id}
                    className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-3 text-xs hover:border-slate-700 transition"
                  >
                    <div className="flex items-center space-x-3 overflow-hidden">
                      <div className="w-8 h-8 rounded-lg bg-blue-950 text-blue-400 flex items-center justify-center shrink-0">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div className="overflow-hidden">
                        <div className="font-semibold text-white truncate" title={file.name}>
                          {file.name}
                        </div>
                        <div className="text-[11px] text-slate-400 flex items-center space-x-2">
                          <span>{file.mimeType.split('/').pop()}</span>
                          {file.modifiedTime && (
                            <>
                              <span>•</span>
                              <span>{new Date(file.modifiedTime).toLocaleDateString()}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-1.5 shrink-0">
                      {file.webViewLink && (
                        <a
                          href={file.webViewLink}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition"
                          title={t.ws_open_in_drive}
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}
                      <button
                        onClick={() => handleDeleteDriveFilePrompt(file)}
                        className="p-1.5 rounded-lg bg-slate-800 text-rose-400 hover:text-rose-300 hover:bg-rose-950/50 transition"
                        title={t.ws_delete_file}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Confirmation Dialog (Skill Requirement) */}
      {confirmDialog.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center space-x-3 text-rose-400">
              <AlertCircle className="w-6 h-6" />
              <h3 className="text-base font-bold text-white">{confirmDialog.title}</h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              {confirmDialog.description}
            </p>
            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                onClick={() => setConfirmDialog((prev) => ({ ...prev, isOpen: false }))}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700 transition"
              >
                {t.common_cancel}
              </button>
              <button
                onClick={confirmDialog.onConfirm}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition shadow-md shadow-rose-600/20"
              >
                {confirmDialog.actionLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
