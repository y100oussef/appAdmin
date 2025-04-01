
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Lock, Unlock } from "lucide-react";

interface Room {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  isLocked: boolean;
  createdAt: number;
  createdById: string;
  lastMessageTimestamp: number;
  creatorPhotoUrl?: string;
}

interface RoomEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  room: Room | null;
  onSave: (room: Partial<Room>) => void;
}

const RoomEditDialog = ({ open, onOpenChange, room, onSave }: RoomEditDialogProps) => {
  const [formData, setFormData] = useState<Partial<Room>>({
    name: "",
    description: "",
    imageUrl: "",
    isLocked: false,
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (room) {
      setFormData({
        name: room.name || "",
        description: room.description || "",
        imageUrl: room.imageUrl || "",
        isLocked: room.isLocked || false,
      });
    } else {
      setFormData({
        name: "",
        description: "",
        imageUrl: "",
        isLocked: false,
      });
    }
  }, [room, open]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSwitchChange = (checked: boolean) => {
    setFormData((prev) => ({ ...prev, isLocked: checked }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      await onSave(formData);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-center text-xl">
            {room ? "تعديل غرفة الدردشة" : "إضافة غرفة دردشة جديدة"}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6 pt-4">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">اسم الغرفة</Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="أدخل اسم الغرفة"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">وصف الغرفة</Label>
              <Textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="أدخل وصفاً للغرفة"
                rows={3}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="imageUrl">رابط الصورة</Label>
              <Input
                id="imageUrl"
                name="imageUrl"
                value={formData.imageUrl}
                onChange={handleChange}
                placeholder="أدخل رابط صورة الغرفة (اختياري)"
              />
            </div>
            
            <div className="flex items-center justify-between space-x-2">
              <div className="space-y-0.5">
                <Label htmlFor="isLocked">قفل الغرفة</Label>
                <p className="text-sm text-muted-foreground">
                  الغرف المقفلة محدودة الوصول
                </p>
              </div>
              
              <div className="flex items-center space-x-2 space-x-reverse">
                <Switch
                  id="isLocked"
                  checked={formData.isLocked}
                  onCheckedChange={handleSwitchChange}
                />
                {formData.isLocked ? 
                  <Lock className="h-4 w-4 text-amber-500" /> : 
                  <Unlock className="h-4 w-4 text-green-500" />
                }
              </div>
            </div>
          </div>
          
          <DialogFooter className="gap-2 sm:gap-0">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              إلغاء
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting}
              className="relative"
            >
              {isSubmitting && (
                <div className="absolute inset-0 flex items-center justify-center bg-primary rounded-md">
                  <div className="h-5 w-5 animate-spin rounded-full border-t-2 border-t-primary-foreground border-r-2 border-r-transparent" />
                </div>
              )}
              {room ? "تحديث الغرفة" : "إضافة غرفة"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default RoomEditDialog;
