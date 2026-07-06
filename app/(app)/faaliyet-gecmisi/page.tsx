import { ActivityLogViewer } from "@/components/activity-log-viewer";

export const metadata = {
  title: "Faaliyet Geçmişi · EmlakFlow",
};

export default function FaaliyetGecmisiPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <ActivityLogViewer />
    </div>
  );
}
