import { useEffect, useState } from "react";
import { collection, getDocs, query, limit, orderBy, addDoc, updateDoc, doc } from "firebase/firestore";
import { get, ref, update } from "firebase/database";
import { db, rtdb } from "@/lib/firebase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { User, Song, AppUpdates } from "@/types";
import DashboardLayout from "@/components/DashboardLayout";
import { 
  Users, Music, Clock, AlertCircle, Plus, Edit, 
  Settings, BellRing, Megaphone, MessageSquare, Image 
} from "lucide-react";
import { formatDistance } from "date-fns";
import { ar } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import AddSongSheet from "@/components/AddSongSheet";
import { 
  Accordion, 
  AccordionContent, 
  AccordionItem, 
  AccordionTrigger 
} from "@/components/ui/accordion";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

interface AdsSettings {
  banner: {
    music: boolean;
    online: boolean;
    wallpapers: boolean;
  };
  fullAd: {
    fullAdsCountChat: number;
    fullAdsCountSongs: number;
  };
}

const Dashboard = () => {
  const [usersCount, setUsersCount] = useState<number>(0);
  const [songsCount, setSongsCount] = useState<number>(0);
  const [roomsCount, setRoomsCount] = useState<number>(0);
  const [wallpapersCount, setWallpapersCount] = useState<number>(0);
  const [latestSongs, setLatestSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState<boolean>(false);
  const [editingSong, setEditingSong] = useState<Song | null>(null);
  const { toast } = useToast();

  const [adsSettings, setAdsSettings] = useState<AdsSettings>({
    banner: {
      music: true,
      online: true,
      wallpapers: true
    },
    fullAd: {
      fullAdsCountChat: 3,
      fullAdsCountSongs: 3
    }
  });
  
  const [appUpdates, setAppUpdates] = useState<AppUpdates>({
    isEnabled: false,
    title: "",
    message: "",
    newVer: 1,
    urlToOpen: "",
    isCancelable: true
  });
  
  const [isSavingSettings, setIsSavingSettings] = useState<boolean>(false);

  const handleAddSong = () => {
    setEditingSong(null);
    setIsSheetOpen(true);
  };

  const handleEditSong = (song: Song) => {
    setEditingSong(song);
    setIsSheetOpen(true);
  };

  const handleSongSave = async (song: Partial<Song>) => {
    try {
      const singsCollection = collection(db, "singsList");
      
      if (editingSong) {
        await updateDoc(doc(db, "singsList", editingSong.id), song);
        toast({
          title: "تم تحديث الأغنية",
          description: "تم تحديث بيانات الأغنية بنجاح",
        });
      } else {
        const newSong = {
          ...song,
          addTime: Date.now(),
          visible: song.visible || false,
          adRequired: song.adRequired || false,
        };
        
        await addDoc(singsCollection, newSong);
        toast({
          title: "تمت إضافة الأغنية",
          description: "تمت إضافة الأغنية الجديدة بنجاح",
        });
      }
      
      fetchData();
      setIsSheetOpen(false);
    } catch (error) {
      console.error("Error saving song:", error);
      toast({
        title: "خطأ في حفظ الأغنية",
        description: "حدث خطأ أثناء حفظ بيانات الأغنية",
        variant: "destructive",
      });
    }
  };

  const loadAppSettings = async () => {
    try {
      const bannerRef = ref(rtdb, 'ads/banner');
      const bannerSnapshot = await get(bannerRef);
      
      if (bannerSnapshot.exists()) {
        const bannerData = bannerSnapshot.val();
        setAdsSettings(prev => ({
          ...prev,
          banner: {
            music: bannerData.music !== undefined ? bannerData.music : true,
            online: bannerData.online !== undefined ? bannerData.online : true,
            wallpapers: bannerData.wallpapers !== undefined ? bannerData.wallpapers : true
          }
        }));
      }
      
      const fullAdRef = ref(rtdb, 'ads/fullAd');
      const fullAdSnapshot = await get(fullAdRef);
      
      if (fullAdSnapshot.exists()) {
        const fullAdData = fullAdSnapshot.val();
        setAdsSettings(prev => ({
          ...prev,
          fullAd: {
            fullAdsCountChat: fullAdData.fullAdsCountChat || 3,
            fullAdsCountSongs: fullAdData.fullAdsCountSongs || 3
          }
        }));
      }
      
      const updatesRef = ref(rtdb, 'appUpdates');
      const updatesSnapshot = await get(updatesRef);
      
      if (updatesSnapshot.exists()) {
        const updatesData = updatesSnapshot.val();
        setAppUpdates({
          isEnabled: updatesData.isEnabled !== undefined ? updatesData.isEnabled : false,
          title: updatesData.title || "",
          message: updatesData.message || "",
          newVer: updatesData.newVer || 1,
          urlToOpen: updatesData.urlToOpen || "",
          isCancelable: updatesData.isCancelable !== undefined ? updatesData.isCancelable : true
        });
      }
    } catch (error) {
      console.error("Error loading app settings:", error);
      toast({
        title: "خطأ في تحميل الإعدادات",
        description: "حدث خطأ أثناء تحميل إعدادات التطبيق",
        variant: "destructive",
      });
    }
  };

  const saveAdsSettings = async () => {
    try {
      setIsSavingSettings(true);
      
      await update(ref(rtdb, 'ads/banner'), {
        music: adsSettings.banner.music,
        online: adsSettings.banner.online,
        wallpapers: adsSettings.banner.wallpapers
      });
      
      await update(ref(rtdb, 'ads/fullAd'), {
        fullAdsCountChat: adsSettings.fullAd.fullAdsCountChat,
        fullAdsCountSongs: adsSettings.fullAd.fullAdsCountSongs
      });
      
      toast({
        title: "تم حفظ الإعدادات",
        description: "تم حفظ إعدادات الإعلانات بنجاح",
      });
    } catch (error) {
      console.error("Error saving ads settings:", error);
      toast({
        title: "خطأ في حفظ الإعدادات",
        description: "حدث خطأ أثناء حفظ إعدادات الإعلانات",
        variant: "destructive",
      });
    } finally {
      setIsSavingSettings(false);
    }
  };

  const saveAppUpdates = async () => {
    try {
      setIsSavingSettings(true);
      await update(ref(rtdb, 'appUpdates'), appUpdates);
      
      toast({
        title: "تم حفظ الإعدادات",
        description: "تم حفظ إعدادات تحديثات التطبيق بنجاح",
      });
    } catch (error) {
      console.error("Error saving app updates:", error);
      toast({
        title: "خطأ في حفظ الإعدادات",
        description: "حدث خطأ أثناء حفظ إعدادات تحديثات التطبيق",
        variant: "destructive",
      });
    } finally {
      setIsSavingSettings(false);
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log("Fetching dashboard data...");
      
      try {
        const usersCollection = collection(db, "users");
        const usersSnapshot = await getDocs(usersCollection);
        setUsersCount(usersSnapshot.size);
        console.log("Fetched users count:", usersSnapshot.size);
      } catch (error) {
        console.error("Error fetching users:", error);
      }
      
      try {
        const roomsCollection = collection(db, "rooms");
        const roomsSnapshot = await getDocs(roomsCollection);
        setRoomsCount(roomsSnapshot.size);
        console.log("Fetched rooms count:", roomsSnapshot.size);
      } catch (error) {
        console.error("Error fetching rooms:", error);
      }
      
      try {
        const wallpapersRef = ref(rtdb, "wallpapers");
        const wallpapersSnapshot = await get(wallpapersRef);
        
        if (wallpapersSnapshot.exists()) {
          const wallpapersData = wallpapersSnapshot.val();
          const wallpapersCount = Object.keys(wallpapersData).length;
          setWallpapersCount(wallpapersCount);
          console.log("Fetched wallpapers count from Realtime DB:", wallpapersCount);
        } else {
          console.log("No wallpapers found in Realtime Database");
          setWallpapersCount(0);
        }
      } catch (error) {
        console.error("Error fetching wallpapers from Realtime Database:", error);
        setWallpapersCount(0);
      }
      
      try {
        const singsCollection = collection(db, "singsList");
        const singsSnapshot = await getDocs(singsCollection);
        
        if (!singsSnapshot.empty) {
          console.log("Using singsList collection, found items:", singsSnapshot.size);
          setSongsCount(singsSnapshot.size);
          
          const latestSongsQuery = query(
            singsCollection,
            orderBy("addTime", "desc"),
            limit(10)
          );
          
          const latestSongsSnapshot = await getDocs(latestSongsQuery);
          console.log("Latest songs docs count:", latestSongsSnapshot.size);
          
          const songsData = latestSongsSnapshot.docs.map(doc => {
            const data = doc.data();
            console.log("Processing document:", doc.id, data);
            return {
              id: doc.id,
              name: data.name || "Untitled",
              songUrl: data.songUrl || "",
              songPhoto: data.songPhoto || "",
              songLyrics: data.songLyrics || "",
              addTime: data.addTime || Date.now(),
              adRequired: data.adRequired || false,
              visible: data.visible || false
            } as Song;
          });
          
          console.log("Processed songs data:", songsData);
          setLatestSongs(songsData);
        } else {
          console.log("singsList is empty, trying songsList");
          const songsCollection = collection(db, "songsList");
          const songsSnapshot = await getDocs(songsCollection);
          setSongsCount(songsSnapshot.size);
          
          if (songsSnapshot.size > 0) {
            const latestSongsQuery = query(
              songsCollection,
              orderBy("addTime", "desc"),
              limit(10)
            );
            
            const latestSongsSnapshot = await getDocs(latestSongsQuery);
            console.log("Latest songs docs count:", latestSongsSnapshot.size);
            
            const songsData = latestSongsSnapshot.docs.map(doc => {
              const data = doc.data();
              return {
                id: doc.id,
                name: data.name || "Untitled",
                songUrl: data.songUrl || "",
                songPhoto: data.songPhoto || "",
                songLyrics: data.songLyrics || "",
                addTime: data.addTime || Date.now(),
                adRequired: data.adRequired || false,
                visible: data.visible || false
              } as Song;
            });
            
            console.log("Processed songs data:", songsData);
            setLatestSongs(songsData);
          }
        }
      } catch (error) {
        console.error("Error fetching songs:", error);
      }
      
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      setError("حدث خطأ أثناء جلب البيانات");
      toast({
        title: "خطأ في جلب البيانات",
        description: "حدث خطأ أثناء جلب البيانات. يرجى المحاولة مرة أخرى.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchData();
    loadAppSettings();
  }, [toast]);

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <h1 className="text-2xl md:text-3xl font-bold">لوحة المعلومات</h1>
        
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>خطأ</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        <div className="bg-white rounded-lg border p-4 md:p-6 shadow-sm">
          <h2 className="text-xl md:text-2xl font-bold mb-4 md:mb-6 flex items-center">
            <Settings className="mr-2 h-5 md:h-6 w-5 md:w-6" />
            التحكم بالتطبيق
          </h2>
          
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="ads-settings">
              <AccordionTrigger className="text-base md:text-lg font-medium">
                <div className="flex items-center">
                  <Megaphone className="mr-2 h-4 md:h-5 w-4 md:w-5" />
                  إعدادات الإعلانات
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-4 md:space-y-6 py-2">
                  <div className="bg-slate-50 p-3 md:p-4 rounded-lg">
                    <h3 className="text-sm md:text-md font-semibold mb-3 md:mb-4">إعلانات البانر</h3>
                    <div className="space-y-3 md:space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label htmlFor="banner-music">إعلانات البانر في الأغاني</Label>
                          <p className="text-sm text-muted-foreground">
                            إظهار أو إخفاء إعلان البانر في قسم الأغاني
                          </p>
                        </div>
                        <Switch
                          id="banner-music"
                          checked={adsSettings.banner.music}
                          onCheckedChange={(checked) => setAdsSettings(prev => ({
                            ...prev,
                            banner: {
                              ...prev.banner,
                              music: checked
                            }
                          }))}
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label htmlFor="banner-online">إعلانات البانر في أغاني الأونلاين</Label>
                          <p className="text-sm text-muted-foreground">
                            إظهار أو إخفاء إعلان البانر في أغاني الأونلاين
                          </p>
                        </div>
                        <Switch
                          id="banner-online"
                          checked={adsSettings.banner.online}
                          onCheckedChange={(checked) => setAdsSettings(prev => ({
                            ...prev,
                            banner: {
                              ...prev.banner,
                              online: checked
                            }
                          }))}
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label htmlFor="banner-wallpapers">إعلانات البانر في الخلفيات</Label>
                          <p className="text-sm text-muted-foreground">
                            إظهار أو إخفاء إعلان البانر في قسم الخلفيات
                          </p>
                        </div>
                        <Switch
                          id="banner-wallpapers"
                          checked={adsSettings.banner.wallpapers}
                          onCheckedChange={(checked) => setAdsSettings(prev => ({
                            ...prev,
                            banner: {
                              ...prev.banner,
                              wallpapers: checked
                            }
                          }))}
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-slate-50 p-3 md:p-4 rounded-lg">
                    <h3 className="text-sm md:text-md font-semibold mb-3 md:mb-4">الإعلانات الكاملة</h3>
                    <div className="space-y-3 md:space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="full-ads-count-chat">عدد مرات الإعلان في الدردشة</Label>
                        <Input
                          id="full-ads-count-chat"
                          type="number"
                          min="0"
                          value={adsSettings.fullAd.fullAdsCountChat}
                          onChange={(e) => setAdsSettings(prev => ({
                            ...prev,
                            fullAd: {
                              ...prev.fullAd,
                              fullAdsCountChat: parseInt(e.target.value) || 0
                            }
                          }))}
                        />
                        <p className="text-sm text-muted-foreground">
                          عدد المرات التي يظهر فيها الإعلان الكامل في غرف الدردشة
                        </p>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="full-ads-count-songs">عدد مرات الإعلان في الأغاني</Label>
                        <Input
                          id="full-ads-count-songs"
                          type="number"
                          min="0"
                          value={adsSettings.fullAd.fullAdsCountSongs}
                          onChange={(e) => setAdsSettings(prev => ({
                            ...prev,
                            fullAd: {
                              ...prev.fullAd,
                              fullAdsCountSongs: parseInt(e.target.value) || 0
                            }
                          }))}
                        />
                        <p className="text-sm text-muted-foreground">
                          عدد المرات التي يظهر فيها الإعلان الكامل بين الأغاني
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <Button 
                    onClick={saveAdsSettings} 
                    className="mt-3 md:mt-4 w-full sm:w-auto" 
                    disabled={isSavingSettings}
                  >
                    حفظ إعدادات الإعلانات
                  </Button>
                </div>
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="app-updates">
              <AccordionTrigger className="text-base md:text-lg font-medium">
                <div className="flex items-center">
                  <BellRing className="mr-2 h-4 md:h-5 w-4 md:w-5" />
                  تحديثات التطبيق
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-3 md:space-y-4 py-2">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="updates-enabled">تفعيل التحديث</Label>
                      <p className="text-sm text-muted-foreground">
                        تفعيل أو تعطيل إشعار التحديث للمستخدمين
                      </p>
                    </div>
                    <Switch
                      id="updates-enabled"
                      checked={appUpdates.isEnabled}
                      onCheckedChange={(checked) => setAppUpdates(prev => ({
                        ...prev,
                        isEnabled: checked
                      }))}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="update-title">عنوان التحديث</Label>
                    <Input
                      id="update-title"
                      placeholder="أدخل عنوان التحديث..."
                      value={appUpdates.title}
                      onChange={(e) => setAppUpdates(prev => ({
                        ...prev,
                        title: e.target.value
                      }))}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="update-message">نص التحديث</Label>
                    <Textarea
                      id="update-message"
                      placeholder="أدخل وصف التحديث هنا..."
                      value={appUpdates.message}
                      onChange={(e) => setAppUpdates(prev => ({
                        ...prev,
                        message: e.target.value
                      }))}
                      rows={4}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="new-version">رقم الإصدار الجديد</Label>
                    <Input
                      id="new-version"
                      type="number"
                      min="1"
                      step="0.1"
                      value={appUpdates.newVer}
                      onChange={(e) => setAppUpdates(prev => ({
                        ...prev,
                        newVer: parseFloat(e.target.value) || 1
                      }))}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="url-to-open">رابط الفتح (اختياري)</Label>
                    <Input
                      id="url-to-open"
                      placeholder="أدخل رابط الفتح (اختياري)..."
                      value={appUpdates.urlToOpen || ""}
                      onChange={(e) => setAppUpdates(prev => ({
                        ...prev,
                        urlToOpen: e.target.value
                      }))}
                    />
                    <p className="text-sm text-muted-foreground">
                      رابط يتم فتحه عند النقر على إشعار التحديث (اختياري)
                    </p>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="is-cancelable">قابل للإلغاء</Label>
                      <p className="text-sm text-muted-foreground">
                        السماح للمستخدمين بتجاهل التحديث
                      </p>
                    </div>
                    <Switch
                      id="is-cancelable"
                      checked={appUpdates.isCancelable}
                      onCheckedChange={(checked) => setAppUpdates(prev => ({
                        ...prev,
                        isCancelable: checked
                      }))}
                    />
                  </div>
                  
                  <Button 
                    onClick={saveAppUpdates} 
                    className="mt-3 md:mt-4 w-full sm:w-auto" 
                    disabled={isSavingSettings}
                  >
                    حفظ إعدادات التحديث
                  </Button>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
        
        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="h-12 w-12 animate-spin rounded-full border-t-4 border-solid border-primary"></div>
          </div>
        ) : (
          <>
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">المستخدمون</CardTitle>
                  <Users className="h-5 w-5 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{usersCount}</div>
                  <p className="text-xs text-muted-foreground">إجمالي عدد المستخدمين</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">الأغاني</CardTitle>
                  <Music className="h-5 w-5 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{songsCount}</div>
                  <p className="text-xs text-muted-foreground">إجمالي عدد الأغاني</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">غرف الدردشة</CardTitle>
                  <MessageSquare className="h-5 w-5 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{roomsCount}</div>
                  <p className="text-xs text-muted-foreground">إجمالي عدد غرف الدردشة</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">خلفيات التطبيق</CardTitle>
                  <Image className="h-5 w-5 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{wallpapersCount}</div>
                  <p className="text-xs text-muted-foreground">إجمالي عدد الخلفيات</p>
                </CardContent>
              </Card>
            </div>
            
            <div className="relative">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 sm:mb-6 gap-3 sm:gap-0">
                <h2 className="text-xl md:text-2xl font-bold">آخر الأغاني المضافة</h2>
                <Button 
                  onClick={handleAddSong} 
                  className="add-song-button overflow-hidden relative w-full sm:w-auto"
                >
                  <span className="relative z-10 flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    إضافة أغنية جديدة
                  </span>
                </Button>
              </div>
              
              <div className="rounded-md border overflow-hidden overflow-x-auto">
                <div className="min-w-[800px] w-full">
                  <div className="grid grid-cols-12 bg-muted/50 p-4 font-medium">
                    <div className="col-span-1 text-center">#</div>
                    <div className="col-span-3">اسم الأغنية</div>
                    <div className="col-span-3">تاريخ الإضافة</div>
                    <div className="col-span-2 text-center">مرئي</div>
                    <div className="col-span-2 text-center">إعلان مطلوب</div>
                    <div className="col-span-1 text-center">تعديل</div>
                  </div>
                  {latestSongs.length > 0 ? (
                    latestSongs.map((song, index) => (
                      <div 
                        key={song.id}
                        className="grid grid-cols-12 p-4 items-center border-t hover:bg-muted/30 transition-colors"
                      >
                        <div className="col-span-1 font-medium text-center">{index + 1}</div>
                        <div className="col-span-3 flex items-center space-x-3 space-x-reverse">
                          <div className="h-10 w-10 rounded bg-muted overflow-hidden flex-shrink-0">
                            {song.songPhoto ? (
                              <img 
                                src={song.songPhoto} 
                                alt={song.name} 
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="h-full w-full flex items-center justify-center bg-primary/10">
                                <Music className="h-5 w-5 text-primary/50" />
                              </div>
                            )}
                          </div>
                          <span className="font-medium truncate ml-3">{song.name}</span>
                        </div>
                        <div className="col-span-3 flex items-center text-muted-foreground">
                          <Clock className="ml-1 h-4 w-4 flex-shrink-0" />
                          <span className="truncate">
                            {formatDistance(new Date(song.addTime), new Date(), {
                              addSuffix: true,
                              locale: ar
                            })}
                          </span>
                        </div>
                        <div className="col-span-2 text-center">
                          <span className={`inline-flex h-2 w-2 rounded-full ${song.visible ? 'bg-green-500' : 'bg-red-500'} mr-2`}></span>
                          {song.visible ? 'نعم' : 'لا'}
                        </div>
                        <div className="col-span-2 text-center">
                          <span className={`inline-flex h-2 w-2 rounded-full ${song.adRequired ? 'bg-blue-500' : 'bg-yellow-500'} mr-2`}></span>
                          {song.adRequired ? 'نعم' : 'لا'}
                        </div>
                        <div className="col-span-1 text-center">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => handleEditSong(song)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-8 text-center text-muted-foreground">لا توجد أغاني مضافة حديثاً</div>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
      
      <AddSongSheet 
        open={isSheetOpen}
        onOpenChange={setIsSheetOpen}
        song={editingSong}
        onSave={handleSongSave}
      />
    </DashboardLayout>
  );
};

export default Dashboard;
