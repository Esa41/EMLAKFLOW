/**
 * E-posta gönderimi — Resend REST API (SDK'sız, tek fetch).
 * RESEND_API_KEY yoksa (lokal/dev) gönderim atlanır ve link konsola yazılır;
 * akış kırılmaz. Prod kurulumu: resend.com → emlakflow.app domain doğrula
 * (3 DNS kaydı) → API key → Vercel env RESEND_API_KEY (+ opsiyonel MAIL_FROM).
 */

const FROM = process.env.MAIL_FROM ?? "EmlakFlow <noreply@emlakflow.app>";

/**
 * Ofis adına gönderim: adres her zaman doğrulanmış domain'den
 * (noreply@emlakflow.app), görünen ad ofisin adı olur.
 */
export function officeFrom(officeName: string): string {
  // Görünen addaki tırnak/satır kırıcı karakterleri temizle (header injection)
  const safe = officeName.replace(/["\r\n<>]/g, "").trim() || "EmlakFlow";
  return `"${safe}" <noreply@emlakflow.app>`;
}

export async function sendMail(opts: {
  to: string;
  subject: string;
  html: string;
  text: string;
  from?: string;
  replyTo?: string;
}): Promise<{ sent: boolean; error?: string }> {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.log(
      `[mailer] RESEND_API_KEY yok — e-posta gönderilmedi.\n  Kime: ${opts.to}\n  Konu: ${opts.subject}\n  İçerik: ${opts.text}`,
    );
    return { sent: false, error: "RESEND_API_KEY tanımlı değil" };
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: opts.from ?? FROM,
      to: [opts.to],
      subject: opts.subject,
      html: opts.html,
      text: opts.text,
      ...(opts.replyTo ? { reply_to: [opts.replyTo] } : {}),
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    console.error(`[mailer] Resend hatası ${res.status}: ${body}`);
    return { sent: false, error: `Resend ${res.status}: ${body.slice(0, 200)}` };
  }
  return { sent: true };
}

/** Şifre sıfırlama e-postası — marka diliyle, tek CTA. */
export async function sendPasswordResetEmail(to: string, link: string) {
  const text = `EmlakFlow şifrenizi sıfırlamak için bağlantı (30 dakika geçerli): ${link}\n\nBu isteği siz yapmadıysanız bu e-postayı yok sayabilirsiniz; şifreniz değişmez.`;
  const html = `
  <div style="font-family:-apple-system,Segoe UI,Roboto,sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;color:#17201c">
    <p style="font-size:18px;font-weight:800;margin:0 0 4px">Emlak<span style="color:#1e5b3e">Flow</span></p>
    <h1 style="font-size:20px;margin:24px 0 8px">Şifre sıfırlama isteği</h1>
    <p style="font-size:14px;line-height:1.6;color:#4a544f">
      Hesabınız için şifre sıfırlama istendi. Aşağıdaki butona tıklayarak
      yeni şifrenizi belirleyebilirsiniz. Bağlantı <strong>30 dakika</strong> geçerlidir.
    </p>
    <p style="margin:28px 0">
      <a href="${link}" style="background:#1e5b3e;color:#fff;text-decoration:none;font-weight:700;font-size:14px;padding:12px 24px;border-radius:10px;display:inline-block">
        Yeni şifre belirle
      </a>
    </p>
    <p style="font-size:12px;line-height:1.6;color:#8a938e">
      Bu isteği siz yapmadıysanız bu e-postayı yok sayın — şifreniz değişmez.
      Buton çalışmazsa bağlantı: <br><a href="${link}" style="color:#1e5b3e">${link}</a>
    </p>
  </div>`;
  return sendMail({ to, subject: "EmlakFlow — şifre sıfırlama", html, text });
}
