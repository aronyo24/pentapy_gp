import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useLocation, useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

import { getGoogleAuthUrl, loginUser } from "@/api/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/AuthContext";

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { refresh } = useAuth();
  const initialEmail = useMemo(() => {
    const state = location.state as { email?: string } | null;
    return state?.email ?? "";
  }, [location.state]);

  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState("");

  useEffect(() => {
    if (initialEmail) {
      setEmail(initialEmail);
    }
  }, [initialEmail]);

  const mutation = useMutation({
    mutationFn: loginUser,
    onSuccess: async (data) => {
      if (data.requires_verification) {
        toast.info(data.detail ?? "Please verify your email to continue.");
        navigate("/verify-email", { state: { email } });
        return;
      }

      await refresh();
      toast.success(data.detail ?? "Welcome to PentaPy!");
      navigate("/home", { replace: true });
    },
    onError: (error) => {
      if (axios.isAxiosError(error)) {
        const data = error.response?.data;
        let message = "Invalid credentials. Please try again.";
        if (data) {
          if (typeof data === "string") {
            message = data;
          } else if (data.detail) {
            message = Array.isArray(data.detail) ? data.detail[0] : data.detail;
          } else {
            const key = Object.keys(data)[0];
            if (key) {
              const value = data[key];
              if (Array.isArray(value)) {
                message = value[0];
              } else if (typeof value === "string") {
                message = value;
              }
            }
          }
        }
        toast.error(message);
      } else {
        toast.error("Unable to sign in. Please try again later.");
      }
    },
  });

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Please fill in all fields");
      return;
    }
    mutation.mutate({ email, password });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md animate-fade-in">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white bg-clip-text  mb-2">
            PentaPy
          </h1>
          <p className="text-muted-foreground">
            Sign in to your account
          </p>
        </div>

        <div className="space-y-3">
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={() => {
              const url = getGoogleAuthUrl("/home");
              if (typeof window !== "undefined") {
                window.location.href = url;
              }
            }}
          >
            Continue with Google
          </Button>
          <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
            <span className="flex-1 h-px bg-border" />
            <span>or</span>
            <span className="flex-1 h-px bg-border" />
          </div>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <div className="text-right">
            <button
              type="button"
              onClick={() => navigate("/forgot-password", { state: { email } })}
              className="text-sm text-primary hover:underline"
            >
              Forgot password?
            </button>
          </div>

          <Button
            type="submit"
            className="w-full bg-gradient-primary hover:opacity-90"
            disabled={mutation.isPending}
          >
            {mutation.isPending ? "Signing in..." : "Sign In"}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => navigate("/signup")}
            className="text-sm text-muted-foreground hover:text-foreground transition-base"
          >
            Don't have an account? <span className="text-primary font-semibold">Sign up</span>
          </button>
          <button
            onClick={() => navigate("/verify-email", { state: { email } })}
            className="block w-full text-sm text-muted-foreground hover:text-foreground transition-base mt-2"
          >
            Verify email with code
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;
