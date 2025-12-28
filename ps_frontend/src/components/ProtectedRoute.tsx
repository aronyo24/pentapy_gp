import { Navigate, useLocation } from "react-router-dom";
import { Loader2 } from "lucide-react";

import { useAuth } from "@/context/AuthContext";

type ProtectedRouteProps = {
  children: JSX.Element;
};

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { user, loading, refreshing } = useAuth();
  const location = useLocation();

  if (loading || refreshing) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-muted-foreground gap-2">
        <Loader2 className="h-6 w-6 animate-spin" />
        <p>Loading your account...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (!user.profile.email_verified) {
    return <Navigate to="/verify-email" replace state={{ from: location }} />;
  }

  return children;
};

export default ProtectedRoute;
