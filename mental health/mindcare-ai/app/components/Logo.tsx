"use client";

import Image from "next/image";
import Link from "next/link";

interface LogoProps {
  size?: "sm" | "md" | "lg";
  showText?: boolean;
  href?: string;
  className?: string;
}

export default function Logo({ size = "md", showText = true, href = "/", className = "" }: LogoProps) {
  const sizes = {
    sm: { img: 28, text: "text-lg" },
    md: { img: 36, text: "text-xl" },
    lg: { img: 48, text: "text-2xl" },
  };

  const { img, text } = sizes[size];

  const content = (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <Image
        src="/logo.jpeg"
        alt="Selfcare Hub"
        width={img}
        height={img}
        className="object-contain rounded-lg"
        priority
      />
      {showText && (
        <span className={`font-black ${text} text-primary tracking-tight`}>
          Selfcare Hub
        </span>
      )}
    </span>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }

  return content;
}
