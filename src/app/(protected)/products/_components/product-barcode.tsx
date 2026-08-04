'use client';

import JsBarcode from 'jsbarcode';
import { BarcodeIcon, CheckIcon, CopyIcon } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

export interface BarcodeDisplayProps {
  value: string | null;
  format?: string;
  width?: number;
  height?: number;
  fontSize?: number;
}

export function BarcodeDisplay({
  value,
  format = 'CODE128',
  width = 2,
  height = 80,
  fontSize = 14,
}: BarcodeDisplayProps) {
  const ref = useRef<SVGSVGElement>(null);
  const [invalid, setInvalid] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!ref.current || !value) return;
    setInvalid(false);
    JsBarcode(ref.current, value, {
      format,
      width,
      height,
      fontSize,
      displayValue: true,
      lineColor: 'currentColor',
      margin: 8,
      valid: (valid) => setInvalid(!valid),
    });
  }, [value, format, width, height, fontSize]);

  async function copyToClipboard() {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      toast.success('Barcode copied to clipboard.');
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error('Failed to copy barcode.');
    }
  }

  if (!value) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed py-8 text-muted-foreground">
        <BarcodeIcon className="size-6" />
        <p className="text-sm">No barcode assigned.</p>
      </div>
    );
  }

  if (invalid) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed py-8 text-muted-foreground">
        <BarcodeIcon className="size-6" />
        <p className="text-sm">Invalid barcode value for {format}.</p>
        <p className="font-mono text-xs">{value}</p>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={copyToClipboard}
      className="group relative flex flex-col items-center rounded-lg outline-none transition focus-visible:ring-2 focus-visible:ring-ring/50"
      aria-label={`Copy barcode ${value}`}
    >
      <svg ref={ref} className="h-auto w-full max-w-xs text-foreground" />
      <span className="mt-1 inline-flex items-center gap-1 text-xs text-muted-foreground transition group-hover:text-foreground">
        {copied ? (
          <>
            <CheckIcon className="size-3 text-success" />
            <span className="text-success">Copied!</span>
          </>
        ) : (
          <>
            <CopyIcon className="size-3" />
            <span>Click to copy</span>
          </>
        )}
      </span>
    </button>
  );
}