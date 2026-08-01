/**
 * Convert a browser FileReader data-URL into a File for multipart upload.
 */
export function dataUrlToFile(dataUrl: string, filename = 'image.jpg'): File | null {
  const match = dataUrl.match(/^data:(image\/[\w+.-]+);base64,(.+)$/);
  if (!match) return null;

  const mime = match[1];
  const binary = atob(match[2]);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }

  const subtype = mime.split('/')[1]?.toLowerCase().replace('jpeg', 'jpg') || 'jpg';
  const base = filename.includes('.') ? filename : `${filename}.${subtype}`;
  return new File([bytes], base, { type: mime });
}
