"use client";

// Renders a chat message. If the message contains a media URL (audio/video/
// image), it renders an inline player instead of showing the raw URL text.

const URL_REGEX = /(https?:\/\/[^\s]+)/i;

function classifyUrl(url: string): "audio" | "video" | "image" | "other" {
  // Strip query string / fragment before checking the extension.
  const clean = url.split("?")[0].split("#")[0].toLowerCase();
  if (/\.(webm|mp3|wav|ogg|m4a|aac)$/.test(clean)) {
    // .webm can be audio or video; audio recordings dominate here, but we
    // treat .webm as video below unless it's clearly an audio note.
    if (/\.(mp3|wav|ogg|m4a|aac)$/.test(clean)) return "audio";
  }
  if (/\.(mp4|mov|webm|ogv|mkv)$/.test(clean)) return "video";
  if (/\.(jpg|jpeg|png|gif|webp|svg|bmp)$/.test(clean)) return "image";
  return "other";
}

interface MessageContentProps {
  content: string;
  isOwn?: boolean;
}

export default function MessageContent({ content, isOwn }: MessageContentProps) {
  const match = content.match(URL_REGEX);

  if (!match) {
    return <p className="whitespace-pre-wrap break-words">{content}</p>;
  }

  const url = match[1];
  const label = content.replace(url, "").trim();
  const clean = url.split("?")[0].split("#")[0].toLowerCase();

  // Decide media kind. Voice-note messages are labelled with 🎤, so a .webm
  // there is audio; otherwise a .webm is video.
  const isVoiceNote = /🎤|voice note|voice message|audio/i.test(label);
  let kind = classifyUrl(url);
  if (kind === "other" && clean.endsWith(".webm")) {
    kind = isVoiceNote ? "audio" : "video";
  }
  if (clean.endsWith(".webm") && isVoiceNote) {
    kind = "audio";
  }

  const linkClass = isOwn ? "text-on-primary underline" : "text-primary underline";

  return (
    <div className="space-y-2">
      {label && <p className="whitespace-pre-wrap break-words">{label}</p>}

      {kind === "audio" && (
        <audio controls preload="metadata" src={url} className="w-full max-w-[260px]">
          <a href={url} target="_blank" rel="noreferrer" className={linkClass}>Play audio</a>
        </audio>
      )}

      {kind === "video" && (
        <video controls preload="metadata" src={url} className="w-full max-w-[280px] rounded-lg bg-black">
          <a href={url} target="_blank" rel="noreferrer" className={linkClass}>Play video</a>
        </video>
      )}

      {kind === "image" && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt="Shared image" className="w-full max-w-[280px] rounded-lg" />
      )}

      {kind === "other" && (
        <a href={url} target="_blank" rel="noreferrer" className={`${linkClass} break-all text-xs`}>
          {url}
        </a>
      )}
    </div>
  );
}
