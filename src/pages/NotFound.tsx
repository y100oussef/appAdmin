
import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Home, ArrowLeft } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="text-center bg-white p-8 rounded-lg shadow-md max-w-md">
        <h1 className="text-6xl font-bold text-red-500 mb-4">404</h1>
        <p className="text-2xl font-semibold text-gray-700 mb-2">صفحة غير موجودة</p>
        <p className="text-gray-600 mb-6">
          الصفحة التي تبحث عنها غير موجودة أو تم نقلها.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button asChild variant="default" className="flex items-center gap-2">
            <Link to="/">
              <Home className="h-4 w-4" />
              <span>الرئيسية</span>
            </Link>
          </Button>
          <Button 
            onClick={() => window.history.back()} 
            variant="outline" 
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>العودة للخلف</span>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
