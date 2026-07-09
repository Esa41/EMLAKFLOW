import type { Metadata } from "next";
import ForgotPasswordForm from "./forgot-password-form";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Şifremi Unuttum",
  robots: { index: false, follow: false },
};

export default function ForgotPasswordPage() {
  return <ForgotPasswordForm />;
}
