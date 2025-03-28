import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { getDatabase, ref, push, serverTimestamp, onValue } from "firebase/database";
import { toast } from "@/hooks/use-toast";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Info } from "lucide-react";
import { Notification } from "@/types";

const formSchema = z.object({
  title: z.string().min(1, "العنوان مطلوب"),
  body: z.string().min(1, "نص الإشعار مطلوب"),
  imageUrl: z.string().optional().or(z.literal("")),
  actionUrl: z.string().optional().or(z.literal("")),
  fcmServerUrl: z.string().url("رابط غير صالح").optional().or(z.literal("")),
});

type NotificationFormValues = z.infer<typeof formSchema>;

const FCM_SERVER_URL_KEY = "fcmServerUrl";

const Notifications = () => {
  const [isSending, setIsSending] = useState(false);
  const [firebaseStatus, setFirebaseStatus] = useState<"checking" | "connected" | "error">("checking");
  const [recentNotifications, setRecentNotifications] = useState<Notification[]>([]);
  const [serverUrl, setServerUrl] = useState<string>(() => {
    return localStorage.getItem(FCM_SERVER_URL_KEY) || "https://apple-lead-comic.glitch.me";
  });
  
  const form = useForm<NotificationFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      body: "",
      imageUrl: "",
      actionUrl: "",
      fcmServerUrl: serverUrl,
    },
  });

  useEffect(() => {
    form.setValue("fcmServerUrl", serverUrl);
  }, [serverUrl, form]);

  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === "fcmServerUrl" && value.fcmServerUrl) {
        try {
          new URL(value.fcmServerUrl as string);
          localStorage.setItem(FCM_SERVER_URL_KEY, value.fcmServerUrl as string);
          setServerUrl(value.fcmServerUrl as string);
        } catch (e) {
        }
      }
    });
    
    return () => subscription.unsubscribe();
  }, [form]);

  useEffect(() => {
    const db = getDatabase();
    
    try {
      console.log("Testing Firebase connection to notifications path...");
      const notificationsRef = ref(db, "notifications");
      
      const unsubscribe = onValue(notificationsRef, (snapshot) => {
        if (snapshot.exists()) {
          console.log("Successfully connected to notifications data");
          const data = snapshot.val();
          
          const notificationsArray = Object.keys(data || {}).map((key) => ({
            id: key,
            ...data[key],
          })) as Notification[];
          
          notificationsArray.sort((a, b) => b.sentAt - a.sentAt);
          
          setRecentNotifications(notificationsArray.slice(0, 5));
          setFirebaseStatus("connected");
          console.log("Loaded recent notifications:", notificationsArray.slice(0, 5));
        } else {
          console.log("Notifications path exists but is empty");
          setFirebaseStatus("connected");
          setRecentNotifications([]);
        }
      }, (error) => {
        console.error("Error connecting to Firebase notifications:", error);
        setFirebaseStatus("error");
      });
      
      return () => unsubscribe();
    } catch (error) {
      console.error("Exception when setting up Firebase connection:", error);
      setFirebaseStatus("error");
    }
  }, []);

  const sendNotificationToFCMServer = async (data: NotificationFormValues) => {
    const url = data.fcmServerUrl || serverUrl;
    
    if (!url) {
      throw new Error("FCM Server URL is required");
    }
    
    localStorage.setItem(FCM_SERVER_URL_KEY, url);
    setServerUrl(url);
    
    const sendUrl = url.endsWith('/send') ? url : `${url}/send`;
    
    console.log("Sending notification to FCM server:", sendUrl);
    
    const payload = {
      title: data.title,
      body: data.body,
      topic: "all"
    } as any;
    
    if (data.imageUrl && data.imageUrl.trim() !== "") {
      payload.imageUrl = data.imageUrl;
    }
    
    if (data.actionUrl && data.actionUrl.trim() !== "") {
      payload.actionUrl = data.actionUrl;
    }
    
    const response = await fetch(sendUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.110 Safari/537.36'
      },
      body: JSON.stringify(payload),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error("FCM server responded with error:", response.status, errorText);
      throw new Error(`FCM server responded with error: ${response.status} ${errorText}`);
    }
    
    return await response.json();
  };

  const onSubmit = async (data: NotificationFormValues) => {
    console.log("Attempting to send notification:", data);
    try {
      setIsSending(true);
      
      if (data.fcmServerUrl && data.fcmServerUrl.trim() !== "") {
        localStorage.setItem(FCM_SERVER_URL_KEY, data.fcmServerUrl);
        setServerUrl(data.fcmServerUrl);
      }
      
      if (data.fcmServerUrl || serverUrl) {
        try {
          const fcmResult = await sendNotificationToFCMServer(data);
          console.log("Successfully sent notification via FCM server:", fcmResult);
        } catch (fcmError) {
          console.error("Error sending notification via FCM server:", fcmError);
          toast({
            title: "تحذير",
            description: "تم حفظ الإشعار ولكن حدث خطأ أثناء إرساله عبر الخادم الخارجي: " + (fcmError instanceof Error ? fcmError.message : String(fcmError)),
            variant: "destructive",
          });
        }
      }
      
      const db = getDatabase();
      const notificationsRef = ref(db, "notifications");
      
      console.log("Pushing notification to Firebase path:", notificationsRef.toString());
      
      const newNotification = {
        title: data.title,
        body: data.body,
        sent: true,
        sentAt: Date.now(),
        topic: "all"
      } as any;
      
      if (data.imageUrl && data.imageUrl.trim() !== "") {
        newNotification.imageUrl = data.imageUrl;
      }
      
      if (data.actionUrl && data.actionUrl.trim() !== "") {
        newNotification.actionUrl = data.actionUrl;
      }
      
      console.log("Saving notification to database:", newNotification);
      
      const result = await push(notificationsRef, newNotification);
      console.log("Notification successfully pushed to Firebase with key:", result.key);
      
      toast({
        title: "تم إرسال الإشعار بنجاح",
        description: "تم إرسال الإشعار إلى جميع المستخدمين (topic: all)",
      });
      
      if (result.key) {
        const newNotificationWithId: Notification = {
          id: result.key,
          ...newNotification,
        };
        
        setRecentNotifications(prev => [
          newNotificationWithId,
          ...prev.filter(n => n.id !== newNotificationWithId.id)
        ].slice(0, 5));
      }
      
      form.reset({
        title: "",
        body: "",
        imageUrl: "",
        actionUrl: "",
        fcmServerUrl: serverUrl,
      });
    } catch (error) {
      console.error("Error sending notification:", error);
      toast({
        title: "خطأ في إرسال الإشعار",
        description: "حدث خطأ أثناء محاولة إرسال الإشعار: " + (error instanceof Error ? error.message : String(error)),
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="container mx-auto p-6">
        <h1 className="text-3xl font-bold mb-6">إرسال إشعارات</h1>
        
        {firebaseStatus === "checking" && (
          <Alert className="mb-6">
            <Info className="h-4 w-4" />
            <AlertTitle>جاري التحقق من الاتصال</AlertTitle>
            <AlertDescription>
              جاري التحقق من الاتصال بقاعدة البيانات...
            </AlertDescription>
          </Alert>
        )}
        
        {firebaseStatus === "error" && (
          <Alert variant="destructive" className="mb-6">
            <Info className="h-4 w-4" />
            <AlertTitle>خطأ في الاتصال</AlertTitle>
            <AlertDescription>
              تعذر الاتصال بقاعدة البيانات. يرجى التحقق من اتصال الإنترنت وإعدادات Firebase.
            </AlertDescription>
          </Alert>
        )}
        
        <div className="grid gap-6 md:grid-cols-2">
          <Card className="max-w-2xl">
            <CardHeader>
              <CardTitle>إرسال إشعارات إلى المستخدمين</CardTitle>
              <CardDescription>
                قم بإدخال تفاصيل الإشعار وسيتم إرساله إلى جميع مستخدمي التطبيق
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="fcmServerUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>رابط خادم FCM (خارجي)</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="https://your-fcm-server.com"
                            {...field} 
                          />
                        </FormControl>
                        <FormDescription>
                          أدخل رابط خادم FCM الخارجي لإرسال الإشعارات (سيتم حفظه تلقائيًا)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>عنوان الإشعار</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="أدخل عنوان الإشعار"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="body"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>نص الإشعار</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="أدخل نص الإشعار"
                            className="resize-none min-h-[100px]"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="imageUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>رابط الصورة (اختياري)</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="https://example.com/image.jpg"
                            {...field} 
                          />
                        </FormControl>
                        <FormDescription>
                          رابط صورة سيتم عرضها مع الإشعار (اختياري)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="actionUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>رابط الإجراء (اختياري)</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="https://example.com"
                            {...field} 
                          />
                        </FormControl>
                        <FormDescription>
                          رابط سيتم فتحه عند النقر على الإشعار (اختياري)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <Button 
                    type="submit" 
                    className="w-full"
                    disabled={isSending || firebaseStatus !== "connected"}
                  >
                    {isSending ? "جاري الإرسال..." : "إرسال الإشعار"}
                  </Button>
                </form>
              </Form>
            </CardContent>
            <CardFooter className="flex flex-col items-start">
              <p className="text-sm text-muted-foreground">
                سيتم إرسال الإشعار إلى جميع المستخدمين المسجلين في التطبيق
              </p>
            </CardFooter>
          </Card>
          
          {firebaseStatus === "connected" && (
            <Card>
              <CardHeader>
                <CardTitle>آخر الإشعارات المرسلة</CardTitle>
                <CardDescription>
                  قائمة بآخر 5 إشعارات تم إرسالها
                </CardDescription>
              </CardHeader>
              <CardContent>
                {recentNotifications.length === 0 ? (
                  <p className="text-muted-foreground text-center py-6">لم يتم إرسال أي إشعارات بعد</p>
                ) : (
                  <div className="space-y-4">
                    {recentNotifications.map((notification) => (
                      <Card key={notification.id} className="border shadow-sm">
                        <CardHeader className="p-4 pb-2">
                          <CardTitle className="text-base">{notification.title}</CardTitle>
                          <CardDescription className="text-xs">
                            {new Date(notification.sentAt).toLocaleString('ar-SA')}
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="p-4 pt-0">
                          <p className="text-sm">{notification.body}</p>
                          {notification.imageUrl && (
                            <p className="text-xs text-muted-foreground mt-2">
                              صورة: {notification.imageUrl.substring(0, 30)}...
                            </p>
                          )}
                          {notification.actionUrl && (
                            <p className="text-xs text-muted-foreground">
                              رابط: {notification.actionUrl.substring(0, 30)}...
                            </p>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Notifications;
