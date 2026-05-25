import { generateShareImage } from '../../lib/canvasShare';

export async function renderRecapCard(recapData) {
  const blob = await generateShareImage(recapData);
  return blob;
}

export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function shareImage(blob, title) {
  if (navigator.share && navigator.canShare) {
    const file = new File([blob], 'daily-word-recap.png', { type: 'image/png' });
    const shareData = { title, files: [file] };
    if (navigator.canShare(shareData)) {
      await navigator.share(shareData);
      return true;
    }
  }
  // Fallback: download
  downloadBlob(blob, 'daily-word-recap.png');
  return false;
}
