import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useLocation, useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

import { requestPasswordReset, resetPassword } from "@/api/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Label } from "@/components/ui/label";

type Step = "request" | "verify";

const getErrorMessage = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data;
    if (typeof data === "string") {
      return data;
    }
    if (data?.detail) {
      return Array.isArray(data.detail) ? data.detail[0] : data.detail;
    }
    if (data && typeof data === "object") {
      const firstKey = Object.keys(data)[0];
      if (firstKey) {
        const value = (data as Record<string, unknown>)[firstKey];
        if (Array.isArray(value)) {
          return value[0] as string;
        }
        if (typeof value === "string") {
          return value;
        }
      }
    }
  }
  return "Something went wrong. Please try again.";
};

const ForgotPassword = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const STORAGE_KEY = "forgot-password-state";

  const locationEmail = useMemo(() => {
    const state = location.state as { email?: string } | null;
    return state?.email ?? "";
  }, [location.state]);

  const [step, setStep] = useState<Step>("request");
  const [email, setEmail] = useState(locationEmail);
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => {
    if (locationEmail) {
      setEmail(locationEmail);
    }
  }, [locationEmail]);

  useEffect(() => {
    try {
      const stored = sessionStorage.getItem(STORAGE_KEY);
      if (!stored) {
        return;
      }
      const parsed = JSON.parse(stored) as Partial<{ step: Step; email: string }>;
      if (parsed.step === "verify") {
        setStep("verify");
        if (parsed.email) {
          setEmail(parsed.email);
        }
      }
    } catch (error) {
      sessionStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  useEffect(() => {
    if (step === "verify") {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ step, email }));
    } else {
      sessionStorage.removeItem(STORAGE_KEY);
    }
  }, [step, email]);

  const requestMutation = useMutation({
    mutationFn: requestPasswordReset,
    onSuccess: (data) => {
      toast.success(data.detail ?? "We sent a reset code to your email.");
      setStep("verify");
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });

  const resetMutation = useMutation({
    mutationFn: resetPassword,
    onSuccess: (data) => {
      toast.success(data.detail ?? "Password reset successfully. You can now sign in.");
      navigate("/login", { replace: true, state: { email } });
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });

  const handleRequestSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!email) {
      toast.error("Enter your email address to continue.");
      return;
    }
    requestMutation.mutate({ email });
  };

  const handleResetSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const sanitizedOtp = otp.replace(/\D/g, "");

    if (sanitizedOtp.length < 6) {
      toast.error("Please enter the 6-digit code sent to your email.");
      return;
    }
    if (!password || !confirmPassword) {
      toast.error("Enter and confirm your new password.");
      return;
    }
    if (password !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }

    resetMutation.mutate({
      email,
      otp_code: sanitizedOtp,
      new_password: password,
      confirm_password: confirmPassword,
    });
  };

  const handleResend = () => {
    if (!email) {
      toast.error("Enter your email to resend the code.");
      return;
    }
    requestMutation.mutate({ email });
  };

  const handleStartOver = () => {
    setStep("request");
    setOtp("");
    setPassword("");
    setConfirmPassword("");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md space-y-6 bg-card border border-border rounded-xl p-8 shadow-xl animate-fade-in">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-semibold">
            {step === "request" ? "Forgot password" : "Reset your password"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {step === "request"
              ? "Enter the email associated with your account and we\'ll send you a one-time code."
              : "Enter the code we emailed you and choose a new password to finish resetting."}
          </p>
        </div>

        {step === "request" ? (
          <form onSubmit={handleRequestSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="forgot-email">Email address</Label>
              <Input
                id="forgot-email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
                disabled={requestMutation.isPending}
              />
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={requestMutation.isPending}
            >
              {requestMutation.isPending ? "Sending code..." : "Send reset code"}
            </Button>
          </form>
        ) : (
          <form onSubmit={handleResetSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="reset-email">Email address</Label>
              <Input
                id="reset-email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoComplete="email"
              />
              <button
                type="button"
                onClick={handleStartOver}
                className="text-xs text-muted-foreground hover:text-foreground transition"
              >
                Use a different email
              </button>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reset-otp">Verification code</Label>
              <InputOTP value={otp} onChange={setOtp} maxLength={6} containerClassName="w-full">
                <InputOTPGroup className="w-full justify-between gap-2">
                  {[0, 1, 2, 3, 4, 5].map((index) => (
                    <InputOTPSlot
                      key={index}
                      index={index}
                      className="h-12 w-12 rounded-md border bg-background text-lg"
                    />
                  ))}
                </InputOTPGroup>
              </InputOTP>
            </div>

            <div className="space-y-2">
              <Label htmlFor="new-password">New password</Label>
              <Input
                id="new-password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Enter a new password"
                autoComplete="new-password"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm password</Label>
              <Input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                placeholder="Re-enter your new password"
                autoComplete="new-password"
              />
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={resetMutation.isPending}
            >
              {resetMutation.isPending ? "Resetting password..." : "Reset password"}
            </Button>

            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Didn\'t get the code?</span>
              <button
                type="button"
                onClick={handleResend}
                disabled={requestMutation.isPending}
                className="text-primary font-medium hover:underline disabled:opacity-60"
              >
                {requestMutation.isPending ? "Sending..." : "Resend code"}
              </button>
            </div>
          </form>
        )}

        <div className="text-center text-sm text-muted-foreground">
          <button
            type="button"
            onClick={() => navigate("/login", { state: { email } })}
            className="hover:text-foreground transition"
          >
            Back to sign in
          </button>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
