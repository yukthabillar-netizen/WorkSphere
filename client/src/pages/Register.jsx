import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';
import { useAuthStore } from '../store/authStore';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { toast } from 'sonner';
import {
  User,
  Mail,
  Lock,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  RotateCw,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';

export const Register = () => {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();

  // Multi-step registration state: 'form' | 'otp'
  const [step, setStep] = useState('form');

  // Step 1: Account credentials
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Step 2: 6-digit verification code
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [cooldown, setCooldown] = useState(60);

  const otpInputsRef = useRef([]);

  // Password validation indicators
  const isMinLength = password.length >= 8;
  const hasNumber = /\d/.test(password);

  // Cooldown timer for code resend
  useEffect(() => {
    let timer;
    if (step === 'otp' && cooldown > 0) {
      timer = setInterval(() => {
        setCooldown((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [step, cooldown]);

  // Focus the first OTP box whenever entering OTP step
  useEffect(() => {
    if (step === 'otp') {
      setTimeout(() => {
        otpInputsRef.current[0]?.focus();
      }, 100);
    }
  }, [step]);

  // STEP 1: Submit credentials to send verification code
  const handleRequestCode = async (e) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !password) {
      toast.error('Please fill in all fields');
      return;
    }

    if (!isMinLength || !hasNumber) {
      toast.error('Password must be at least 8 characters long and contain at least 1 number');
      return;
    }

    try {
      setIsLoading(true);
      const res = await authService.sendRegistrationCode({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
      });

      setStep('otp');
      setOtp(['', '', '', '', '', '']);
      setCooldown(60);
      toast.success(res.message || `Verification code sent to ${email.trim()}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send verification code. Email may already be taken.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle single digit input
  const handleOtpChange = (index, value) => {
    // Only allow single numeric digit
    const cleaned = value.replace(/\D/g, '').slice(-1);
    const newOtp = [...otp];
    newOtp[index] = cleaned;
    setOtp(newOtp);

    // If entered a digit, move to next input box
    if (cleaned && index < 5) {
      otpInputsRef.current[index + 1]?.focus();
    }

    // Auto-verify if all 6 digits are filled
    const completeCode = newOtp.join('');
    if (completeCode.length === 6) {
      executeVerification(completeCode);
    }
  };

  // Handle backspace navigation between OTP boxes
  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace') {
      if (!otp[index] && index > 0) {
        const newOtp = [...otp];
        newOtp[index - 1] = '';
        setOtp(newOtp);
        otpInputsRef.current[index - 1]?.focus();
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      otpInputsRef.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < 5) {
      otpInputsRef.current[index + 1]?.focus();
    }
  };

  // Handle pasting full 6-digit code
  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pastedData) return;

    const digits = pastedData.split('');
    const newOtp = [...otp];
    digits.forEach((digit, i) => {
      if (i < 6) newOtp[i] = digit;
    });
    setOtp(newOtp);

    // Focus appropriate box
    const focusIndex = Math.min(digits.length, 5);
    otpInputsRef.current[focusIndex]?.focus();

    // Auto-verify if all 6 digits pasted
    if (newOtp.join('').length === 6) {
      executeVerification(newOtp.join(''));
    }
  };

  // STEP 2: Verify OTP and finalize registration
  const executeVerification = async (codeToVerify) => {
    const code = codeToVerify || otp.join('');
    if (code.length !== 6) {
      toast.error('Please enter all 6 digits of the verification code');
      return;
    }

    try {
      setIsVerifying(true);
      const res = await authService.verifyRegistrationCode({
        email: email.trim().toLowerCase(),
        code,
      });

      setAuth(res.data.user, res.data.accessToken, [res.data.workspace]);
      toast.success(`Email verified! Welcome to WorkSphere, ${res.data.user.name}!`);
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Verification failed. Please check your code.');
    } finally {
      setIsVerifying(false);
    }
  };

  // Resend OTP code
  const handleResendCode = async () => {
    if (cooldown > 0 || isResending) return;

    try {
      setIsResending(true);
      await authService.resendRegistrationCode(email.trim().toLowerCase());
      setCooldown(60);
      setOtp(['', '', '', '', '', '']);
      otpInputsRef.current[0]?.focus();
      toast.success('A fresh verification code has been dispatched to your email');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to resend code');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {step === 'form' ? (
        <>
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Step 1 of 2: Create Account</span>
            </div>
            <h2 className="text-2xl font-bold text-text tracking-tight">Create your workspace</h2>
            <p className="text-xs text-text-muted mt-1">
              Start collaborating with your team in seconds. We'll send a 6-digit verification code to confirm your email.
            </p>
          </div>

          <form onSubmit={handleRequestCode} className="space-y-4">
            <Input
              label="Full Name"
              required
              placeholder="e.g. Alex Rivers"
              leftIcon={<User className="w-4 h-4" />}
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />

            <Input
              label="Work Email Address"
              type="email"
              required
              placeholder="alex@company.com"
              leftIcon={<Mail className="w-4 h-4" />}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <div className="space-y-2">
              <Input
                label="Password"
                type="password"
                required
                placeholder="••••••••"
                leftIcon={<Lock className="w-4 h-4" />}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />

              {/* Password requirement checklist */}
              <div className="space-y-1 pt-1 text-[11px] text-text-muted">
                <div className={`flex items-center gap-1.5 ${isMinLength ? 'text-emerald-500 font-medium' : ''}`}>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>At least 8 characters</span>
                </div>
                <div className={`flex items-center gap-1.5 ${hasNumber ? 'text-emerald-500 font-medium' : ''}`}>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Contains at least one number (0-9)</span>
                </div>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full mt-2"
              size="lg"
              isLoading={isLoading}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Continue to Verification
            </Button>
          </form>

          <div className="text-center text-xs text-text-muted pt-2">
            Already have an account?{' '}
            <Link to="/login" className="text-primary font-semibold hover:underline">
              Sign in instead
            </Link>
          </div>
        </>
      ) : (
        /* STEP 2: OTP VERIFICATION */
        <div className="space-y-6 animate-fade-in">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-semibold mb-3">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Step 2 of 2: Email Verification</span>
            </div>
            <h2 className="text-2xl font-bold text-text tracking-tight">Check your email</h2>
            <p className="text-xs text-text-muted mt-1 leading-relaxed">
              We've dispatched a 6-digit confirmation code to{' '}
              <span className="font-semibold text-text">{email}</span>.
            </p>
            <button
              type="button"
              onClick={() => setStep('form')}
              className="inline-flex items-center gap-1 text-xs text-primary font-medium hover:underline mt-1.5"
            >
              <ArrowLeft className="w-3 h-3" />
              Wrong email or need to edit?
            </button>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              executeVerification();
            }}
            className="space-y-6"
          >
            {/* 6 Digit Input Boxes */}
            <div>
              <label className="block text-xs font-medium text-text-muted mb-2 text-center">
                Enter 6-digit verification code
              </label>
              <div className="flex items-center justify-center gap-2 sm:gap-3" onPaste={handleOtpPaste}>
                {otp.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={(el) => (otpInputsRef.current[idx] = el)}
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    pattern="[0-9]*"
                    maxLength={1}
                    value={digit}
                    aria-label={`Digit ${idx + 1} of 6`}
                    onChange={(e) => handleOtpChange(idx, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                    className="w-11 h-13 sm:w-12 sm:h-14 text-center text-xl font-mono font-bold rounded-xl border border-border bg-surface text-text shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all select-all"
                  />
                ))}
              </div>
              <p className="text-[11px] text-text-muted text-center mt-2.5">
                Please check your inbox (and spam folder) for the email from WorkSphere.
              </p>
            </div>

            <Button
              type="submit"
              className="w-full"
              size="lg"
              isLoading={isVerifying}
              disabled={otp.join('').length !== 6}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Verify & Enter Workspace
            </Button>

            {/* Resend Code Section */}
            <div className="text-center text-xs text-text-muted pt-1">
              Didn't receive the email?{' '}
              {cooldown > 0 ? (
                <span className="font-medium text-text">
                  Resend code in <span className="font-mono text-primary font-semibold">{cooldown}s</span>
                </span>
              ) : (
                <button
                  type="button"
                  onClick={handleResendCode}
                  disabled={isResending}
                  className="text-primary font-semibold hover:underline inline-flex items-center gap-1 ml-1"
                >
                  <RotateCw className={`w-3 h-3 ${isResending ? 'animate-spin' : ''}`} />
                  Resend code now
                </button>
              )}
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
