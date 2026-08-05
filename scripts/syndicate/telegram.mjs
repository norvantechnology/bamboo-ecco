/**
 * telegram.mjs - Sends message with canonical backlink to Telegram channel/group via Telegram Bot API.
 * Secrets: TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID
 */
export async function syndicateTelegram(article, canonicalUrl) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!botToken || !chatId) {
    return {
      status: "skipped",
      reason: "TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID secret not set",
    };
  }

  const endpoint = `https://api.telegram.org/bot${botToken}/sendMessage`;

  const escapeHtml = (str) =>
    str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

  const text = `🌿 <b>${escapeHtml(article.title)}</b>\n\n${escapeHtml(article.description)}\n\n🔗 <a href="${canonicalUrl}">Read full article on BambooEcoHub</a>`;

  const res = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: "HTML",
      disable_web_page_preview: false,
    }),
  });

  if (!res.ok) {
    const errorText = await res.text().catch(() => "");
    throw new Error(`Telegram API returned ${res.status}: ${errorText}`);
  }

  const data = await res.json();
  const messageId = data.result?.message_id;
  const channelUsername = chatId.startsWith("@") ? chatId.replace("@", "") : null;
  const postUrl = channelUsername && messageId
    ? `https://t.me/${channelUsername}/${messageId}`
    : canonicalUrl;

  return { status: "success", url: postUrl };
}
