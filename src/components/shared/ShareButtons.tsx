"use client";

import { useState } from "react";
import { Share2, MessageCircle, Copy, Check } from "lucide-react";
import { isNativeApp } from "@/lib/capacitor-adhan";

interface Props {
  text: string;
  url?: string;
  locale: string;
  variant?: "light" | "dark";
}

function FacebookIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.99 3.66 9.13 8.44 9.88v-6.99H7.9v-2.89h2.54V9.79c0-2.51 1.49-3.89 3.78-3.89 1.09 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56v1.88h2.78l-.45 2.89h-2.33v6.99C18.34 21.13 22 16.99 22 12z" />
    </svg>
  );
}

export default function ShareButtons({
  text,
  url,
  locale,
  variant = "light",
}: Props) {
  const isAr = locale === "ar";
  const [copied, setCopied] = useState(false);
  const native = isNativeApp();

  const shareUrl =
    url || (typeof window !== "undefined" ? window.location.href : "");

  const siteLabel = isAr ? "موقع مسجد نور الإيمان" : "Noor Al-Iman Mosque website";
  const fullText = shareUrl ? `${text}\n\n${siteLabel}\n${shareUrl}` : text;

  // Inside the installed Android app (Capacitor WebView), the browser's
  // Web Share API is typically unavailable, so `navigator.share` is
  // undefined and the button used to silently disappear there. On a real
  // mobile browser (Chrome/Safari) it works natively. This checks both
  // paths so the share button always shows on mobile — app or browser.
  const hasWebShare =
    typeof navigator !== "undefined" && !!navigator.share;
  const showShareButton = native || hasWebShare;

  const handleShare = async () => {
    if (native) {
      try {
        const { Share } = await import("@capacitor/share");
        await Share.share({ text, url: shareUrl, dialogTitle: siteLabel });
      } catch {
        // user cancelled — no-op
      }
      return;
    }

    try {
      await navigator.share({ text, url: shareUrl });
    } catch {
      // user cancelled — no-op
    }
  };

  const handleWhatsApp = () => {
    window.open(
      `https://wa.me/?text=${encodeURIComponent(fullText)}`,
      "_blank",
      "noopener,noreferrer",
    );
  };

  const handleFacebook = () => {
    window.open(
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
        shareUrl,
      )}&quote=${encodeURIComponent(text)}`,
      "_blank",
      "noopener,noreferrer,width=600,height=500",
    );
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(fullText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard unavailable — no-op
    }
  };

  const neutralBtnClass =
    variant === "dark"
      ? "bg-white/10 hover:bg-white/20 text-white/80"
      : "bg-primary/10 hover:bg-primary/20 text-primary";

  return (
    <div className="flex items-center justify-center gap-2 flex-wrap">
      {showShareButton && (
        <button
          onClick={handleShare}
          title={isAr ? "مشاركة" : "Share"}
          className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors ${neutralBtnClass}`}
        >
          <Share2 size={16} />
        </button>
      )}
      <button
        onClick={handleWhatsApp}
        title="WhatsApp"
        className="w-9 h-9 rounded-full bg-[#25D366]/10 hover:bg-[#25D366]/20 text-[#25D366] flex items-center justify-center transition-colors"
      >
        <MessageCircle size={16} />
      </button>
      <button
        onClick={handleFacebook}
        title="Facebook"
        className="w-9 h-9 rounded-full bg-[#1877F2]/10 hover:bg-[#1877F2]/20 text-[#1877F2] flex items-center justify-center transition-colors"
      >
        <FacebookIcon />
      </button>
      <button
        onClick={handleCopy}
        title={isAr ? "نسخ" : "Copy"}
        className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors ${neutralBtnClass}`}
      >
        {copied ? <Check size={16} /> : <Copy size={16} />}
      </button>
    </div>
  );
}