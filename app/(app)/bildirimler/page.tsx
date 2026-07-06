import { NotificationCenter } from "@/components/notification-center";

export const metadata = {
  title: "Bildirimler · EmlakFlow",
};

export default function BildirimlerPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <NotificationCenter />
    </div>
  );
}
