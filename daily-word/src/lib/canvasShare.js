// Canvas-based image generation for monthly recap share cards

export async function generateShareImage({ name, month, year, readDays, totalDays, streak, skipDays }) {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 2;
  const W = 1080, H = 1350;
  canvas.width = W * dpr;
  canvas.height = H * dpr;
  ctx.scale(dpr, dpr);

  // Background gradient
  const grad = ctx.createLinearGradient(0, 0, W, H);
  grad.addColorStop(0, '#09090b');
  grad.addColorStop(0.5, '#18181b');
  grad.addColorStop(1, '#09090b');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  // Decorative circles
  ctx.globalAlpha = 0.08;
  ctx.fillStyle = '#f59e0b';
  ctx.beginPath(); ctx.arc(W * 0.8, H * 0.15, 200, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#10b981';
  ctx.beginPath(); ctx.arc(W * 0.2, H * 0.85, 150, 0, Math.PI * 2); ctx.fill();
  ctx.globalAlpha = 1;

  // Border
  const borderGrad = ctx.createLinearGradient(0, 0, W, H);
  borderGrad.addColorStop(0, '#f59e0b');
  borderGrad.addColorStop(1, '#10b981');
  ctx.strokeStyle = borderGrad;
  ctx.lineWidth = 4;
  roundRect(ctx, 20, 20, W - 40, H - 40, 24);
  ctx.stroke();

  // App title
  ctx.fillStyle = '#a1a1aa';
  ctx.font = '500 28px Inter, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('DAILY WORD', W / 2, 80);

  // Cross icon
  ctx.strokeStyle = '#f59e0b';
  ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(W / 2, 100); ctx.lineTo(W / 2, 150); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(W / 2 - 18, 118); ctx.lineTo(W / 2 + 18, 118); ctx.stroke();

  // Month/Year
  const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  ctx.fillStyle = '#fafafa';
  ctx.font = '700 56px Inter, sans-serif';
  ctx.fillText(`${monthNames[month - 1]} ${year}`, W / 2, 230);

  // User name
  ctx.fillStyle = '#a1a1aa';
  ctx.font = '400 30px Inter, sans-serif';
  ctx.fillText(name || 'A Faithful Reader', W / 2, 280);

  // Stats section
  const pct = totalDays > 0 ? Math.round((readDays / totalDays) * 100) : 0;

  // Progress ring
  const cx = W / 2, cy = 480, radius = 130;
  ctx.lineWidth = 16;
  ctx.strokeStyle = '#27272a';
  ctx.beginPath(); ctx.arc(cx, cy, radius, 0, Math.PI * 2); ctx.stroke();
  const endAngle = -Math.PI / 2 + (pct / 100) * Math.PI * 2;
  const ringGrad = ctx.createLinearGradient(cx - radius, cy, cx + radius, cy);
  ringGrad.addColorStop(0, '#10b981');
  ringGrad.addColorStop(1, '#f59e0b');
  ctx.strokeStyle = ringGrad;
  ctx.lineCap = 'round';
  ctx.beginPath(); ctx.arc(cx, cy, radius, -Math.PI / 2, endAngle); ctx.stroke();
  ctx.lineCap = 'butt';

  // Percentage text
  ctx.fillStyle = '#fafafa';
  ctx.font = '800 72px Inter, sans-serif';
  ctx.fillText(`${pct}%`, cx, cy + 15);
  ctx.font = '400 24px Inter, sans-serif';
  ctx.fillStyle = '#a1a1aa';
  ctx.fillText('faithful', cx, cy + 50);

  // Stats boxes
  const boxY = 680;
  const boxes = [
    { label: 'Days Read', value: readDays, color: '#10b981' },
    { label: 'Days Skipped', value: skipDays, color: '#f59e0b' },
    { label: 'Streak', value: `${streak}🔥`, color: '#f43f5e' },
  ];

  boxes.forEach((box, i) => {
    const bx = 100 + i * 310;
    ctx.fillStyle = 'rgba(39,39,42,0.6)';
    roundRect(ctx, bx, boxY, 260, 140, 16);
    ctx.fill();
    ctx.strokeStyle = box.color + '40';
    ctx.lineWidth = 1;
    roundRect(ctx, bx, boxY, 260, 140, 16);
    ctx.stroke();
    ctx.fillStyle = '#fafafa';
    ctx.font = '700 48px Inter, sans-serif';
    ctx.fillText(String(box.value), bx + 130, boxY + 65);
    ctx.fillStyle = '#a1a1aa';
    ctx.font = '400 22px Inter, sans-serif';
    ctx.fillText(box.label, bx + 130, boxY + 105);
  });

  // Motivational quote
  const quotes = [
    '"Your word is a lamp to my feet." — Psalm 119:105',
    '"Be still, and know that I am God." — Psalm 46:10',
    '"The Lord is my shepherd." — Psalm 23:1',
    '"I can do all things through Christ." — Phil 4:13',
  ];
  ctx.fillStyle = '#71717a';
  ctx.font = 'italic 24px Lora, Georgia, serif';
  ctx.fillText(quotes[month % quotes.length], W / 2, 920);

  // Mini calendar
  const calY = 980;
  ctx.fillStyle = '#a1a1aa';
  ctx.font = '500 20px Inter, sans-serif';
  ctx.fillText('My Reading Calendar', W / 2, calY);

  // Footer
  ctx.fillStyle = '#3f3f46';
  ctx.font = '400 20px Inter, sans-serif';
  ctx.fillText('dailyword.app • Building faithful habits', W / 2, H - 50);

  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), 'image/png', 1.0);
  });
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}
