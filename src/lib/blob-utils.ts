/** Browser-only: trigger a file download from a Blob. */
export function triggerBlobDownload(blob: Blob, filename: string): void {
  if (typeof window === 'undefined') return;
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.rel = 'noopener';
  a.click();
  URL.revokeObjectURL(url);
}

/** Browser-only: trigger a file download from a base64 payload. */
export function downloadBase64File(base64: string, mimeType: string, filename: string): void {
  if (typeof window === 'undefined') return;
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  const blob = new Blob([bytes], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.rel = 'noopener';
  a.click();
  URL.revokeObjectURL(url);
}

/** Save plain text as a downloaded file (browser). */
export function downloadTextFile(content: string, filename: string): void {
  if (typeof window === 'undefined') return;
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  triggerBlobDownload(blob, filename.endsWith('.txt') ? filename : `${filename}.txt`);
}

/** Browser-only: download from an object URL or data URL. */
export function downloadFromHref(href: string, filename: string): void {
  if (typeof window === 'undefined') return;
  const a = document.createElement('a');
  a.href = href;
  a.download = filename;
  a.rel = 'noopener';
  a.click();
}
