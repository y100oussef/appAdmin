
import { useEffect, useState, useRef } from "react";
import { Song } from "@/types";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Music, Link, Image, FileText, Trash, Upload } from "lucide-react";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";

interface AddSongSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  song: Song | null;
  onSave: (song: Partial<Song>) => void;
  onDelete?: (songId: string) => void;
}

const AddSongSheet = ({ open, onOpenChange, song, onSave, onDelete }: AddSongSheetProps) => {
  const [name, setName] = useState("");
  const [songUrl, setSongUrl] = useState("");
  const [songPhoto, setSongPhoto] = useState("");
  const [songLyrics, setSongLyrics] = useState("");
  const [visible, setVisible] = useState(true); // Changed default to true
  const [adRequired, setAdRequired] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const isMobile = useIsMobile();
  
  // Reset form when song changes
  useEffect(() => {
    if (song) {
      setName(song.name || "");
      setSongUrl(song.songUrl || "");
      setSongPhoto(song.songPhoto || "");
      setSongLyrics(song.songLyrics || "");
      setVisible(song.visible || false);
      setAdRequired(song.adRequired || false);
    } else {
      // Reset form for new song
      setName("");
      setSongUrl("");
      setSongPhoto("");
      setSongLyrics("");
      setVisible(true); // Changed default to true for new songs
      setAdRequired(false);
    }
  }, [song, open]);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const songData: Partial<Song> = {
      name,
      songUrl,
      songPhoto,
      songLyrics,
      visible,
      adRequired,
    };
    
    if (song) {
      // For editing, include the ID
      songData.id = song.id;
    }
    
    onSave(songData);
  };

  const handleDelete = () => {
    if (song && song.id && onDelete) {
      onDelete(song.id);
      onOpenChange(false);
    }
  };

  const handleFileSelection = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file type - updated to support text files with or without .txt extension
    const isTextFile = file.type === 'text/plain' || 
                       file.name.toLowerCase().endsWith('.txt') || 
                       file.name.toLowerCase().endsWith('.text');
    
    if (!isTextFile) {
      toast({
        title: "نوع ملف غير صالح",
        description: "يرجى اختيار ملف نصي (.txt أو .text)",
        variant: "destructive",
      });
      return;
    }

    // Check file size (limit to 1MB)
    if (file.size > 1024 * 1024) {
      toast({
        title: "الملف كبير جداً",
        description: "يجب أن يكون حجم الملف أقل من 1 ميجابايت",
        variant: "destructive",
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setSongLyrics(event.target.result as string);
        toast({
          title: "تم تحميل الكلمات",
          description: `تم تحميل الكلمات من الملف "${file.name}"`,
        });
      }
    };
    reader.onerror = () => {
      toast({
        title: "خطأ في قراءة الملف",
        description: "حدث خطأ أثناء قراءة الملف، يرجى المحاولة مرة أخرى",
        variant: "destructive",
      });
    };
    reader.readAsText(file);
    
    // Reset the input value to allow selecting the same file again
    e.target.value = '';
  };
  
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto" side={isMobile ? "bottom" : "right"}>
        <SheetHeader>
          <SheetTitle>{song ? "تعديل الأغنية" : "إضافة أغنية جديدة"}</SheetTitle>
          <SheetDescription>
            {song ? "قم بتعديل بيانات الأغنية ثم انقر على حفظ التغييرات" : "أدخل بيانات الأغنية الجديدة ثم انقر على إضافة"}
          </SheetDescription>
        </SheetHeader>
        
        {songPhoto && (
          <div className="mt-4">
            <AspectRatio ratio={16 / 9} className="bg-muted rounded-md overflow-hidden">
              <img 
                src={songPhoto} 
                alt={name || "صورة الأغنية"} 
                className="w-full h-full object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = "/placeholder.svg";
                }} 
              />
            </AspectRatio>
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="mt-6 space-y-4 pb-8">
          <div className="space-y-2">
            <Label htmlFor="name" className="flex items-center gap-2">
              <Music className="h-4 w-4" />
              اسم الأغنية
            </Label>
            <Input 
              id="name" 
              value={name} 
              onChange={(e) => setName(e.target.value)} 
              required 
              placeholder="أدخل اسم الأغنية"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="songUrl" className="flex items-center gap-2">
              <Link className="h-4 w-4" />
              رابط الأغنية
            </Label>
            <Input 
              id="songUrl" 
              value={songUrl} 
              onChange={(e) => setSongUrl(e.target.value)} 
              required 
              placeholder="أدخل رابط ملف الأغنية"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="songPhoto" className="flex items-center gap-2">
              <Image className="h-4 w-4" />
              رابط صورة الأغنية
            </Label>
            <Input 
              id="songPhoto" 
              value={songPhoto} 
              onChange={(e) => setSongPhoto(e.target.value)} 
              placeholder="أدخل رابط صورة الغلاف (اختياري)"
            />
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between mb-2">
              <Label htmlFor="songLyrics" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                كلمات الأغنية
              </Label>
              <Button 
                type="button" 
                variant="outline" 
                size="sm" 
                onClick={handleFileSelection}
                className="h-8 text-xs"
              >
                <Upload className="h-3.5 w-3.5 mr-1" />
                تحميل من ملف
              </Button>
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept=".txt,.text,text/plain"
                onChange={handleFileUpload}
              />
            </div>
            <Textarea 
              id="songLyrics" 
              value={songLyrics} 
              onChange={(e) => setSongLyrics(e.target.value)} 
              placeholder="أدخل كلمات الأغنية (اختياري)"
              className="min-h-32"
            />
          </div>
          
          <div className="flex items-center justify-between">
            <Label htmlFor="visible" className="cursor-pointer flex items-center gap-2">
              مرئية للمستخدمين
            </Label>
            <Switch 
              id="visible" 
              checked={visible} 
              onCheckedChange={setVisible}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <Label htmlFor="adRequired" className="cursor-pointer flex items-center gap-2">
              إعلان مطلوب قبل التشغيل
            </Label>
            <Switch 
              id="adRequired" 
              checked={adRequired} 
              onCheckedChange={setAdRequired}
            />
          </div>
          
          <div className="pt-4 space-y-2">
            <Button 
              type="submit" 
              className="w-full add-song-button overflow-hidden relative"
            >
              <span className="relative z-10">
                {song ? "حفظ التغييرات" : "إضافة الأغنية"}
              </span>
            </Button>
            
            {song && onDelete && (
              <Button 
                type="button"
                variant="destructive"
                className="w-full"
                onClick={handleDelete}
              >
                <Trash className="h-4 w-4 mr-2" />
                حذف الأغنية
              </Button>
            )}
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
};

export default AddSongSheet;
