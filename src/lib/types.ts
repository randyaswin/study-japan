export type JlptLevel = 'N5' | 'N4' | 'N3' | 'N2' | 'N1';

// Mendefinisikan struktur untuk setiap item pembelajaran
export interface LearningItem {
  id: string; // ID unik untuk setiap item
  type: 'Kanji' | 'Kosakata' | 'Tata Bahasa';
  level: JlptLevel;
  title: string;
  reading?: string;
  meaning: string;
  mnemonic: string;
  colorTheme: {
    bg: string;
    text: string;
    border: string;
    shadow: string;
    levelBg: string; // Warna latar untuk badge level
  };
  diagramSvg?: string;
}

// Mendefinisikan struktur untuk konten harian
export interface DailyContent {
  day: number;
  date: string; // Tanggal dalam format ISO, misal "2025-07-12"
  items: LearningItem[];
}
