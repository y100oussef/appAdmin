
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { getDatabase, ref, set, remove } from "firebase/database";
import { Wallpaper } from "@/types";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const formSchema = z.object({
  wallpaperUrl: z.string().url("يجب إدخال رابط صالح للصورة"),
});

type WallpaperFormValues = z.infer<typeof formSchema>;

interface WallpaperFormProps {
  wallpaper?: Wallpaper;
  onSuccess: () => void;
  onCancel: () => void;
}

export function WallpaperForm({ wallpaper, onSuccess, onCancel }: WallpaperFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const isEditing = !!wallpaper;

  const form = useForm<WallpaperFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      wallpaperUrl: wallpaper?.wallpaperUrl || "",
    },
  });

  const onSubmit = async (data: WallpaperFormValues) => {
    try {
      setIsSubmitting(true);
      const db = getDatabase();
      const wallpaperId = wallpaper?.id || Date.now().toString();
      const wallpapersRef = ref(db, `wallpapers/${wallpaperId}`);
      
      await set(wallpapersRef, {
        id: wallpaperId,
        wallpaperUrl: data.wallpaperUrl,
        addTime: wallpaper?.addTime || Date.now(),
      });

      toast.success(isEditing ? "تم تعديل الخلفية بنجاح" : "تم إضافة الخلفية بنجاح");
      
      onSuccess();
    } catch (error) {
      console.error("Error saving wallpaper:", error);
      toast.error("لم يتم حفظ الخلفية بنجاح");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!wallpaper) return;
    
    if (!window.confirm("هل أنت متأكد من حذف هذه الخلفية؟")) {
      return;
    }
    
    try {
      setIsSubmitting(true);
      const db = getDatabase();
      const wallpaperRef = ref(db, `wallpapers/${wallpaper.id}`);
      
      await remove(wallpaperRef);
      
      toast.success("تم حذف الخلفية بنجاح");
      
      onSuccess();
    } catch (error) {
      console.error("Error deleting wallpaper:", error);
      toast.error("لم يتم حذف الخلفية بنجاح");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleImageLoad = () => {
    setImageLoaded(true);
    setImageError(false);
  };

  const handleImageError = () => {
    setImageLoaded(false);
    setImageError(true);
  };

  const currentUrl = form.watch("wallpaperUrl");

  return (
    <Card>
      <CardHeader>
        <CardTitle>{isEditing ? "تعديل خلفية" : "إضافة خلفية جديدة"}</CardTitle>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="wallpaperUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>رابط الصورة</FormLabel>
                  <FormControl>
                    <Input placeholder="https://example.com/image.jpg" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Image preview */}
            {currentUrl && (
              <div className="mt-4">
                <p className="text-sm font-medium mb-2">معاينة:</p>
                <div className="relative aspect-[9/16] w-full max-w-[200px] overflow-hidden rounded-md border">
                  {imageError && (
                    <div className="flex h-full w-full items-center justify-center bg-muted text-muted-foreground">
                      خطأ في تحميل الصورة
                    </div>
                  )}
                  <img 
                    src={currentUrl} 
                    alt="معاينة الخلفية" 
                    className={`h-full w-full object-cover ${imageLoaded ? 'block' : 'hidden'}`}
                    onLoad={handleImageLoad}
                    onError={handleImageError}
                  />
                </div>
              </div>
            )}
          </CardContent>

          <CardFooter className="flex justify-between">
            <Button type="button" variant="outline" onClick={onCancel}>
              إلغاء
            </Button>
            <div className="flex gap-2">
              {isEditing && (
                <Button 
                  type="button" 
                  variant="destructive" 
                  onClick={handleDelete}
                  disabled={isSubmitting}
                >
                  حذف
                </Button>
              )}
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "جاري الحفظ..." : isEditing ? "تعديل" : "إضافة"}
              </Button>
            </div>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
