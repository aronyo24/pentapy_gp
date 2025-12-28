import { Navigate } from "react-router-dom";
import { Loader2 } from "lucide-react";

import { useAuth } from "@/context/AuthContext";

type PublicRouteProps = {
  children: JSX.Element;
};

const PublicRoute = ({ children }: PublicRouteProps) => {
  const { user, loading, refreshing } = useAuth();

  if (loading || refreshing) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-muted-foreground gap-2">
        <Loader2 className="h-6 w-6 animate-spin" />
        <p>Loading...</p>
      </div>
    );
  }

  if (user?.profile.email_verified) {
    return <Navigate to="/home" replace />;
  }

  return children;
};

export default PublicRoute;
