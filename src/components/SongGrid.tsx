
import { Song } from "@/types";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { formatDistance } from "date-fns";
import { ar } from "date-fns/locale";
import { Music, Trash2, Edit } from "lucide-react";

interface SongGridProps {
  songs: Song[];
  loading: boolean;
  onEditSong: (song: Song) => void;
  onDeleteSong?: (song: Song) => void;
}

const SongGrid = ({ songs, loading, onEditSong, onDeleteSong }: SongGridProps) => {
  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-t-4 border-solid border-primary"></div>
      </div>
    );
  }

  if (songs.length === 0) {
    return (
      <div className="col-span-full text-center py-10 text-muted-foreground">
        لم يتم العثور على أغاني
      </div>
    );
  }

  return (
    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
      {songs.map((song) => (
        <Card 
          key={song.id} 
          className="overflow-hidden h-full flex flex-col bg-white shadow-sm hover:shadow transition-shadow duration-200 border border-gray-100"
        >
          <div className="flex flex-col h-full">
            {/* Top: Image with timestamp */}
            <div className="relative w-full">
              <AspectRatio ratio={16/9}>
                {song.songPhoto ? (
                  <div 
                    className="w-full h-full bg-[#f3f3f3]"
                    style={{ 
                      backgroundImage: `url(${song.songPhoto})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center'
                    }}
                  />
                ) : (
                  <div className="w-full h-full bg-[#f3f3f3] flex items-center justify-center">
                    <Music className="h-12 w-12 text-[#8E9196] opacity-60" />
                  </div>
                )}
              </AspectRatio>
              <Badge 
                className="absolute top-2 left-2 bg-black/60 hover:bg-black/60 text-white text-[10px] font-normal px-2 py-0.5"
                variant="secondary"
              >
                {formatDistance(new Date(song.addTime), new Date(), { addSuffix: true, locale: ar })}
              </Badge>
            </div>

            {/* Bottom: Song details */}
            <div className="flex flex-col flex-grow p-4">
              <h3 className="font-medium text-sm mb-2 text-gray-800 line-clamp-1">{song.name}</h3>
              
              <div className="flex gap-1.5 mb-2">
                <Badge 
                  variant={song.visible ? "default" : "secondary"} 
                  className="rounded-full px-2 py-0.5 text-[10px] font-normal"
                >
                  {song.visible ? "مرئي" : "مخفي"}
                </Badge>
                <Badge 
                  variant="outline" 
                  className="rounded-full px-2 py-0.5 text-[10px] font-normal text-gray-500 border-gray-200"
                >
                  {song.adRequired ? "إعلانات" : "بدون إعلانات"}
                </Badge>
              </div>
              
              {song.songLyrics ? (
                <p className="text-xs line-clamp-1 text-gray-500 mb-3">
                  {song.songLyrics.substring(0, 60)}
                </p>
              ) : (
                <p className="text-xs italic text-gray-400 mb-3">لا توجد كلمات</p>
              )}
              
              <div className="flex gap-2 mt-auto">
                <Button 
                  variant="outline" 
                  size="sm"
                  className="flex-1 rounded-md h-8 text-xs font-normal text-gray-700 border-gray-200 hover:bg-gray-50 hover:text-gray-800" 
                  onClick={() => onEditSong(song)}
                >
                  <Edit className="h-3.5 w-3.5 mr-1" />
                  تعديل
                </Button>
                {onDeleteSong && (
                  <Button 
                    variant="outline"
                    size="sm" 
                    className="flex-1 rounded-md h-8 text-xs font-normal text-rose-600 border-rose-100 hover:bg-rose-50 hover:text-rose-700" 
                    onClick={() => onDeleteSong(song)}
                  >
                    <Trash2 className="h-3.5 w-3.5 mr-1" />
                    حذف
                  </Button>
                )}
              </div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
};

export default SongGrid;
