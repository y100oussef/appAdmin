
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { getDatabase, ref, set } from "firebase/database";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

const formSchema = z.object({
  urlsText: z.string().min(1, "يرجى إدخال رابط واحد على الأقل"),
});

type BatchUploadFormValues = z.infer<typeof formSchema>;

interface BatchUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BatchUploadDialog({ open, onOpenChange }: BatchUploadDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<BatchUploadFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      urlsText: "",
    },
  });

  const onSubmit = async (data: BatchUploadFormValues) => {
    try {
      setIsSubmitting(true);
      const db = getDatabase();

      // Parse URLs from the text input
      // URLs can be separated by commas, new lines, or both
      const urls = data.urlsText
        .split(/[,\n]+/)
        .map(url => url.trim())
        .filter(url => url.length > 0);

      if (urls.length === 0) {
        toast.error("لم يتم العثور على روابط صالحة");
        setIsSubmitting(false);
        return;
      }

      // Add each URL as a new wallpaper
      let successCount = 0;
      let failCount = 0;

      for (const url of urls) {
        try {
          // Validate URL format
          if (!url.match(/^(http|https):\/\/[^ "]+$/)) {
            failCount++;
            console.error(`Invalid URL format: ${url}`);
            continue;
          }

          const id = Date.now().toString() + Math.floor(Math.random() * 1000).toString();
          const wallpaperRef = ref(db, `wallpapers/${id}`);

          await set(wallpaperRef, {
            id,
            wallpaperUrl: url,
            addTime: Date.now(),
          });

          successCount++;
        } catch (error) {
          failCount++;
          console.error(`Error adding wallpaper: ${url}`, error);
        }
      }

      if (successCount > 0) {
        toast.success(`تم إضافة ${successCount} خلفية بنجاح${failCount > 0 ? ` (فشل إضافة ${failCount})` : ''}`);
        form.reset();
        onOpenChange(false);
      } else {
        toast.error("فشلت إضافة جميع الخلفيات");
      }
    } catch (error) {
      console.error("Error in batch upload:", error);
      toast.error("حدث خطأ أثناء معالجة الطلب");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>رفع خلفيات متعددة</DialogTitle>
          <DialogDescription>
            أدخل روابط الخلفيات مفصولة بفواصل أو أسطر جديدة
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="urlsText"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>روابط الخلفيات</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="https://example.com/image1.jpg,&#10;https://example.com/image2.jpg"
                      className="min-h-[200px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                إلغاء
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "جاري الرفع..." : "رفع الخلفيات"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
