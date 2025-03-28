
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Users from "./pages/Users";
import Songs from "./pages/Songs";
import Notifications from "./pages/Notifications";
import Wallpapers from "./pages/Wallpapers";
import Rooms from "./pages/Rooms";
import NotFound from "./pages/NotFound";
import { useEffect } from "react";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30000,
    },
  },
});

const App = () => {
  // This will run once on app startup to check if Firebase is initialized correctly
  useEffect(() => {
    console.log("App initialized, Firebase should be initialized now");
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/index" element={<Navigate to="/dashboard" replace />} />
              <Route path="/users" element={<Users />} />
              <Route path="/songs" element={<Songs />} />
              <Route path="/notifications" element={<Notifications />} />
              <Route path="/wallpapers" element={<Wallpapers />} />
              <Route path="/rooms" element={<Rooms />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
