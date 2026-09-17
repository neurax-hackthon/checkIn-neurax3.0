"use client";

import { useEffect, useRef, useState } from "react";

const SCANNER_ELEMENT_ID = "nx-camera-scanner";
const RESUME_DELAY_MS = 2200;

type Html5QrcodeInstance = {
  start: (
    cameraIdOrConfig: unknown,
    config: unknown,
    onSuccess: (decodedText: string) => void,
    onError?: (msg: string) => void
  ) => Promise<void>;
  stop: () => Promise<void>;
  pause: (shouldPauseVideo?: boolean) => void;
  resume: () => void;
  clear: () => void;
  applyVideoConstraints: (constraints: MediaTrackConstraints) => Promise<void>;
};

interface CameraScannerProps {
  onDecode: (value: string) => void;
  disabled?: boolean;
}

export function CameraScanner({ onDecode, disabled }: CameraScannerProps) {
  const [status, setStatus] = useState<
    "idle" | "starting" | "running" | "denied" | "unavailable"
  >("idle");
  const [torchOn, setTorchOn] = useState(false);
  const [torchSupported, setTorchSupported] = useState(false);
  const instanceRef = useRef<Html5QrcodeInstance | null>(null);
  const lastValueRef = useRef<{ value: string; at: number } | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function start() {
      setStatus("starting");
      try {
        const mod = await import("html5-qrcode");
        if (cancelled) return;
        const html5Qrcode = new mod.Html5Qrcode(SCANNER_ELEMENT_ID, {
          verbose: false,
        }) as unknown as Html5QrcodeInstance;
        instanceRef.current = html5Qrcode;

        await html5Qrcode.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 260, height: 260 } },
          (decodedText: string) => {
            const now = Date.now();
            const last = lastValueRef.current;
            if (last && last.value === decodedText && now - last.at < RESUME_DELAY_MS) {
              return; // same code still in frame — ignore.
            }
            lastValueRef.current = { value: decodedText, at: now };
            instanceRef.current?.pause(true);
            onDecode(decodedText);
            setTimeout(() => {
              try {
                instanceRef.current?.resume();
              } catch {
                // scanner may have been torn down already.
              }
            }, RESUME_DELAY_MS);
          },
          () => {
            /* per-frame decode failures are expected while aiming — ignore. */
          }
        );
        if (cancelled) {
          await html5Qrcode.stop().catch(() => {});
          return;
        }
        setStatus("running");

        try {
          const capabilities = (
            html5Qrcode as unknown as {
              getRunningTrackCapabilities?: () => Record<string, unknown>;
            }
          ).getRunningTrackCapabilities?.();
          setTorchSupported(Boolean(capabilities && "torch" in capabilities));
        } catch {
          setTorchSupported(false);
        }
      } catch (err) {
        if (cancelled) return;
        const name = (err as { name?: string })?.name;
        setStatus(name === "NotAllowedError" ? "denied" : "unavailable");
      }
    }

    start();

    return () => {
      cancelled = true;
      const instance = instanceRef.current;
      if (instance) {
        instance.stop().then(() => instance.clear()).catch(() => {});
      }
    };
  }, [onDecode]);

  async function toggleTorch() {
    if (!instanceRef.current) return;
    try {
      await instanceRef.current.applyVideoConstraints({
        // @ts-expect-error torch is a non-standard MediaTrackConstraint
        advanced: [{ torch: !torchOn }],
      });
      setTorchOn((t) => !t);
    } catch {
      // torch toggle unsupported on this device — silently ignore.
    }
  }

  return (
    <div className="relative aspect-[3/4] sm:aspect-video overflow-hidden rounded-2xl border border-border bg-black">
      <div
        id={SCANNER_ELEMENT_ID}
        className="h-full w-full [&_video]:h-full [&_video]:w-full [&_video]:object-cover"
      />

      {status === "starting" && (
        <div className="absolute inset-0 flex items-center justify-center bg-surface text-sm text-muted">
          Starting camera…
        </div>
      )}
      {status === "denied" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-surface p-6 text-center text-sm">
          <p className="font-medium text-warning">Camera permission denied</p>
          <p className="text-muted">
            Allow camera access in your browser settings, or use manual lookup below.
          </p>
        </div>
      )}
      {status === "unavailable" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-surface p-6 text-center text-sm">
          <p className="font-medium text-warning">Camera unavailable</p>
          <p className="text-muted">Use manual lookup below to check participants in.</p>
        </div>
      )}

      {status === "running" && (
        <div className="absolute top-3 right-3 flex gap-2">
          {torchSupported && (
            <button
              onClick={toggleTorch}
              className="min-h-11 rounded-full bg-black/60 px-4 py-2.5 text-xs font-medium text-white backdrop-blur touch-manipulation active:bg-black/80"
            >
              {torchOn ? "⚡ Torch On" : "⚡ Torch"}
            </button>
          )}
        </div>
      )}

      {disabled && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white text-sm">
          Processing…
        </div>
      )}
    </div>
  );
}
