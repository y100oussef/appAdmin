
import DashboardSidebar from "./DashboardSidebar";
import ProtectedRoute from "./ProtectedRoute";
import { useIsMobile } from "@/hooks/use-mobile";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const isMobile = useIsMobile();

  return (
    <ProtectedRoute>
      <div className="flex min-h-screen bg-background">
        <DashboardSidebar />
        <main className={`flex-1 p-4 sm:p-8 ${isMobile ? "" : "mr-64"}`}>
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
};

export default DashboardLayout;
