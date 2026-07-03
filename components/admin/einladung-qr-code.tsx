"use client";

import QRCode from "qrcode";
import Image from "next/image";
import { useEffect, useState } from "react";

type EinladungQrCodeProps = {
  einladungslink: string | null;
};

export function EinladungQrCode({ einladungslink }: EinladungQrCodeProps) {
  const [dataUrl, setDataUrl] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const nextLink = einladungslink;
    if (!nextLink) {
      return;
    }

    QRCode.toDataURL(nextLink, { margin: 1, width: 180 })
      .then((url) => {
        if (isMounted) {
          setDataUrl(url);
        }
      })
      .catch(() => {
        if (isMounted) {
          setDataUrl(null);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [einladungslink]);

  return (
    <div className="qr-panel">
      <h3>QR-Code</h3>
      {einladungslink && dataUrl ? (
        <Image
          src={dataUrl}
          alt="QR-Code für den Einladungslink"
          width={180}
          height={180}
          unoptimized
        />
      ) : (
        <p>Nach dem Generieren zeigt der QR-Code auf denselben Einladungslink.</p>
      )}
    </div>
  );
}
