import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { NativeService } from '../services/nativeService';
import {
  Lock,
  Mail,
  Eye,
  EyeOff,
  ArrowRight,
  AlertCircle,
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
    authError,
    clearAuthError,
  } = useAuth();

  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittingAction, setSubmittingAction] = useState<'guest' | 'google' | 'email' | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);

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

  // Google Authentication (Centered at bottom)
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

  // Primary: Email / Password Submission (Sign In or Create Account)
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
      <div className="max-w-md w-full mx-auto my-auto space-y-4">
        {/* Mobile App Header Brand */}
        <div className="text-center space-y-1">
          <div className="inline-flex items-center justify-center w-18 h-18 sm:w-20 sm:h-20 rounded-3xl bg-white/10 p-2 border-2 border-[#D4AF37] shadow-xl backdrop-blur-md mb-1">
            <img
              src="/masjid-logo.svg"
              alt="Masjid Mehmoodiya"
              className="w-14 h-14 sm:w-16 sm:h-16 drop-shadow-md"
            />
          </div>
          <div className="text-2xl font-arabic text-[#D4AF37] font-bold tracking-wide">
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
        <div className="bg-white rounded-3xl shadow-2xl border border-[#D4AF37]/30 p-5 sm:p-6 space-y-4">
          {/* Error Message */}
          {(authError || localError) && (
            <div className="flex items-center space-x-2 bg-red-50 border border-red-200 rounded-2xl p-3 text-xs text-red-700 animate-shake">
              <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
              <span>{localError || authError}</span>
            </div>
          )}

          {/* ------------------------------------------------------------- */}
          {/* 1. Continue as Guest (Top Quick Access)                       */}
          {/* ------------------------------------------------------------- */}
          <div>
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
          <div className="relative flex items-center justify-center py-1">
            <div className="border-t border-gray-200 w-full" />
            <span className="bg-white px-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
              Or Sign In With Email
            </span>
          </div>

          {/* ------------------------------------------------------------- */}
          {/* 2. Primary Priority: Email & Password (Sign In / Create Account) */}
          {/* ------------------------------------------------------------- */}
          <div className="space-y-3">
            {/* Tabs for Email Sign In vs Create Account */}
            <div className="flex bg-gray-100 p-1 rounded-2xl">
              <button
                type="button"
                onClick={() => {
                  setMode('signin');
                  clearAuthError();
                  setLocalError(null);
                }}
                className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  mode === 'signin' ? 'bg-[#075B3A] text-white shadow-sm' : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('signup');
                  clearAuthError();
                  setLocalError(null);
                }}
                className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  mode === 'signup' ? 'bg-[#075B3A] text-white shadow-sm' : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                Create Account
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
                    placeholder="name@example.com"
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
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
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
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
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

          {/* ------------------------------------------------------------- */}
          {/* 3. Small Sign In with Google at Bottom Centre                 */}
          {/* ------------------------------------------------------------- */}
          <div className="pt-2 border-t border-gray-100 flex flex-col items-center">
            <button
              type="button"
              onClick={handleGoogleAuth}
              disabled={isSubmitting}
              className="inline-flex items-center space-x-2 px-4 py-2 bg-white hover:bg-gray-50 border border-gray-200 rounded-full text-xs font-semibold text-gray-700 shadow-xs hover:border-gray-300 transition-all active:scale-95 disabled:opacity-60"
            >
              {submittingAction === 'google' ? (
                <div className="w-4 h-4 border-2 border-emerald-600/30 border-t-emerald-600 rounded-full animate-spin" />
              ) : (
                <svg className="w-4 h-4" viewBox="0 0 24 24">
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
              )}
              <span className="text-[11px]">Sign in with Google</span>
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
