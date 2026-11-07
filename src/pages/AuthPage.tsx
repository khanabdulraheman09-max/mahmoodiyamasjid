import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { isFirebaseConfigured } from '../services/firebase';
import { NativeService } from '../services/nativeService';
import {
  Lock,
  Mail,
  Eye,
  EyeOff,
  ShieldCheck,
  User,
  ArrowRight,
  AlertCircle,
  Sparkles,
  Info,
  ChevronDown,
  ChevronUp,
  UserCheck
} from 'lucide-react';

interface AuthPageProps {
  onSuccess?: () => void;
}

export const AuthPage: React.FC<AuthPageProps> = ({ onSuccess }) => {
  const {
    loginWithEmail,
    signupWithEmail,
    loginWithGoogle,
    continueAsGuest,
    setRoleForTesting,
    authError,
    clearAuthError,
  } = useAuth();

  const [showEmailForm, setShowEmailForm] = useState(false);
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittingAction, setSubmittingAction] = useState<'guest' | 'google' | 'email' | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);

  const isConfigured = isFirebaseConfigured();

  // Option 1: Continue as Guest (Firebase Anonymous Authentication)
  const handleContinueAsGuest = async () => {
    clearAuthError();
    setLocalError(null);
    setIsSubmitting(true);
    setSubmittingAction('guest');
    NativeService.hapticTap();

    try {
      await continueAsGuest();
      NativeService.hapticSuccess();
      if (onSuccess) onSuccess();
    } catch (err: any) {
      NativeService.hapticWarning();
    } finally {
      setIsSubmitting(false);
      setSubmittingAction(null);
    }
  };

  // Option 2: Login with Google (Firebase Google Authentication)
  const handleGoogleAuth = async () => {
    clearAuthError();
    setLocalError(null);
    setIsSubmitting(true);
    setSubmittingAction('google');
    NativeService.hapticTap();

    try {
      await loginWithGoogle();
      NativeService.hapticSuccess();
      if (onSuccess) onSuccess();
    } catch (err: any) {
      NativeService.hapticWarning();
    } finally {
      setIsSubmitting(false);
      setSubmittingAction(null);
    }
  };

  // Email / Password Form Submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearAuthError();
    setLocalError(null);

    if (!email.trim() || !password) {
      setLocalError('Please enter both email and password.');
      return;
    }

    if (mode === 'signup') {
      if (password.length < 6) {
        setLocalError('Password must be at least 6 characters long.');
        return;
      }
      if (password !== confirmPassword) {
        setLocalError('Passwords do not match. Please verify.');
        return;
      }
    }

    setIsSubmitting(true);
    setSubmittingAction('email');
    NativeService.hapticTap();

    try {
      if (mode === 'signin') {
        await loginWithEmail(email, password);
      } else {
        await signupWithEmail(email, password);
      }
      NativeService.hapticSuccess();
      if (onSuccess) onSuccess();
    } catch (err: any) {
      NativeService.hapticWarning();
    } finally {
      setIsSubmitting(false);
      setSubmittingAction(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#032316] via-[#053F29] to-[#032316] text-[#1A2420] flex flex-col justify-between py-6 px-4 sm:px-6 pt-safe pb-safe">
      <div className="max-w-md w-full mx-auto my-auto space-y-5">
        {/* Mobile App Header Brand */}
        <div className="text-center space-y-1.5">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-white/10 p-2 border-2 border-[#D4AF37] shadow-xl backdrop-blur-md mb-1">
            <img
              src="/masjid-logo.svg"
              alt="Masjid Mehmoodiya"
              className="w-16 h-16 drop-shadow-md"
            />
          </div>
          <div className="text-2xl sm:text-3xl font-arabic text-[#D4AF37] font-bold tracking-wide">
            مسجد محمودیہ
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
            Masjid Mehmoodiya – Sawangi
          </h1>
          <p className="text-xs text-emerald-200/80 font-medium">
            Official Community & Maktab Portal
          </p>
        </div>

        {/* Auth Main Card */}
        <div className="bg-white rounded-3xl shadow-2xl border border-[#D4AF37]/30 p-6 sm:p-7 space-y-5">
          {/* Header Title */}
          <div className="text-center border-b border-gray-100 pb-3">
            <h2 className="text-base sm:text-lg font-bold text-[#075B3A]">Welcome to Masjid Portal</h2>
            <p className="text-xs text-gray-500 mt-0.5">Select how you would like to continue</p>
          </div>

          {/* Error Message */}
          {(authError || localError) && (
            <div className="flex items-center space-x-2 bg-red-50 border border-red-200 rounded-2xl p-3 text-xs text-red-700 animate-shake">
              <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
              <span>{localError || authError}</span>
            </div>
          )}

          {/* ------------------------------------------------------------- */}
          {/* Option 1: Continue as Guest (Firebase Anonymous Auth)        */}
          {/* ------------------------------------------------------------- */}
          <div className="space-y-1.5">
            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800 ml-1">
              Option 1: Quick Access
            </span>
            <button
              type="button"
              onClick={handleContinueAsGuest}
              disabled={isSubmitting}
              className="w-full py-3.5 px-4 bg-gradient-to-r from-[#075B3A] via-[#096d46] to-[#043A25] hover:from-[#096d46] hover:to-[#075B3A] text-white rounded-2xl text-sm font-bold shadow-md hover:shadow-lg transition-all flex items-center justify-between active:scale-[0.98] disabled:opacity-60 group border border-[#D4AF37]/30"
            >
              <div className="flex items-center space-x-3">
                <div className="p-1.5 bg-white/15 rounded-xl group-hover:scale-105 transition-transform">
                  <UserCheck className="w-5 h-5 text-[#D4AF37]" />
                </div>
                <div className="text-left">
                  <div className="leading-tight font-extrabold flex items-center space-x-1.5">
                    <span>Continue as Guest</span>
                    <span className="text-[10px] font-normal bg-[#D4AF37] text-gray-900 rounded-full px-1.5 py-0.2">
                      Instant
                    </span>
                  </div>
                  <div className="text-[10px] text-emerald-200 font-normal">
                    View Salah times, Quran, Duas & Notices
                  </div>
                </div>
              </div>
              {submittingAction === 'guest' ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <ArrowRight className="w-4 h-4 text-[#D4AF37] group-hover:translate-x-1 transition-transform" />
              )}
            </button>
          </div>

          {/* Divider */}
          <div className="relative flex items-center justify-center py-0.5">
            <div className="border-t border-gray-200 w-full" />
            <span className="bg-white px-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
              Or
            </span>
          </div>

          {/* ------------------------------------------------------------- */}
          {/* Option 2: Login with Google (Authorized Accounts & Admin)    */}
          {/* ------------------------------------------------------------- */}
          <div className="space-y-1.5">
            <span className="text-[10px] font-black uppercase tracking-wider text-gray-600 ml-1">
              Option 2: Authorized Sign In
            </span>
            <button
              type="button"
              onClick={handleGoogleAuth}
              disabled={isSubmitting}
              className="w-full py-3.5 px-4 bg-white hover:bg-gray-50 border-2 border-gray-200 hover:border-gray-300 text-gray-800 rounded-2xl text-sm font-bold shadow-sm transition-all flex items-center justify-between active:scale-[0.98] disabled:opacity-60 group"
            >
              <div className="flex items-center space-x-3">
                <div className="p-1.5 bg-gray-50 rounded-xl group-hover:scale-105 transition-transform">
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 10.02 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                    />
                  </svg>
                </div>
                <div className="text-left">
                  <div className="leading-tight font-extrabold text-gray-900">
                    Login with Google
                  </div>
                  <div className="text-[10px] text-gray-500 font-normal">
                    Admin & Registered Maktab Parents
                  </div>
                </div>
              </div>
              {submittingAction === 'google' ? (
                <div className="w-5 h-5 border-2 border-emerald-600/30 border-t-emerald-600 rounded-full animate-spin" />
              ) : (
                <ArrowRight className="w-4 h-4 text-gray-400 group-hover:translate-x-1 transition-transform" />
              )}
            </button>
          </div>

          {/* ------------------------------------------------------------- */}
          {/* Collapsible Email / Password Option                          */}
          {/* ------------------------------------------------------------- */}
          <div className="pt-1">
            <button
              type="button"
              onClick={() => {
                setShowEmailForm(!showEmailForm);
                NativeService.hapticTap();
              }}
              className="w-full flex items-center justify-between text-xs font-semibold text-gray-500 hover:text-gray-800 py-1.5 px-2 rounded-xl hover:bg-gray-50 transition-colors"
            >
              <span>Or use Admin Email & Password</span>
              {showEmailForm ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {showEmailForm && (
              <div className="mt-3 pt-3 border-t border-gray-100 space-y-4 animate-fade-in">
                {/* Tabs for Email Sign In vs Sign Up */}
                <div className="flex bg-gray-100 p-1 rounded-2xl">
                  <button
                    type="button"
                    onClick={() => {
                      setMode('signin');
                      clearAuthError();
                    }}
                    className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      mode === 'signin' ? 'bg-[#075B3A] text-white shadow-sm' : 'text-gray-500'
                    }`}
                  >
                    Email Sign In
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMode('signup');
                      clearAuthError();
                    }}
                    className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      mode === 'signup' ? 'bg-[#075B3A] text-white shadow-sm' : 'text-gray-500'
                    }`}
                  >
                    Sign Up
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-gray-700">Email Address</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                        <Mail className="w-3.5 h-3.5" />
                      </div>
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="admin@masjidmehmoodiya.org"
                        className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 focus:bg-white focus:ring-2 focus:ring-[#075B3A] outline-none"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-gray-700">Password</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                        <Lock className="w-3.5 h-3.5" />
                      </div>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full pl-9 pr-9 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 focus:bg-white focus:ring-2 focus:ring-[#075B3A] outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400"
                      >
                        {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  {mode === 'signup' && (
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-gray-700">Confirm Password</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                          <Lock className="w-3.5 h-3.5" />
                        </div>
                        <input
                          type={showConfirmPassword ? 'text' : 'password'}
                          required
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="••••••••"
                          className="w-full pl-9 pr-9 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 focus:bg-white focus:ring-2 focus:ring-[#075B3A] outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400"
                        >
                          {showConfirmPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-2.5 px-3 bg-[#075B3A] hover:bg-[#043A25] text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-1 shadow-sm active:scale-95 disabled:opacity-50"
                  >
                    {submittingAction === 'email' ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <span>{mode === 'signin' ? 'Sign In with Email' : 'Create Account'}</span>
                    )}
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>

        {/* Development & Offline Role Switchers */}
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3.5 border border-white/15 text-white space-y-2">
          <div className="flex items-start space-x-2">
            <Info className="w-4 h-4 text-[#D4AF37] flex-shrink-0 mt-0.5" />
            <div className="text-[11px] leading-relaxed text-emerald-100">
              {!isConfigured ? (
                <>
                  <strong className="text-white">Offline/Demo Mode:</strong> Firebase keys pending in <code className="bg-black/30 px-1 py-0.5 rounded text-[#D4AF37]">.env</code>. You can test roles immediately below:
                </>
              ) : (
                <>
                  <strong className="text-white">Firebase Connected:</strong> Anonymous Authentication & Google Sign-In active.
                </>
              )}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-1.5 pt-0.5">
            <button
              type="button"
              onClick={() => {
                setRoleForTesting('guest');
                if (onSuccess) onSuccess();
              }}
              className="py-1.5 px-2 rounded-xl bg-white/15 hover:bg-white/25 border border-white/20 text-[11px] font-bold transition-all text-center"
            >
              Test Guest
            </button>
            <button
              type="button"
              onClick={() => {
                setRoleForTesting('visitor');
                if (onSuccess) onSuccess();
              }}
              className="py-1.5 px-2 rounded-xl bg-white/15 hover:bg-white/25 border border-white/20 text-[11px] font-bold transition-all text-center"
            >
              Test Visitor
            </button>
            <button
              type="button"
              onClick={() => {
                setRoleForTesting('admin');
                if (onSuccess) onSuccess();
              }}
              className="py-1.5 px-2 rounded-xl bg-[#D4AF37] text-[#043A25] font-black text-[11px] transition-all text-center"
            >
              Test Admin
            </button>
          </div>
        </div>

        {/* Footer info */}
        <div className="text-center text-[11px] text-emerald-200/60 pb-1">
          Masjid Mehmoodiya • Darussalam Society, Sawangi
        </div>
      </div>
    </div>
  );
};
