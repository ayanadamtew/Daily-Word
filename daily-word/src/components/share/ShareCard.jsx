import React, { useState } from 'react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import { renderRecapCard, downloadBlob, shareImage } from './canvasRenderer';

const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];

export default function ShareCard({ recap, userName, streak, onPublish }) {
  const [generating, setGenerating] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [blob, setBlob] = useState(null);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const imageBlob = await renderRecapCard({
        name: userName,
        month: recap.month,
        year: recap.year,
        readDays: recap.readDays,
        totalDays: recap.totalDays,
        streak: streak,
        skipDays: recap.skipDays,
      });
      setBlob(imageBlob);
      setPreviewUrl(URL.createObjectURL(imageBlob));
    } finally {
      setGenerating(false);
    }
  };

  const handleDownload = () => {
    if (blob) downloadBlob(blob, `daily-word-${recap.year}-${recap.month}.png`);
  };

  const handleShare = async () => {
    if (blob) await shareImage(blob, `My ${monthNames[recap.month - 1]} ${recap.year} Bible Reading`);
  };

  const handlePublish = async () => {
    if (!blob) return;
    setPublishing(true);
    await onPublish(blob);
    setPublishing(false);
  };

  return (
    <Card className="space-y-4">
      <h3 className="text-base font-semibold text-surface-50">📤 Share Your Month</h3>

      {!previewUrl ? (
        <Button variant="outline" size="lg" className="w-full" onClick={handleGenerate} loading={generating}>
          🎨 Create Share Image
        </Button>
      ) : (
        <>
          <div className="rounded-xl overflow-hidden border border-surface-700">
            <img src={previewUrl} alt="Recap card preview" className="w-full" />
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" size="md" className="flex-1" onClick={handleDownload}>
              ⬇️ Download
            </Button>
            <Button variant="primary" size="md" className="flex-1" onClick={handleShare}>
              📤 Share
            </Button>
          </div>
          <Button variant="success" size="md" className="w-full" onClick={handlePublish} loading={publishing}>
            🌍 Publish to Explore
          </Button>
        </>
      )}
    </Card>
  );
}
