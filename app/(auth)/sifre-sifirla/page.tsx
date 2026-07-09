import type { Metadata } from "next";
import ResetPasswordForm from "./reset-password-form";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Yeni Şifre Belirle",
  robots: { index: false, follow: false },
};

export default function ResetPasswordPage() {
  return <ResetPasswordForm />;
}
