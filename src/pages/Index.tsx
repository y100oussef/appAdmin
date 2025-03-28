
import { useEffect } from "react";
import { Navigate } from "react-router-dom";

const Index = () => {
  useEffect(() => {
    console.log("Index component rendered, redirecting to dashboard");
    // Log any relevant information about the current route
    console.log("Current location:", window.location.pathname);
  }, []);

  // Direct redirect to dashboard
  return <Navigate to="/dashboard" replace />;
};

export default Index;
