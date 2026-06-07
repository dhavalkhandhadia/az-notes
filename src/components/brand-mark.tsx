"use client";

import Image from "next/image";
import Link from "next/link";

import { cn } from "@/lib/utils";

type BrandMarkProps = {
  href?: string;
  className?: string;
  imageClassName?: string;
};

export function BrandMark({
  href = "/",
  className,
  imageClassName,
}: BrandMarkProps) {
  return (
    <Link
      href={href}
      aria-label="AZ Notes"
      className={cn("inline-flex items-center", className)}
    >
      <Image
        src="/logo_az.svg"
        alt=""
        width={264}
        height={72}
        unoptimized
        className={cn("h-14 w-auto object-contain", imageClassName)}
      />
    </Link>
  );
}
