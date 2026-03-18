export type Wish = {
  id: number;
  name: string;
  message: string;
  created_at: string;
};

export type GalleryItem = {
  id: number;
  file_path: string;
  media_type: "photo" | "video";
  thumb_path: string | null;
  width: number | null;
  height: number | null;
  guest_name: string;
  created_at: string;
};

export type RiceToss = {
  id: number;
  created_at: string;
};

export type Database = {
  public: {
    Tables: {
      wishes: {
        Row: Wish;
        Insert: { name: string; message: string };
        Update: { name?: string; message?: string };
        Relationships: [];
      };
      gallery_items: {
        Row: GalleryItem;
        Insert: {
          file_path: string;
          media_type: "photo" | "video";
          thumb_path?: string | null;
          width?: number | null;
          height?: number | null;
          guest_name?: string;
        };
        Update: Partial<{
          file_path: string;
          media_type: "photo" | "video";
          thumb_path: string | null;
          width: number | null;
          height: number | null;
          guest_name: string;
        }>;
        Relationships: [];
      };
      rice_tosses: {
        Row: RiceToss;
        Insert: Record<string, never>;
        Update: Record<string, never>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
