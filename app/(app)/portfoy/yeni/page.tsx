import { ListingForm } from "@/components/listing-form";

export default function NewListingPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-[27px] font-extrabold tracking-tight">Yeni İlan</h1>
        <p className="mt-1 text-sm text-ink/55">
          Kaydettiğinde açık taleplerle otomatik eşleştirilir.
        </p>
      </div>
      <ListingForm />
    </div>
  );
}
