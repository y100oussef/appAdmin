import { useState, useEffect } from "react";
import { ref, get, remove, set, push, update } from "firebase/database";
import { db as firestoreDb, rtdb } from "@/lib/firebase";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { 
  Pencil, 
  Trash2, 
  Lock, 
  Unlock, 
  MessageSquare, 
  Plus, 
  Calendar,
  MessageCircleOff
} from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import RoomEditDialog from "@/components/RoomEditDialog";
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle 
} from "@/components/ui/alert-dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Room } from "@/types";

const Rooms = () => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleteMessagesDialogOpen, setIsDeleteMessagesDialogOpen] = useState(false);
  const { toast } = useToast();

  const fetchRooms = async () => {
    try {
      setLoading(true);
      const roomsRef = ref(rtdb, "public_rooms");
      const snapshot = await get(roomsRef);
      
      if (!snapshot.exists()) {
        setRooms([]);
        return;
      }
      
      const roomsData = Object.entries(snapshot.val()).map(([id, data]) => {
        const roomData = data as any;
        return {
          id,
          name: roomData.name || "غرفة بدون اسم",
          description: roomData.description || "",
          imageUrl: roomData.imageUrl || "",
          isLocked: roomData.isLocked || roomData.locked || false,
          createdAt: roomData.createdAt || Date.now(),
          createdById: roomData.createdById || "",
          lastMessageTimestamp: roomData.lastMessageTimestamp || Date.now(),
          creatorPhotoUrl: roomData.creatorPhotoUrl || "",
        } as Room;
      });
      
      setRooms(roomsData.sort((a, b) => b.lastMessageTimestamp - a.lastMessageTimestamp));
    } catch (error) {
      console.error("Error fetching rooms:", error);
      toast({
        title: "خطأ في جلب البيانات",
        description: "حدث خطأ أثناء جلب الغرف. يرجى المحاولة مرة أخرى.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRooms();
  }, [toast]);

  const handleAddRoom = () => {
    setSelectedRoom(null);
    setIsEditDialogOpen(true);
  };

  const handleEditRoom = (room: Room) => {
    setSelectedRoom(room);
    setIsEditDialogOpen(true);
  };

  const handleDeleteClick = (room: Room) => {
    setSelectedRoom(room);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteMessagesClick = (room: Room) => {
    setSelectedRoom(room);
    setIsDeleteMessagesDialogOpen(true);
  };

  const handleDeleteRoom = async () => {
    if (!selectedRoom) return;
    
    try {
      const roomRef = ref(rtdb, `public_rooms/${selectedRoom.id}`);
      await remove(roomRef);
      
      const messagesRef = ref(rtdb, `messages/${selectedRoom.id}`);
      await remove(messagesRef);
      
      toast({
        title: "تم حذف الغرفة",
        description: "تم حذف الغرفة بنجاح",
      });
      
      fetchRooms();
    } catch (error) {
      console.error("Error deleting room:", error);
      toast({
        title: "خطأ في حذف الغرفة",
        description: "حدث خطأ أثناء حذف الغرفة. يرجى المحاولة مرة أخرى.",
        variant: "destructive",
      });
    } finally {
      setIsDeleteDialogOpen(false);
    }
  };

  const handleDeleteMessages = async () => {
    if (!selectedRoom) return;
    
    try {
      setIsDeleteMessagesDialogOpen(false);
      
      console.log(`Attempting to delete messages from: messages/${selectedRoom.id}`);
      
      const messagesPathRef = ref(rtdb, `messages/${selectedRoom.id}`);
      let messagesExist = false;
      
      try {
        const messagesSnapshot = await get(messagesPathRef);
        messagesExist = messagesSnapshot.exists();
        
        if (messagesExist) {
          await remove(messagesPathRef);
          console.log("Messages deleted successfully from messages path");
        } else {
          console.log("No messages found at messages path");
        }
      } catch (error) {
        console.error("Error checking messages path:", error);
      }
      
      const roomMessagesRef = ref(rtdb, `public_rooms/${selectedRoom.id}/messages`);
      
      try {
        const roomMessagesSnapshot = await get(roomMessagesRef);
        const roomMessagesExist = roomMessagesSnapshot.exists();
        
        if (roomMessagesExist) {
          await remove(roomMessagesRef);
          messagesExist = true;
          console.log("Messages deleted successfully from public_rooms path");
        } else {
          console.log("No messages found at public_rooms path");
        }
      } catch (error) {
        console.error("Error checking public_rooms messages path:", error);
      }
      
      const roomRef = ref(rtdb, `public_rooms/${selectedRoom.id}`);
      await update(roomRef, {
        lastMessageTimestamp: Date.now()
      });
      
      toast({
        title: messagesExist ? "تم حذف الرسائل" : "لا توجد رسائل للحذف",
        description: messagesExist 
          ? "تم حذف جميع الرسائل من هذه الغرفة بنجاح" 
          : "لم يتم العثور على أي رسائل في هذه الغرفة",
      });
      
      fetchRooms();
    } catch (error) {
      console.error("Error deleting messages:", error);
      toast({
        title: "خطأ في حذف الرسائل",
        description: "حدث خطأ أثناء حذف الرسائل. يرجى المحاولة مرة أخرى.",
        variant: "destructive",
      });
    }
  };

  const handleSaveRoom = async (room: Partial<Room>) => {
    try {
      if (selectedRoom) {
        const roomRef = ref(rtdb, `public_rooms/${selectedRoom.id}`);
        const updatedRoom = {
          ...room,
          lastMessageTimestamp: Date.now(),
        };
        
        await update(roomRef, updatedRoom);
        
        toast({
          title: "تم تحديث الغرفة",
          description: "تم تحديث بيانات الغرفة بنجاح",
        });
      } else {
        const roomsRef = ref(rtdb, "public_rooms");
        const newRoomRef = push(roomsRef);
        
        const newRoom = {
          ...room,
          createdAt: Date.now(),
          lastMessageTimestamp: Date.now(),
          createdById: "admin",
        };
        
        await set(newRoomRef, newRoom);
        
        toast({
          title: "تمت إضافة الغرفة",
          description: "تمت إضافة الغرفة الجديدة بنجاح",
        });
      }
      
      fetchRooms();
      setIsEditDialogOpen(false);
    } catch (error) {
      console.error("Error saving room:", error);
      toast({
        title: "خطأ في حفظ الغرفة",
        description: "حدث خطأ أثناء حفظ بيانات الغرفة. يرجى المحاولة مرة أخرى.",
        variant: "destructive",
      });
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-2">
        <div className="flex justify-between items-center mb-3">
          <h1 className="text-2xl font-bold">إدارة الغرف</h1>
          
          <Button 
            onClick={handleAddRoom} 
            className="bg-primary hover:bg-primary/90 text-primary-foreground flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            <span>إضافة غرفة</span>
          </Button>
        </div>
        
        {loading ? (
          <div className="grid gap-3 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <Card key={index} className="overflow-hidden border-[#eee] rounded-xl">
                <CardContent className="p-0">
                  <div className="flex flex-col">
                    <Skeleton className="h-20 w-20 rounded-full mx-auto my-4" />
                    <div className="p-3">
                      <Skeleton className="h-4 w-32 mb-2" />
                      <Skeleton className="h-3 w-full mb-2" />
                      <div className="flex justify-between gap-2 mt-3">
                        <Skeleton className="h-8 w-full" />
                        <Skeleton className="h-8 w-full" />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <ScrollArea className="h-[calc(100vh-10rem)]">
            <div className="grid gap-3 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 pb-4 pr-0 grid-flow-row-dense rtl">
              {rooms.length > 0 ? (
                rooms.map((room, index) => (
                  <motion.div
                    key={room.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="text-right"
                  >
                    <Card className="overflow-hidden border border-[#e6deb5] shadow-sm hover:shadow-md transition-shadow duration-200 bg-[#F8F3D9] rounded-xl h-full">
                      <CardContent className="p-3 flex flex-col h-full">
                        <div className="flex items-start gap-3 flex-row-reverse flex-1">
                          <Avatar className="h-16 w-16 border border-[#e6deb5]">
                            {room.imageUrl ? (
                              <AvatarImage 
                                src={room.imageUrl} 
                                alt={room.name}
                                className="object-cover"
                              />
                            ) : (
                              <AvatarFallback className="bg-[#f0eacf] text-[#7a7254]">
                                <MessageSquare className="h-6 w-6" />
                              </AvatarFallback>
                            )}
                          </Avatar>
                          
                          <div className="flex-1 min-w-0 flex flex-col h-full">
                            <div className="flex items-center justify-between mb-1">
                              <div className="flex items-center gap-1 text-xs text-[#7a7254] whitespace-nowrap">
                                {room.isLocked ? 
                                  <Lock className="h-3 w-3 text-amber-600" /> : 
                                  <Unlock className="h-3 w-3 text-green-600" />
                                }
                                <span>{room.isLocked ? "مغلقة" : "مفتوحة"}</span>
                              </div>
                              
                              <h3 className="font-medium text-[#5d573f] truncate">{room.name}</h3>
                            </div>
                            
                            <div className="text-sm text-[#7a7254] line-clamp-2 mb-2 h-10">
                              {room.description || "لا يوجد وصف"}
                            </div>
                            
                            <div className="text-xs text-[#7a7254] mb-3 flex items-center gap-1 justify-end mt-auto">
                              <span dir="ltr">
                                {format(new Date(room.lastMessageTimestamp), "dd/MM/yyyy", { locale: ar })}
                              </span>
                              <Calendar className="h-3 w-3" />
                            </div>
                            
                            <div className="grid grid-cols-3 gap-1 w-full">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEditRoom(room);
                                }}
                                className="w-full justify-center py-1 px-0.5 h-auto min-h-[2rem] text-xs font-normal text-[#5d573f] border-[#e6deb5] hover:bg-[#f0eacf] hover:text-[#45412e]"
                              >
                                <Pencil className="h-3 w-3 ml-1" />
                                <span className="truncate">تعديل</span>
                              </Button>
                              
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteMessagesClick(room);
                                }}
                                className="w-full justify-center py-1 px-0.5 h-auto min-h-[2rem] text-xs font-normal text-amber-600 border-amber-100 hover:bg-amber-50 hover:text-amber-700"
                              >
                                <MessageCircleOff className="h-3 w-3 ml-1" />
                                <span className="truncate">حذف الرسائل</span>
                              </Button>
                              
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteClick(room);
                                }}
                                className="w-full justify-center py-1 px-0.5 h-auto min-h-[2rem] text-xs font-normal text-rose-600 border-rose-100 hover:bg-rose-50 hover:text-rose-700"
                              >
                                <Trash2 className="h-3 w-3 ml-1" />
                                <span className="truncate">حذف</span>
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))
              ) : (
                <div className="col-span-full flex flex-col items-center justify-center py-8 text-center">
                  <div className="rounded-full bg-[#f0eacf] p-4 mb-3">
                    <MessageSquare className="h-10 w-10 text-[#7a7254]" />
                  </div>
                  <h3 className="text-lg font-medium mb-2 text-[#5d573f]">لا توجد غرف دردشة</h3>
                  <p className="text-[#7a7254] mb-4 text-sm max-w-md">قم بإضافة غرفة جديدة للبدء</p>
                  <Button onClick={handleAddRoom} className="flex items-center gap-2 px-6 bg-primary hover:bg-primary/90">
                    <Plus className="h-4 w-4" />
                    <span>إضافة غرفة جديدة</span>
                  </Button>
                </div>
              )}
            </div>
          </ScrollArea>
        )}
      </div>
      
      <RoomEditDialog 
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        room={selectedRoom}
        onSave={handleSaveRoom}
      />
      
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>هل أنت متأكد من حذف الغرفة؟</AlertDialogTitle>
            <AlertDialogDescription>
              سيتم حذف الغرفة وجميع المحادثات فيها بشكل نهائي.
              لا يمكن التراجع عن هذا الإجراء.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteRoom} className="bg-destructive text-destructive-foreground">
              حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      <AlertDialog open={isDeleteMessagesDialogOpen} onOpenChange={setIsDeleteMessagesDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>هل أنت متأكد من حذف جميع الرسائل؟</AlertDialogTitle>
            <AlertDialogDescription>
              سيتم حذف جميع الرسائل في هذه الغرفة بشكل نهائي.
              ستبقى الغرفة نفسها دون أي تغيير.
              لا يمكن التراجع عن هذا الإجراء.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteMessages} className="bg-destructive text-destructive-foreground">
              حذف الرسائل
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
};

export default Rooms;
