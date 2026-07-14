// ── AI Stüdyo Müzik Kütüphanesi ──
// Telifsiz arka plan parçaları — dosyalar R2'de `studio/music/` altında durur.
// Bu modül client'a da import edilir (müzik seçici); URL üretimi sunucuda
// publicUrl(r2Key) ile yapılır, client'a hazır URL geçirilir.
//
// Dosya temini (kod dışı, sahip görevi): Pixabay Music / Mixkit'ten telifsiz
// parçalar indirilip aşağıdaki r2Key'lere yüklenir. Eksik dosya render'ı
// bozmaz — birleştirme müzik URL'ine erişemezse müziği atlar (soft-fail).

export type MusicKey =
  | "none"
  | "calm_piano"
  | "uplifting_corporate"
  | "energetic_pop"
  | "ambient_nature"
  | "epic_cinematic";

export type MusicTrackDef = {
  label: string; // TR arayüz etiketi
  mood: string; // seçiciye yardımcı kısa açıklama
  r2Key: string; // R2 object key — publicUrl(r2Key) ile çözülür
};

export const MUSIC_TRACKS: Record<Exclude<MusicKey, "none">, MusicTrackDef> = {
  calm_piano: {
    label: "Sakin Piyano",
    mood: "Huzurlu, zarif — ev içi turlar için",
    r2Key: "studio/music/calm_piano.mp3",
  },
  uplifting_corporate: {
    label: "Pozitif Kurumsal",
    mood: "Modern, güven veren — FPV turlar için",
    r2Key: "studio/music/uplifting_corporate.mp3",
  },
  energetic_pop: {
    label: "Enerjik Pop",
    mood: "Hızlı tempo — sosyal medya reklamları için",
    r2Key: "studio/music/energetic_pop.mp3",
  },
  ambient_nature: {
    label: "Doğa Ambiyansı",
    mood: "Geniş, ferah — arsa ve tarla tanıtımları için",
    r2Key: "studio/music/ambient_nature.mp3",
  },
  epic_cinematic: {
    label: "Epik Sinematik",
    mood: "Etkileyici, prestijli — lüks konutlar için",
    r2Key: "studio/music/epic_cinematic.mp3",
  },
};

export function isMusicKey(key: string): key is MusicKey {
  return key === "none" || key in MUSIC_TRACKS;
}
