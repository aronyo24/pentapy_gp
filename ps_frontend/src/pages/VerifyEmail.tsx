import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useLocation, useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

import { resendOtp, verifyOtp } from "@/api/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { useAuth } from "@/context/AuthContext";
import type { VerifyOtpPayload } from "@/types/interface";

const PENDING_EMAIL_KEY = "pentapy_pending_email";

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
        const value = data[firstKey];
        if (Array.isArray(value)) {
          return value[0];
        }
        if (typeof value === "string") {
          return value;
        }
      }
    }
  }
  return "Something went wrong. Please try again.";
};

const VerifyEmail = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, refresh } = useAuth();

  const locationEmail = useMemo(() => {
    const state = location.state as { email?: string } | null;
    return state?.email ?? null;
  }, [location.state]);

  const [email, setEmail] = useState(() => {
    if (locationEmail) {
      return locationEmail;
    }
    if (user?.email) {
      return user.email;
    }
    if (typeof window !== "undefined") {
      return window.localStorage.getItem(PENDING_EMAIL_KEY) ?? "";
    }
    return "";
  });
  const [otp, setOtp] = useState("");

  useEffect(() => {
    if (email && typeof window !== "undefined") {
      window.localStorage.setItem(PENDING_EMAIL_KEY, email);
    }
  }, [email]);

  const verifyMutation = useMutation({
    mutationFn: (payload: VerifyOtpPayload) => verifyOtp(payload),
    onSuccess: async () => {
      if (typeof window !== "undefined") {
        window.localStorage.removeItem(PENDING_EMAIL_KEY);
      }
      toast.success("Email verified successfully!");
      const updated = await refresh();
      if (updated?.profile.email_verified) {
        navigate("/home", { replace: true });
      } else {
        navigate("/login", { replace: true });
      }
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });

  const resendMutation = useMutation({
    mutationFn: resendOtp,
    onSuccess: (data) => {
      toast.success(data.detail ?? "A new code has been sent to your email.");
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!otp || otp.replace(/\D/g, "").length < 6) {
      toast.error("Please enter the 6-digit code sent to your email.");
      return;
    }

    verifyMutation.mutate({
      email: email || undefined,
      otp_code: otp.replace(/\s/g, ""),
    });
  };

  const handleResend = () => {
    if (!email) {
      toast.error("Enter your email to resend the code.");
      return;
    }
    resendMutation.mutate({ email });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md space-y-6 bg-card border border-border rounded-xl p-8 shadow-xl animate-fade-in">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-semibold">Verify your email</h1>
          <p className="text-sm text-muted-foreground">
            We emailed a 6-digit confirmation code to your inbox. Enter it below to
            activate your account.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="verify-email">
              Email address
            </label>
            <Input
              id="verify-email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="otp-input">
              Verification code
            </label>
            <InputOTP
              value={otp}
              onChange={setOtp}
              maxLength={6}
              containerClassName="w-full"
            >
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

          <Button
            type="submit"
            className="w-full"
            disabled={verifyMutation.isPending}
          >
            {verifyMutation.isPending ? "Verifying..." : "Verify email"}
          </Button>
        </form>

        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>Didn&apos;t receive a code?</span>
          <button
            type="button"
            onClick={handleResend}
            disabled={resendMutation.isPending}
            className="text-primary font-medium hover:underline disabled:opacity-60"
          >
            {resendMutation.isPending ? "Sending..." : "Resend code"}
          </button>
        </div>

        <div className="text-center text-sm text-muted-foreground">
          <button
            type="button"
            onClick={() => navigate("/login")}
            className="hover:text-foreground transition"
          >
            Back to sign in
          </button>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmail;
