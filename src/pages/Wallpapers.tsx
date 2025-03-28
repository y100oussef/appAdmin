import { useState, useEffect, useCallback } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { WallpaperForm } from "@/components/WallpaperForm";
import { Wallpaper } from "@/types";
import { getDatabase, ref, onValue, remove } from "firebase/database";
import { Button } from "@/components/ui/button";
import { Plus, Pencil, Upload, Trash2 } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { BatchUploadDialog } from "@/components/BatchUploadDialog";
import { 
  Pagination, 
  PaginationContent, 
  PaginationItem, 
  PaginationLink, 
  PaginationNext, 
  PaginationPrevious 
} from "@/components/ui/pagination";
import { toast } from "sonner";

const ITEMS_PER_PAGE = 10;

const Wallpapers = () => {
  const [wallpapers, setWallpapers] = useState<Wallpaper[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedWallpaper, setSelectedWallpaper] = useState<Wallpaper | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isBatchUploadOpen, setIsBatchUploadOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  
  useEffect(() => {
    const db = getDatabase();
    const wallpapersRef = ref(db, "wallpapers");
    
    const unsubscribe = onValue(wallpapersRef, (snapshot) => {
      const wallpapersData: Wallpaper[] = [];
      
      if (snapshot.exists()) {
        snapshot.forEach((childSnapshot) => {
          const wallpaper = {
            id: childSnapshot.key,
            ...childSnapshot.val()
          } as Wallpaper;
          wallpapersData.push(wallpaper);
        });
      }
      
      // Sort by addTime (newest first)
      wallpapersData.sort((a, b) => b.addTime - a.addTime);
      
      setWallpapers(wallpapersData);
      setLoading(false);
    }, (error) => {
      console.error("Error loading wallpapers from Realtime Database:", error);
      setLoading(false);
    });
    
    return () => unsubscribe();
  }, []);

  const handleAddNew = () => {
    setSelectedWallpaper(null);
    setIsFormOpen(true);
  };

  const handleEdit = (wallpaper: Wallpaper) => {
    setSelectedWallpaper(wallpaper);
    setIsFormOpen(true);
  };

  const handleDelete = async (wallpaper: Wallpaper) => {
    if (!window.confirm("هل أنت متأكد من حذف هذه الخلفية؟")) {
      return;
    }
    
    try {
      const db = getDatabase();
      const wallpaperRef = ref(db, `wallpapers/${wallpaper.id}`);
      
      await remove(wallpaperRef);
      
      toast.success("تم حذف الخلفية بنجاح");
    } catch (error) {
      console.error("Error deleting wallpaper:", error);
      toast.error("لم يتم حذف الخلفية بنجاح");
    }
  };

  const handleFormSuccess = () => {
    setIsFormOpen(false);
    setSelectedWallpaper(null);
  };

  const handleCancel = () => {
    setIsFormOpen(false);
    setSelectedWallpaper(null);
  };

  const handleBatchUpload = () => {
    setIsBatchUploadOpen(true);
  };

  const handleBatchUploadClose = () => {
    setIsBatchUploadOpen(false);
  };

  const totalPages = Math.ceil(wallpapers.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentWallpapers = wallpapers.slice(startIndex, endIndex);

  const renderPagination = useCallback(() => {
    if (totalPages <= 1) return null;

    return (
      <Pagination className="mt-6">
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious 
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
            />
          </PaginationItem>
          
          {Array.from({ length: totalPages }).map((_, index) => (
            <PaginationItem key={index}>
              <PaginationLink 
                onClick={() => setCurrentPage(index + 1)}
                isActive={currentPage === index + 1}
              >
                {index + 1}
              </PaginationLink>
            </PaginationItem>
          ))}
          
          <PaginationItem>
            <PaginationNext 
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    );
  }, [currentPage, totalPages]);

  return (
    <DashboardLayout>
      <div className="container mx-auto p-6">
        <h1 className="text-3xl font-bold mb-6">خلفيات التطبيق</h1>
        
        {isFormOpen ? (
          <WallpaperForm 
            wallpaper={selectedWallpaper || undefined} 
            onSuccess={handleFormSuccess}
            onCancel={handleCancel}
          />
        ) : (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>قائمة الخلفيات</CardTitle>
                <CardDescription>
                  إدارة خلفيات التطبيق المتاحة للمستخدمين
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Button onClick={handleBatchUpload} variant="outline">
                  <Upload className="mr-2 h-4 w-4" />
                  رفع متعدد
                </Button>
                <Button onClick={handleAddNew}>
                  <Plus className="mr-2 h-4 w-4" />
                  إضافة خلفية جديدة
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-2">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-4">
                      <Skeleton className="h-12 w-12 rounded-md" />
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-[250px]" />
                        <Skeleton className="h-4 w-[200px]" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : wallpapers.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground">
                  لا توجد خلفيات حتى الآن. قم بإضافة خلفية جديدة.
                </div>
              ) : (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>الصورة</TableHead>
                        <TableHead>الرابط</TableHead>
                        <TableHead>تاريخ الإضافة</TableHead>
                        <TableHead className="text-right">الإجراءات</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {currentWallpapers.map((wallpaper) => (
                        <TableRow key={wallpaper.id}>
                          <TableCell>
                            <div className="h-12 w-12 overflow-hidden rounded-md">
                              <img 
                                src={wallpaper.wallpaperUrl} 
                                alt="خلفية"
                                className="h-full w-full object-cover"
                                loading="lazy"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = "/placeholder.svg";
                                }}
                              />
                            </div>
                          </TableCell>
                          <TableCell className="max-w-[200px] truncate">
                            <a 
                              href={wallpaper.wallpaperUrl} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="hover:underline text-blue-600"
                            >
                              {wallpaper.wallpaperUrl}
                            </a>
                          </TableCell>
                          <TableCell>
                            {format(new Date(wallpaper.addTime), "PPP", { locale: ar })}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              <Button 
                                variant="ghost" 
                                size="icon"
                                onClick={() => handleEdit(wallpaper)}
                              >
                                <Pencil className="h-4 w-4" />
                                <span className="sr-only">تعديل</span>
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon"
                                onClick={() => handleDelete(wallpaper)}
                                className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                                <span className="sr-only">حذف</span>
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  {renderPagination()}
                </>
              )}
            </CardContent>
          </Card>
        )}
        <BatchUploadDialog 
          open={isBatchUploadOpen} 
          onOpenChange={setIsBatchUploadOpen} 
        />
      </div>
    </DashboardLayout>
  );
};

export default Wallpapers;
