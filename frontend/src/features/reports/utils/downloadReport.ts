/**
 * Reliable client-side file downloader that creates a temporary <a> element
 * backed by a Blob object URL. Avoids window.open() popup blocker issues.
 */
export function downloadReportBlob(base64OrDataUrl: string, filename: string, contentType: string) {
  try {
    let base64 = base64OrDataUrl;
    if (base64.includes('base64,')) {
      base64 = base64.split('base64,')[1];
    } else if (base64.startsWith('data:')) {
      const parts = base64.split(',');
      base64 = parts[1] || '';
      if (!base64.includes(';base64')) {
        // urlencoded string
        base64 = btoa(decodeURIComponent(base64));
      }
    }

    const binaryStr = atob(base64);
    const len = binaryStr.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryStr.charCodeAt(i);
    }

    const blob = new Blob([bytes], { type: contentType });
    const blobUrl = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = blobUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();

    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
    }, 200);
  } catch (err) {
    console.error('Failed to download report blob, falling back to window.open', err);
    window.open(base64OrDataUrl, '_blank');
  }
}
