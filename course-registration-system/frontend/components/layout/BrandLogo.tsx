"use client";

import Image from "next/image";

import { cn } from "@/lib/utils";

type BrandLogoProps = {
  size?: "sm" | "md" | "lg";
  tone?: "default" | "inverse";
  showWordmark?: boolean;
  className?: string;
};

const iconSizeClasses = {
  sm: "h-8 w-8",
  md: "h-10 w-10",
  lg: "h-12 w-12",
} as const;

const iconPixelSizes = {
  sm: 32,
  md: 40,
  lg: 48,
} as const;

const wordmarkSizeClasses = {
  sm: "text-sm",
  md: "text-base",
  lg: "text-lg",
} as const;

const wordmarkToneClasses = {
  default: "text-foreground",
  inverse: "text-white",
} as const;

export function BrandLogo({ size = "md", tone = "default", showWordmark = true, className }: BrandLogoProps) {
  return (
    <div className={cn("inline-flex items-center gap-3", className)}>
      <span className={cn("flex shrink-0 overflow-hidden rounded-2xl", iconSizeClasses[size])}>
        <Image
          src="/iuh-eduhub-logo.svg"
          alt={showWordmark ? "" : "IUHEduHub"}
          aria-hidden={showWordmark}
          width={iconPixelSizes[size]}
          height={iconPixelSizes[size]}
          className="h-full w-full object-cover"
        />
      </span>

      {showWordmark ? (
        <span className={cn("font-semibold tracking-tight", wordmarkSizeClasses[size], wordmarkToneClasses[tone])}>
          IUHEduHub
        </span>
      ) : null}
    </div>
  );
}