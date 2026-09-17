import "server-only";
import QRCode from "qrcode";

/** Renders a QR value to a PNG data URL, server-side, with a generous quiet zone for scannability. */
export async function renderQrDataUrl(value: string): Promise<string> {
  return QRCode.toDataURL(value, {
    errorCorrectionLevel: "M",
    margin: 3,
    width: 480,
    color: { dark: "#000000", light: "#ffffff" },
  });
}
