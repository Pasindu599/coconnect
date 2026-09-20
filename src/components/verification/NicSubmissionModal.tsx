import React, { useState, useRef } from 'react';
import { AppState, store } from '../../lib/store';
import { 
  validateAndParseSriLankanNic, 
  getSampleSriLankaNicCard, 
  NicValidationResult 
} from '../../lib/nicValidator';
import { 
  ShieldCheck, 
  Upload, 
  CheckCircle2, 
  AlertCircle, 
  FileText, 
  Image as ImageIcon, 
  X, 
  Clock, 
  Camera, 
  RefreshCw, 
  Sparkles,
  Info,
  ZoomIn
} from 'lucide-react';

interface NicSubmissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  state: AppState;
}

export const NicSubmissionModal: React.FC<NicSubmissionModalProps> = ({
  isOpen,
  onClose,
  state
}) => {
  const currentUser = state.currentUser;
  const userSubmission = state.nicSubmissions?.find(s => s.user_id === currentUser?.id);

  const [nicNumber, setNicNumber] = useState(currentUser?.nic_number || '');
  const [frontImage, setFrontImage] = useState<string | null>(currentUser?.nic_front_url || null);
  const [frontFileName, setFrontFileName] = useState<string>(currentUser?.nic_front_url ? 'nic_front.jpg' : '');
  const [frontFileSizeKb, setFrontFileSizeKb] = useState<number>(240);

  const [backImage, setBackImage] = useState<string | null>(currentUser?.nic_back_url || null);
  const [backFileName, setBackFileName] = useState<string>(currentUser?.nic_back_url ? 'nic_back.jpg' : '');
  const [backFileSizeKb, setBackFileSizeKb] = useState<number>(215);

  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [previewZoomImage, setPreviewZoomImage] = useState<{ url: string; title: string } | null>(null);

  const frontInputRef = useRef<HTMLInputElement>(null);
  const backInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen || !currentUser) return null;

  const validation: NicValidationResult = validateAndParseSriLankanNic(nicNumber);

  // File Upload Handlers (Front)
  const handleFrontFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setErrorMessage('Front image exceeds 10MB limit. Please upload a smaller file.');
      return;
    }

    setFrontFileName(file.name);
    setFrontFileSizeKb(Math.round(file.size / 1024));

    const reader = new FileReader();
    reader.onload = () => {
      setFrontImage(reader.result as string);
      setErrorMessage(null);
    };
    reader.readAsDataURL(file);
  };

  // File Upload Handlers (Back)
  const handleBackFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setErrorMessage('Back image exceeds 10MB limit. Please upload a smaller file.');
      return;
    }

    setBackFileName(file.name);
    setBackFileSizeKb(Math.round(file.size / 1024));

    const reader = new FileReader();
    reader.onload = () => {
      setBackImage(reader.result as string);
      setErrorMessage(null);
    };
    reader.readAsDataURL(file);
  };

  // Quick fill with Sri Lanka Demo Card
  const handleUseDemoCards = () => {
    const demoNic = nicNumber.trim().length >= 9 ? nicNumber.trim() : '198829104928';
    setNicNumber(demoNic);
    setFrontImage(getSampleSriLankaNicCard('FRONT', currentUser.name, demoNic));
    setFrontFileName('demo_sl_nic_front.svg');
    setFrontFileSizeKb(124);

    setBackImage(getSampleSriLankaNicCard('BACK', currentUser.name, demoNic));
    setBackFileName('demo_sl_nic_back.svg');
    setBackFileSizeKb(108);
    setErrorMessage(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!nicNumber.trim()) {
      setErrorMessage('Please enter your National Identity Card (NIC) number.');
      return;
    }

    if (!validation.isValid) {
      setErrorMessage(validation.errorMessage || 'Invalid Sri Lankan NIC number format.');
      return;
    }

    if (!frontImage) {
      setErrorMessage('Please attach the NIC Front End image.');
      return;
    }

    if (!backImage) {
      setErrorMessage('Please attach the NIC Back End image.');
      return;
    }

    setIsSubmitting(true);
    try {
      store.submitNic({
        nic_number: validation.formattedNumber,
        front_image_url: frontImage,
        back_image_url: backImage,
        front_file_name: frontFileName || 'nic_front.jpg',
        back_file_name: backFileName || 'nic_back.jpg',
        front_file_size_kb: frontFileSizeKb,
        back_file_size_kb: backFileSizeKb,
        notes: notes.trim() || undefined
      });

      setIsSubmitting(false);
      setSubmitSuccess(true);
      setTimeout(() => {
        setSubmitSuccess(false);
        onClose();
      }, 1600);
    } catch (err: any) {
      setIsSubmitting(false);
      setErrorMessage(err.message || 'Failed to submit NIC documents');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="bg-slate-900 text-white px-6 py-5 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                Submit National Identity Card (NIC)
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-medium border border-emerald-500/30">
                  KYC Verified Level 2
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Attach Front & Back sides for Sri Lankan identity authentication & escrow trust score
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Existing Status Banner if already submitted */}
        {currentUser.nic_status === 'verified' && (
          <div className="mx-6 mt-4 p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-start space-x-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-emerald-900">
                NIC Identity Verified (Approved)
              </p>
              <p className="text-xs text-emerald-700 mt-0.5">
                Your NIC ({currentUser.nic_number}) has been officially verified by the platform administrators. You can update your attachments below if your physical card was re-issued.
              </p>
            </div>
          </div>
        )}

        {currentUser.nic_status === 'pending' && (
          <div className="mx-6 mt-4 p-4 rounded-xl bg-amber-50 border border-amber-200 flex items-start space-x-3">
            <Clock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-amber-900">
                NIC Submission Under Review
              </p>
              <p className="text-xs text-amber-700 mt-0.5">
                Your card attachments are queued for verification by Coconnect operations. You can re-upload fresh attachments if you need to correct details.
              </p>
            </div>
          </div>
        )}

        {currentUser.nic_status === 'rejected' && (
          <div className="mx-6 mt-4 p-4 rounded-xl bg-rose-50 border border-rose-200 flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-rose-900">
                Previous Submission Rejected
              </p>
              <p className="text-xs text-rose-700 mt-0.5">
                Reason: {currentUser.nic_rejection_reason || userSubmission?.rejection_reason || 'Unclear card edges or numbers'}. Please provide sharp, high-contrast photos below.
              </p>
            </div>
          </div>
        )}

        {/* Main Submission Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          
          {/* Quick Demo Helper Button */}
          <div className="flex items-center justify-between bg-slate-50 border border-slate-200/80 rounded-xl p-3">
            <div className="flex items-center space-x-2 text-xs text-slate-600">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              <span>Testing without physical card? Auto-generate verified specimen cards.</span>
            </div>
            <button
              type="button"
              onClick={handleUseDemoCards}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm transition-colors flex items-center space-x-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Quick-Fill Sample Cards</span>
            </button>
          </div>

          {/* NIC Number Input & Live Validation */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                Sri Lankan NIC Number *
              </label>
              <span className="text-[11px] text-slate-500">
                Old (9 digits + V/X) or New (12 digits)
              </span>
            </div>
            <div className="relative">
              <input
                type="text"
                value={nicNumber}
                onChange={(e) => {
                  setNicNumber(e.target.value.toUpperCase());
                  setErrorMessage(null);
                }}
                placeholder="e.g. 852341829V or 199012345678"
                className={`w-full px-3.5 py-2.5 rounded-xl border text-sm font-mono transition-colors focus:outline-none focus:ring-2 ${
                  nicNumber && validation.isValid 
                    ? 'border-emerald-500 bg-emerald-50/20 text-emerald-950 focus:ring-emerald-500/20'
                    : nicNumber && !validation.isValid
                    ? 'border-rose-400 bg-rose-50/30 text-rose-900 focus:ring-rose-400/20'
                    : 'border-slate-300 focus:border-emerald-600 focus:ring-emerald-500/20'
                }`}
                maxLength={12}
                required
              />
              {nicNumber && validation.isValid && (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 absolute right-3 top-2.5" />
              )}
            </div>

            {/* Live Parsing Feedback */}
            {nicNumber && validation.isValid && (
              <div className="mt-2 text-xs bg-emerald-50 text-emerald-800 p-2.5 rounded-lg border border-emerald-200 flex flex-wrap items-center gap-x-4 gap-y-1">
                <span className="font-semibold">Format: {validation.format === 'OLD_9V' ? 'Old 9-Digit (V/X)' : 'New 12-Digit (2016+)'}</span>
                {validation.birthYear && <span>Year of Birth: <strong>{validation.birthYear}</strong></span>}
                {validation.gender && <span>Gender: <strong>{validation.gender}</strong></span>}
                {validation.approxDob && <span>Estimated DOB: <strong>{validation.approxDob}</strong></span>}
              </div>
            )}
            {nicNumber && !validation.isValid && (
              <p className="mt-1.5 text-xs text-rose-600 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                {validation.errorMessage}
              </p>
            )}
          </div>

          {/* Two Separate Attachment Zones: NIC Front and NIC Back */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* 1. FRONT END ATTACHMENT */}
            <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                      NIC Front End *
                    </h3>
                  </div>
                  {frontImage ? (
                    <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      Attached ✓
                    </span>
                  ) : (
                    <span className="text-[11px] text-rose-600 font-medium">Required</span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 mb-3">
                  Must clearly show your face photo, NIC number, and official seal.
                </p>

                {/* Front Image Preview or Drop Area */}
                {frontImage ? (
                  <div className="relative rounded-lg overflow-hidden border border-slate-200 bg-white group mb-3 aspect-[1.58/1] flex items-center justify-center">
                    <img 
                      src={frontImage} 
                      alt="NIC Front" 
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-2">
                      <button
                        type="button"
                        onClick={() => setPreviewZoomImage({ url: frontImage, title: 'NIC Front End Preview' })}
                        className="p-1.5 bg-white text-slate-700 rounded-lg hover:bg-slate-100 shadow"
                        title="Zoom preview"
                      >
                        <ZoomIn className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setFrontImage(null);
                          setFrontFileName('');
                        }}
                        className="p-1.5 bg-rose-600 text-white rounded-lg hover:bg-rose-700 shadow"
                        title="Remove attachment"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div 
                    onClick={() => frontInputRef.current?.click()}
                    className="border-2 border-dashed border-slate-300 hover:border-emerald-500 rounded-lg p-4 text-center cursor-pointer transition-colors bg-white group mb-3 aspect-[1.58/1] flex flex-col items-center justify-center"
                  >
                    <div className="w-10 h-10 rounded-full bg-slate-100 group-hover:bg-emerald-50 flex items-center justify-center text-slate-500 group-hover:text-emerald-600 transition-colors mb-2">
                      <Upload className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-semibold text-slate-700 group-hover:text-emerald-700">
                      Upload NIC Front Side
                    </span>
                    <span className="text-[10px] text-slate-400 mt-0.5">
                      PNG, JPG, WEBP (Max 10MB)
                    </span>
                  </div>
                )}
              </div>

              {/* Action Buttons (Front) */}
              <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-200">
                <input
                  type="file"
                  ref={frontInputRef}
                  accept="image/*"
                  onChange={handleFrontFileChange}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => frontInputRef.current?.click()}
                  className="text-xs text-emerald-700 font-semibold hover:underline flex items-center gap-1"
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>{frontImage ? 'Change Front Photo' : 'Browse File / Camera'}</span>
                </button>
                {frontFileName && (
                  <span className="text-[11px] text-slate-500 truncate max-w-[120px]" title={frontFileName}>
                    {frontFileSizeKb} KB
                  </span>
                )}
              </div>
            </div>

            {/* 2. BACK END ATTACHMENT */}
            <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-1.5">
                    <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                    <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                      NIC Back End *
                    </h3>
                  </div>
                  {backImage ? (
                    <span className="text-[11px] font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                      Attached ✓
                    </span>
                  ) : (
                    <span className="text-[11px] text-rose-600 font-medium">Required</span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 mb-3">
                  Must clearly show your permanent address, date of issue, and barcode.
                </p>

                {/* Back Image Preview or Drop Area */}
                {backImage ? (
                  <div className="relative rounded-lg overflow-hidden border border-slate-200 bg-white group mb-3 aspect-[1.58/1] flex items-center justify-center">
                    <img 
                      src={backImage} 
                      alt="NIC Back" 
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-2">
                      <button
                        type="button"
                        onClick={() => setPreviewZoomImage({ url: backImage, title: 'NIC Back End Preview' })}
                        className="p-1.5 bg-white text-slate-700 rounded-lg hover:bg-slate-100 shadow"
                        title="Zoom preview"
                      >
                        <ZoomIn className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setBackImage(null);
                          setBackFileName('');
                        }}
                        className="p-1.5 bg-rose-600 text-white rounded-lg hover:bg-rose-700 shadow"
                        title="Remove attachment"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div 
                    onClick={() => backInputRef.current?.click()}
                    className="border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-lg p-4 text-center cursor-pointer transition-colors bg-white group mb-3 aspect-[1.58/1] flex flex-col items-center justify-center"
                  >
                    <div className="w-10 h-10 rounded-full bg-slate-100 group-hover:bg-blue-50 flex items-center justify-center text-slate-500 group-hover:text-blue-600 transition-colors mb-2">
                      <Upload className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-semibold text-slate-700 group-hover:text-blue-700">
                      Upload NIC Back Side
                    </span>
                    <span className="text-[10px] text-slate-400 mt-0.5">
                      PNG, JPG, WEBP (Max 10MB)
                    </span>
                  </div>
                )}
              </div>

              {/* Action Buttons (Back) */}
              <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-200">
                <input
                  type="file"
                  ref={backInputRef}
                  accept="image/*"
                  onChange={handleBackFileChange}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => backInputRef.current?.click()}
                  className="text-xs text-blue-700 font-semibold hover:underline flex items-center gap-1"
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>{backImage ? 'Change Back Photo' : 'Browse File / Camera'}</span>
                </button>
                {backFileName && (
                  <span className="text-[11px] text-slate-500 truncate max-w-[120px]" title={backFileName}>
                    {backFileSizeKb} KB
                  </span>
                )}
              </div>
            </div>

          </div>

          {/* Optional Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Remarks or Special Notes (Optional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Registered address is same as estate location in Narammala"
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 outline-none"
            />
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Success Notification */}
          {submitSuccess && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="font-semibold">NIC Front and Back submitted successfully! Queued for Admin Verification.</span>
            </div>
          )}

          {/* Footer Submit Buttons */}
          <div className="pt-2 flex items-center justify-between border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !frontImage || !backImage || !nicNumber || !validation.isValid}
              className={`px-6 py-2.5 rounded-xl text-xs font-bold text-white shadow-md transition-all flex items-center space-x-2 ${
                isSubmitting || !frontImage || !backImage || !nicNumber || !validation.isValid
                  ? 'bg-slate-300 cursor-not-allowed text-slate-500'
                  : 'bg-emerald-600 hover:bg-emerald-700 hover:shadow-emerald-600/20 active:scale-95'
              }`}
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Submitting to Firestore...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Submit NIC for Verification</span>
                </>
              )}
            </button>
          </div>
        </form>

      </div>

      {/* High-Resolution Zoom Modal */}
      {previewZoomImage && (
        <div className="fixed inset-0 z-60 bg-black/80 flex items-center justify-center p-4" onClick={() => setPreviewZoomImage(null)}>
          <div className="relative max-w-3xl w-full bg-slate-900 rounded-2xl overflow-hidden p-4 border border-slate-700" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3 text-white">
              <h3 className="text-sm font-semibold">{previewZoomImage.title}</h3>
              <button onClick={() => setPreviewZoomImage(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <img 
              src={previewZoomImage.url} 
              alt="Zoomed card" 
              className="w-full max-h-[70vh] object-contain rounded-lg"
            />
          </div>
        </div>
      )}
    </div>
  );
};
