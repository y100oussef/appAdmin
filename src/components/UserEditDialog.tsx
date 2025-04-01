
import { useEffect, useState } from "react";
import { User } from "@/types";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Check, X, Ban, MessageSquare, Bell } from "lucide-react";

interface UserEditDialogProps {
  user: User | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUserUpdated: (updatedUser: User) => void;
}

const UserEditDialog = ({ user, open, onOpenChange, onUserUpdated }: UserEditDialogProps) => {
  const [editedUser, setEditedUser] = useState<User | null>(user);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  // Update local state when user prop changes
  useEffect(() => {
    setEditedUser(user);
  }, [user]);

  if (!editedUser) return null;

  const handleSave = async () => {
    if (!editedUser) return;
    
    try {
      setIsSubmitting(true);
      
      // Update user document in Firestore
      const userRef = doc(db, "users", editedUser.id);
      
      // Prepare update data (only send fields that exist in the database)
      const updateData = {
        name: editedUser.name,
        email: editedUser.email,
        gender: editedUser.gender,
        userName: editedUser.userName || "",
        isBanned: editedUser.isBanned || false,
        acceptMessages: editedUser.acceptMessages || false,
        isNotificationsEnabled: editedUser.isNotificationsEnabled || false,
      };
      
      await updateDoc(userRef, updateData);
      
      // Notify the parent component of the update
      onUserUpdated(editedUser);
      
      toast({
        title: "تم التحديث",
        description: "تم تحديث بيانات المستخدم بنجاح",
      });
      
      // Close the dialog
      onOpenChange(false);
    } catch (error) {
      console.error("Error updating user:", error);
      toast({
        variant: "destructive",
        title: "خطأ",
        description: "حدث خطأ أثناء تحديث بيانات المستخدم",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>تعديل بيانات المستخدم</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">الاسم</Label>
                <Input
                  id="name"
                  value={editedUser.name}
                  onChange={(e) => setEditedUser({...editedUser, name: e.target.value})}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="userName">اسم المستخدم</Label>
                <Input
                  id="userName"
                  value={editedUser.userName || ""}
                  onChange={(e) => setEditedUser({...editedUser, userName: e.target.value})}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">البريد الإلكتروني</Label>
                <Input
                  id="email"
                  type="email"
                  value={editedUser.email}
                  onChange={(e) => setEditedUser({...editedUser, email: e.target.value})}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="gender">الجنس</Label>
                <Input
                  id="gender"
                  value={editedUser.gender}
                  onChange={(e) => setEditedUser({...editedUser, gender: e.target.value})}
                />
              </div>
            </div>
            
            <div className="space-y-4 pt-4 border-t">
              <div className="flex items-center justify-between p-3 rounded-lg bg-red-50/50 border border-red-100">
                <Label htmlFor="isBanned" className="flex items-center">
                  <Ban className="mr-2 h-4 w-4 text-destructive" />
                  <div className="flex flex-col">
                    <span className="text-destructive font-medium">حظر المستخدم</span>
                    <span className="text-xs text-muted-foreground">(يمنع المستخدم من استخدام التطبيق)</span>
                  </div>
                </Label>
                <Switch
                  id="isBanned"
                  checked={editedUser.isBanned || false}
                  onCheckedChange={(checked) => setEditedUser({...editedUser, isBanned: checked})}
                  className="data-[state=checked]:bg-destructive"
                />
              </div>
              
              <div className="flex items-center justify-between p-3 rounded-lg bg-blue-50/50 border border-blue-100">
                <Label htmlFor="acceptMessages" className="flex items-center">
                  <MessageSquare className="mr-2 h-4 w-4 text-blue-600" />
                  <div className="flex flex-col">
                    <span className="font-medium">استقبال الرسائل</span>
                    <span className="text-xs text-muted-foreground">(السماح للمستخدمين الآخرين بإرسال رسائل)</span>
                  </div>
                </Label>
                <Switch
                  id="acceptMessages"
                  checked={editedUser.acceptMessages || false}
                  onCheckedChange={(checked) => setEditedUser({...editedUser, acceptMessages: checked})}
                />
              </div>
              
              <div className="flex items-center justify-between p-3 rounded-lg bg-green-50/50 border border-green-100">
                <Label htmlFor="isNotificationsEnabled" className="flex items-center">
                  <Bell className="mr-2 h-4 w-4 text-green-600" />
                  <div className="flex flex-col">
                    <span className="font-medium">تفعيل الإشعارات</span>
                    <span className="text-xs text-muted-foreground">(استقبال إشعارات التطبيق)</span>
                  </div>
                </Label>
                <Switch
                  id="isNotificationsEnabled"
                  checked={editedUser.isNotificationsEnabled || false}
                  onCheckedChange={(checked) => setEditedUser({...editedUser, isNotificationsEnabled: checked})}
                />
              </div>
            </div>
          </div>
        </div>
        
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            <X className="ml-2 h-4 w-4" />
            إلغاء
          </Button>
          <Button onClick={handleSave} disabled={isSubmitting} className="min-w-[100px]">
            {isSubmitting ? (
              <div className="h-4 w-4 animate-spin rounded-full border-t-2 border-background"></div>
            ) : (
              <Check className="ml-2 h-4 w-4" />
            )}
            حفظ
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default UserEditDialog;
