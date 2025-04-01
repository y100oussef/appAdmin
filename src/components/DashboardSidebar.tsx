
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { Home, Users, Music, LogOut, BellRing, Wallpaper, MessageSquare, Menu } from "lucide-react";
import { useState } from "react";
import { LogoutDialog } from "@/components/LogoutDialog";
import { useIsMobile } from "@/hooks/use-mobile";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

const DashboardSidebar = () => {
  const location = useLocation();
  const { signOut } = useAuth();
  const isMobile = useIsMobile();
  
  const menuItems = [
    {
      title: "الرئيسية",
      icon: Home,
      path: "/",
    },
    {
      title: "المستخدمون",
      icon: Users,
      path: "/users",
    },
    {
      title: "الأغاني",
      icon: Music,
      path: "/songs",
    },
    {
      title: "إرسال إشعارات",
      icon: BellRing,
      path: "/notifications",
    },
    {
      title: "خلفيات",
      icon: Wallpaper,
      path: "/wallpapers",
    },
    {
      title: "إدارة الغرف",
      icon: MessageSquare,
      path: "/rooms",
    },
  ];

  const [showLogoutDialog, setShowLogoutDialog] = useState(false);

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="mb-8 flex justify-center">
        <h1 className="text-2xl font-bold">لوحة التحكم</h1>
      </div>
      
      <nav className="space-y-2 flex-1">
        {menuItems.map((item) => (
          <Link key={item.path} to={item.path}>
            <Button
              variant={location.pathname === item.path ? "default" : "ghost"}
              className={cn(
                "w-full justify-start",
                location.pathname === item.path
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-muted"
              )}
            >
              <item.icon className="ml-2 h-5 w-5" />
              {item.title}
            </Button>
          </Link>
        ))}
      </nav>
      
      <div className="pt-4 border-t">
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start mt-auto"
          onClick={() => setShowLogoutDialog(true)}
        >
          <LogOut className="mr-2 h-4 w-4" />
          تسجيل الخروج
        </Button>
        
        <LogoutDialog 
          open={showLogoutDialog} 
          onOpenChange={setShowLogoutDialog} 
        />
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <>
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon" className="fixed top-4 right-4 z-50">
              <Menu className="h-4 w-4" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-64 px-3 py-4">
            <SidebarContent />
          </SheetContent>
        </Sheet>
      </>
    );
  }

  return (
    <aside className="fixed inset-y-0 right-0 w-64 overflow-y-auto border-l bg-card px-3 py-4 hidden md:block">
      <SidebarContent />
    </aside>
  );
};

export default DashboardSidebar;
