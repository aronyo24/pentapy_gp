import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const Splash = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate("/login");
    }, 2500);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-primary">
      <div className="text-center animate-scale-in">
        <h1 className="text-6xl md:text-8xl font-bold text-white mb-4">
          PentaPy
        </h1>
        <p className="text-white/80 text-lg">
          Share Your Moments
        </p>
      </div>
    </div>
  );
};

export default Splash;
