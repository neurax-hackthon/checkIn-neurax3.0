"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";

export function QrCodeCanvas({ value }: { value: string }) {
  const [dataUrl, setDataUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    QRCode.toDataURL(value, {
      errorCorrectionLevel: "M",
      margin: 3,
      width: 480,
      color: { dark: "#000000", light: "#ffffff" },
    }).then((url) => {
      if (!cancelled) setDataUrl(url);
    });
    return () => {
      cancelled = true;
    };
  }, [value]);

  return (
    <div className="mx-auto aspect-square w-full max-w-[280px] rounded-2xl bg-white p-4 shadow-lg">
      {dataUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={dataUrl} alt="Your NeuraX entry QR pass" className="h-full w-full" />
      ) : (
        <div className="h-full w-full animate-pulse rounded-lg bg-gray-200" />
      )}
    </div>
  );
}
