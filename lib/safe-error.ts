/** Production API yanıtlarında ham hata detayı sızdırmaz. */
export function safeApiError(err: unknown) {
  console.error(err);
  return { error: "İşlem tamamlanamadı." };
}
