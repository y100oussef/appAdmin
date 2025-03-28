
import { useEffect, useState } from "react";
import { collection, getDocs, doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { User } from "@/types";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { Search, AlertCircle, PenSquare, Mail, Bell, UserRound, Calendar, Shield } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import UserEditDialog from "@/components/UserEditDialog";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";

const Users = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        setError(null);
        console.log("Fetching users from Firestore...");
        
        const usersCollection = collection(db, "users");
        const snapshot = await getDocs(usersCollection);
        
        if (snapshot.empty) {
          console.log("No users found in the collection");
          setError("لم يتم العثور على بيانات المستخدمين");
          setUsers([]);
          setFilteredUsers([]);
          return;
        }
        
        console.log(`Retrieved ${snapshot.size} users from Firestore`);
        
        const usersData = snapshot.docs.map((doc) => {
          const data = doc.data();
          console.log("Processing user document:", data);
          return {
            id: doc.id,
            name: data.name || "Unknown User",
            email: data.email || "",
            photoUrl: data.photoUrl || data.profilePhotoUrl || "",
            profilePhotoUrl: data.profilePhotoUrl || data.photoUrl || "", 
            gender: data.gender || "",
            joinedDate: data.joinedDate || data.signUpDate || Date.now(),
            signUpDate: data.signUpDate || data.joinedDate || Date.now(),
            isBlocked: data.isBlocked || false,
            isBanned: data.isBanned || false,
            userName: data.userName || "",
            acceptMessages: data.acceptMessages !== undefined ? data.acceptMessages : false,
            isNotificationsEnabled: data.isNotificationsEnabled !== undefined ? data.isNotificationsEnabled : true
          } as User;
        });
        
        console.log("Processed users data:", usersData);
        setUsers(usersData);
        setFilteredUsers(usersData);
      } catch (error) {
        console.error("Error fetching users:", error);
        setError("حدث خطأ أثناء جلب بيانات المستخدمين");
        toast({
          title: "خطأ ف�� جلب البيانات",
          description: "حدث خطأ أثناء جلب المستخدمين. يرجى المحاولة مرة أخرى.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [toast]);

  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredUsers(users);
    } else {
      const filtered = users.filter(
        (user) =>
          (user.name && user.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (user.email && user.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (user.userName && user.userName.toLowerCase().includes(searchTerm.toLowerCase()))
      );
      setFilteredUsers(filtered);
    }
  }, [searchTerm, users]);

  const getInitials = (name: string) => {
    if (!name) return "?";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setIsEditDialogOpen(true);
  };

  const handleUserUpdated = (updatedUser: User) => {
    setUsers(users.map(user => 
      user.id === updatedUser.id ? updatedUser : user
    ));
    toast({
      title: "تم التحديث",
      description: "تم تحديث بيانات المستخدم بنجاح",
    });
  };

  const getBadgeVariant = (user: User) => {
    if (user.isBanned) return "destructive";
    return "secondary";
  };

  const getUserStatusText = (user: User) => {
    if (user.isBanned) return "محظور";
    return "نشط";
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">المستخدمون</h1>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>خطأ</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="relative w-full max-w-sm">
          <Search className="absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="البحث عن مستخدم..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pr-10"
          />
        </div>

        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="h-12 w-12 animate-spin rounded-full border-t-4 border-solid border-primary"></div>
          </div>
        ) : (
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {filteredUsers.length > 0 ? (
              filteredUsers.map((user) => (
                <Card key={user.id} className="overflow-hidden transition-all duration-200 hover:shadow-md">
                  <CardHeader className="bg-muted/20 pb-2">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center">
                        <Avatar className="h-12 w-12 ml-3 ring-2 ring-primary/10 shadow-sm">
                          <AvatarImage src={user.photoUrl || user.profilePhotoUrl} alt={user.name} />
                          <AvatarFallback className="bg-primary/5">{getInitials(user.name)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <CardTitle className="text-base">{user.name}</CardTitle>
                          {user.userName && (
                            <p className="text-sm text-muted-foreground flex items-center">
                              <UserRound className="h-3 w-3 ml-1 inline" />
                              @{user.userName}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={getBadgeVariant(user)} className="flex items-center gap-1">
                          <Shield className="h-3 w-3" />
                          {getUserStatusText(user)}
                        </Badge>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleEditUser(user)}
                          className="h-8 w-8 transition-colors hover:bg-primary/10"
                        >
                          <PenSquare className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground flex items-center">
                          <Mail className="ml-1 h-4 w-4" />
                          البريد الإلكتروني:
                        </span>
                        <HoverCard>
                          <HoverCardTrigger asChild>
                            <span className="font-medium truncate max-w-[150px] hover:underline cursor-help">
                              {user.email}
                            </span>
                          </HoverCardTrigger>
                          <HoverCardContent className="w-auto">
                            {user.email}
                          </HoverCardContent>
                        </HoverCard>
                      </div>
                      
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">الجنس:</span>
                        <span className="font-medium">{user.gender || "غير محدد"}</span>
                      </div>
                      
                      <div className="flex justify-between">
                        <span className="text-muted-foreground flex items-center">
                          <Calendar className="ml-1 h-4 w-4" />
                          تاريخ الانضمام:
                        </span>
                        <span className="font-medium">
                          {format(new Date(user.joinedDate || user.signUpDate), "PPP", { locale: ar })}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3 mt-4 border-t pt-3">
                        <div className="flex flex-col items-center justify-center p-2 rounded-lg bg-muted/20">
                          <span className="text-xs text-muted-foreground mb-1 flex items-center">
                            <Mail className="ml-1 h-3 w-3" />
                            استقبال الرسائل
                          </span>
                          <span className={`text-sm font-medium ${user.acceptMessages ? "text-green-600" : "text-red-600"}`}>
                            {user.acceptMessages ? "مفعل" : "معطل"}
                          </span>
                        </div>
                        
                        <div className="flex flex-col items-center justify-center p-2 rounded-lg bg-muted/20">
                          <span className="text-xs text-muted-foreground mb-1 flex items-center">
                            <Bell className="ml-1 h-3 w-3" />
                            الإشعارات
                          </span>
                          <span className={`text-sm font-medium ${user.isNotificationsEnabled ? "text-green-600" : "text-red-600"}`}>
                            {user.isNotificationsEnabled ? "مفعلة" : "معطلة"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="col-span-full text-center py-10 text-muted-foreground">
                لم يتم العثور على أي مستخدمين
              </div>
            )}
          </div>
        )}
      </div>
      
      <UserEditDialog 
        user={selectedUser}
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        onUserUpdated={handleUserUpdated}
      />
    </DashboardLayout>
  );
};

export default Users;
