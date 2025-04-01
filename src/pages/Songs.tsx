import { useEffect, useState } from "react";
import { collection, getDocs, orderBy, query, getFirestore, Firestore, deleteDoc, doc } from "firebase/firestore";
import { db, inspectFirestore } from "@/lib/firebase";
import { Song } from "@/types";
import DashboardLayout from "@/components/DashboardLayout";
import { Search, AlertCircle, Plus, Download } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import SongGrid from "@/components/SongGrid";
import AddSongSheet from "@/components/AddSongSheet";
import { addDoc, updateDoc } from "firebase/firestore";

const Songs = () => {
  const [songs, setSongs] = useState<Song[]>([]);
  const [filteredSongs, setFilteredSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [collectionInfo, setCollectionInfo] = useState<string>("");
  const [editingSong, setEditingSong] = useState<Song | null>(null);
  const [isAddSongOpen, setIsAddSongOpen] = useState(false);
  const { toast } = useToast();

  const checkCollection = async (db: Firestore, collectionName: string) => {
    try {
      console.log(`Checking collection: ${collectionName}`);
      const colRef = collection(db, collectionName);
      const snapshot = await getDocs(colRef);
      console.log(`Collection ${collectionName} exists: ${!snapshot.empty}`);
      console.log(`Collection ${collectionName} document count: ${snapshot.size}`);
      
      if (snapshot.size > 0) {
        console.log(`First document in ${collectionName}:`, snapshot.docs[0].data());
      }
      
      return {
        exists: !snapshot.empty,
        count: snapshot.size,
        sample: snapshot.size > 0 ? snapshot.docs[0].data() : null
      };
    } catch (error) {
      console.error(`Error checking collection ${collectionName}:`, error);
      return { exists: false, count: 0, sample: null, error };
    }
  };

  const runInspection = async () => {
    try {
      await inspectFirestore();
      toast({
        title: "تم فحص Firestore",
        description: "تم فحص قواعد البيانات بنجاح، راجع وحدة التحكم للتفاصيل",
      });
    } catch (error) {
      console.error("Error running inspection:", error);
      toast({
        title: "خطأ في الفحص",
        description: "حدث خطأ أثناء فحص قواعد البيانات",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    const fetchSongs = async () => {
      try {
        setLoading(true);
        setError(null);
        console.log("Fetching songs from Firestore...");
        
        const singsListData = await checkCollection(db, "singsList");
        const songsListData = await checkCollection(db, "songsList");
        
        const collectionsInfo = {
          singsList: singsListData,
          songsList: songsListData
        };
        
        setCollectionInfo(JSON.stringify(collectionsInfo, null, 2));
        
        if (singsListData.exists) {
          console.log("Using singsList collection, found items:", singsListData.count);
          
          const singsCollection = collection(db, "singsList");
          const songsQuery = query(singsCollection, orderBy("addTime", "desc"));
          const snapshot = await getDocs(songsQuery);
          
          console.log(`Retrieved ${snapshot.size} songs from singsList`);
          
          if (!snapshot.empty) {
            const songsData = snapshot.docs.map((doc) => {
              const data = doc.data();
              console.log("Song document:", doc.id, data);
              return {
                id: doc.id,
                name: data.name || "Untitled",
                songUrl: data.songUrl || "",
                songPhoto: data.songPhoto || "",
                songLyrics: data.songLyrics || "",
                addTime: data.addTime || Date.now(),
                adRequired: data.adRequired !== undefined ? data.adRequired : false,
                visible: data.visible !== undefined ? data.visible : false
              } as Song;
            });
            
            console.log("Processed songs data:", songsData);
            setSongs(songsData);
            setFilteredSongs(songsData);
            return;
          }
        }
        
        if (songsListData.exists) {
          console.log("Using songsList collection as fallback");
          const songsCollection = collection(db, "songsList");
          const songsQuery = query(songsCollection, orderBy("addTime", "desc"));
          const snapshot = await getDocs(songsQuery);
          
          console.log(`Retrieved ${snapshot.size} songs from songsList`);
          
          if (!snapshot.empty) {
            const songsData = snapshot.docs.map((doc) => {
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
            
            setSongs(songsData);
            setFilteredSongs(songsData);
            return;
          }
        }
        
        console.log("No songs found in any collection");
        setSongs([]);
        setFilteredSongs([]);
        setError("لم يتم العثور على أي أغاني في المجموعات");
        
      } catch (error) {
        console.error("Error fetching songs:", error);
        setError("حدث خطأ أثناء جلب الأغاني");
        toast({
          title: "خطأ في جلب البيانات",
          description: "حدث خطأ أثناء جلب الأغاني. يرجى المحاولة مرة أخرى.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchSongs();
  }, [toast]);

  useEffect(() => {
    let filtered = [...songs];
    
    if (searchTerm.trim() !== "") {
      filtered = filtered.filter((song) =>
        song.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (song.songLyrics && song.songLyrics.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    
    if (activeTab === "visible") {
      filtered = filtered.filter((song) => song.visible);
    } else if (activeTab === "hidden") {
      filtered = filtered.filter((song) => !song.visible);
    } else if (activeTab === "withAds") {
      filtered = filtered.filter((song) => song.adRequired);
    } else if (activeTab === "withoutAds") {
      filtered = filtered.filter((song) => !song.adRequired);
    }
    
    setFilteredSongs(filtered);
  }, [searchTerm, activeTab, songs]);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };

  const handleAddNewSong = () => {
    setEditingSong(null);
    setIsAddSongOpen(true);
  };

  const handleEditSong = (song: Song) => {
    setEditingSong(song);
    setIsAddSongOpen(true);
  };

  const handleSaveSong = async (songData: Partial<Song>) => {
    try {
      setIsAddSongOpen(false);
      
      if (songData.id) {
        const songRef = doc(db, "singsList", songData.id);
        await updateDoc(songRef, {
          id: songData.id,
          name: songData.name,
          songUrl: songData.songUrl,
          songPhoto: songData.songPhoto,
          songLyrics: songData.songLyrics,
          visible: songData.visible,
          adRequired: songData.adRequired,
        });
        
        setSongs(prevSongs => 
          prevSongs.map(song => 
            song.id === songData.id ? { ...song, ...songData } : song
          )
        );
        
        toast({
          title: "تم تحديث الأغنية",
          description: `تم تحديث "${songData.name}" بنجاح`,
        });
      } else {
        const newSong: Omit<Song, "id"> = {
          name: songData.name || "",
          songUrl: songData.songUrl || "",
          songPhoto: songData.songPhoto || "",
          songLyrics: songData.songLyrics || "",
          addTime: Date.now(),
          visible: songData.visible || false,
          adRequired: songData.adRequired || false,
        };
        
        const docRef = await addDoc(collection(db, "singsList"), newSong);
        
        await updateDoc(doc(db, "singsList", docRef.id), {
          id: docRef.id
        });
        
        const addedSong = { 
          ...newSong, 
          id: docRef.id 
        } as Song;
        
        setSongs(prevSongs => [addedSong, ...prevSongs]);
        
        toast({
          title: "تمت إضافة الأغنية",
          description: `تمت إضافة "${songData.name}" بنجاح`,
        });
      }
    } catch (error) {
      console.error("Error saving song:", error);
      toast({
        title: "خطأ في حفظ الأغنية",
        description: "حدث خطأ أثناء حفظ الأغنية. يرجى المحاولة مرة أخرى.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteSong = async (song: Song) => {
    try {
      const songRef = doc(db, "singsList", song.id);
      await deleteDoc(songRef);
      
      setSongs(prevSongs => prevSongs.filter(s => s.id !== song.id));
      
      toast({
        title: "تم حذف الأغنية",
        description: `تم حذف "${song.name}" بنجاح`,
      });
    } catch (error) {
      console.error("Error deleting song:", error);
      toast({
        title: "خطأ في حذف الأغنية",
        description: "حدث خطأ أثناء حذف الأغنية. يرجى المحاولة مرة أخرى.",
        variant: "destructive",
      });
    }
  };

  const generateAndDownloadJson = () => {
    try {
      const formattedSongs = songs.map(song => ({
        id: song.id,
        name: song.name,
        songUrl: song.songUrl,
        songPhoto: song.songPhoto,
        songLyrics: song.songLyrics,
        addTime: song.addTime,
        adRequired: song.adRequired,
        visible: song.visible
      }));

      const jsonStructure = {
        version: 1,
        sounds: formattedSongs
      };

      const jsonContent = JSON.stringify(jsonStructure, null, 2);
      const blob = new Blob([jsonContent], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      const currentDate = new Date();
      link.download = `songs_export_${currentDate.toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast({
        title: "تم تصدير الأغاني",
        description: `تم تصدير ${formattedSongs.length} أغنية بنجاح`,
      });
    } catch (error) {
      console.error("Error generating JSON:", error);
      toast({
        title: "خطأ في تصدير الأغاني",
        description: "حدث خطأ أثناء تصدير الأغاني إلى ملف JSON",
        variant: "destructive",
      });
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">الأغاني</h1>
          <div className="flex gap-2">
            <Button 
              onClick={generateAndDownloadJson}
              variant="outline"
              className="export-button mr-2"
            >
              <Download className="h-4 w-4 mr-2" />
              تصدير JSON
            </Button>
            <Button 
              onClick={handleAddNewSong}
              className="add-song-button overflow-hidden relative"
            >
              <span className="relative z-10 flex items-center gap-2">
                <Plus className="h-4 w-4" />
                إضافة أغنية جديدة
              </span>
            </Button>
          </div>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>خطأ</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full max-w-sm">
            <Search className="absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="البحث عن أغنية..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pr-10"
            />
          </div>
        </div>

        <Tabs defaultValue="all" onValueChange={handleTabChange}>
          <TabsList className="mb-4">
            <TabsTrigger value="all">الكل</TabsTrigger>
            <TabsTrigger value="visible">مرئي</TabsTrigger>
            <TabsTrigger value="hidden">مخفي</TabsTrigger>
            <TabsTrigger value="withAds">مع إعلانات</TabsTrigger>
            <TabsTrigger value="withoutAds">بدون إعلانات</TabsTrigger>
          </TabsList>
          
          <TabsContent value={activeTab}>
            <SongGrid 
              songs={filteredSongs} 
              loading={loading} 
              onEditSong={handleEditSong}
              onDeleteSong={handleDeleteSong}
            />
          </TabsContent>
        </Tabs>
      </div>

      <AddSongSheet 
        open={isAddSongOpen}
        onOpenChange={setIsAddSongOpen}
        song={editingSong}
        onSave={handleSaveSong}
      />
    </DashboardLayout>
  );
};

export default Songs;
