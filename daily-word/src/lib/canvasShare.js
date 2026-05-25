// Canvas-based image generation for monthly recap share cards

export async function generateShareImage({ name, month, year, readDays, totalDays, streak, skipDays, entryMap, daysInMonth }) {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 2;
  const W = 1080, H = 1350;
  canvas.width = W * dpr;
  canvas.height = H * dpr;
  ctx.scale(dpr, dpr);

  // 1. Background gradient (deep luxury dark theme)
  const grad = ctx.createLinearGradient(0, 0, W, H);
  grad.addColorStop(0, '#09090b');
  grad.addColorStop(0.3, '#121214');
  grad.addColorStop(0.7, '#0f0f11');
  grad.addColorStop(1, '#09090b');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  // 2. Decorative background glows (glassmorphism feel)
  ctx.save();
  ctx.globalCompositeOperation = 'screen';
  
  // Amber glow top right
  let glow = ctx.createRadialGradient(W * 0.8, H * 0.2, 50, W * 0.8, H * 0.2, 400);
  glow.addColorStop(0, 'rgba(245, 158, 11, 0.12)');
  glow.addColorStop(1, 'rgba(245, 158, 11, 0)');
  ctx.fillStyle = glow;
  ctx.beginPath(); ctx.arc(W * 0.8, H * 0.2, 400, 0, Math.PI * 2); ctx.fill();

  // Emerald glow bottom left
  glow = ctx.createRadialGradient(W * 0.2, H * 0.8, 50, W * 0.2, H * 0.8, 350);
  glow.addColorStop(0, 'rgba(16, 185, 129, 0.1)');
  glow.addColorStop(1, 'rgba(16, 185, 129, 0)');
  ctx.fillStyle = glow;
  ctx.beginPath(); ctx.arc(W * 0.2, H * 0.8, 350, 0, Math.PI * 2); ctx.fill();
  ctx.restore();

  // 3. Premium Border
  const borderGrad = ctx.createLinearGradient(0, 0, W, H);
  borderGrad.addColorStop(0, 'rgba(245, 158, 11, 0.45)');
  borderGrad.addColorStop(0.5, 'rgba(245, 158, 11, 0.1)');
  borderGrad.addColorStop(1, 'rgba(16, 185, 129, 0.45)');
  ctx.strokeStyle = borderGrad;
  ctx.lineWidth = 5;
  roundRect(ctx, 24, 24, W - 48, H - 48, 28);
  ctx.stroke();

  // 4. Header Section
  ctx.fillStyle = '#71717a';
  ctx.font = 'bold 22px Inter, sans-serif';
  ctx.textAlign = 'center';
  ctx.letterSpacing = '6px';
  ctx.fillText('DAILY WORD', W / 2, 75);
  ctx.letterSpacing = '0px'; // reset

  // Cross icon
  ctx.strokeStyle = 'rgba(245, 158, 11, 0.8)';
  ctx.lineWidth = 4;
  ctx.beginPath(); ctx.moveTo(W / 2, 95); ctx.lineTo(W / 2, 140); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(W / 2 - 14, 110); ctx.lineTo(W / 2 + 14, 110); ctx.stroke();

  // Month/Year
  const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  ctx.fillStyle = '#fafafa';
  ctx.font = '800 58px Inter, sans-serif';
  ctx.fillText(`${monthNames[month - 1]} ${year}`, W / 2, 215);

  // User name
  ctx.fillStyle = '#a1a1aa';
  ctx.font = '500 28px Inter, sans-serif';
  ctx.fillText(name || 'Faithful Reader', W / 2, 260);

  // 5. Stats circular progress ring (Y center = 415, radius = 95)
  const pct = totalDays > 0 ? Math.round((readDays / totalDays) * 100) : 0;
  const cx = W / 2, cy = 415, radius = 95;
  
  // Background ring
  ctx.lineWidth = 14;
  ctx.strokeStyle = '#18181b';
  ctx.beginPath(); ctx.arc(cx, cy, radius, 0, Math.PI * 2); ctx.stroke();
  
  // Foreground progress gradient
  const ringGrad = ctx.createLinearGradient(cx - radius, cy, cx + radius, cy);
  ringGrad.addColorStop(0, '#10b981');
  ringGrad.addColorStop(1, '#f59e0b');
  ctx.strokeStyle = ringGrad;
  ctx.lineCap = 'round';
  const endAngle = -Math.PI / 2 + (pct / 100) * Math.PI * 2;
  ctx.beginPath(); ctx.arc(cx, cy, radius, -Math.PI / 2, endAngle); ctx.stroke();
  ctx.lineCap = 'butt'; // reset

  // Progress text inside ring
  ctx.fillStyle = '#fafafa';
  ctx.font = '800 62px Inter, sans-serif';
  ctx.fillText(`${pct}%`, cx, cy + 12);
  ctx.font = '700 20px Inter, sans-serif';
  ctx.fillStyle = '#71717a';
  ctx.fillText('FAITHFUL', cx, cy + 42);

  // 6. Stats Cards (Y = 560, height = 115)
  const boxY = 550;
  const boxHeight = 120;
  const boxes = [
    { label: 'DAYS READ', value: readDays, color: '#10b981', borderGlow: 'rgba(16,185,129,0.2)' },
    { label: 'DAYS SKIPPED', value: skipDays, color: '#f59e0b', borderGlow: 'rgba(245,158,11,0.2)' },
    { label: 'CURRENT STREAK', value: `${streak} 🔥`, color: '#ef4444', borderGlow: 'rgba(239,68,68,0.2)' },
  ];

  boxes.forEach((box, i) => {
    const bx = 80 + i * 320;
    const boxW = 280;

    // Glowing subtle card background
    ctx.fillStyle = 'rgba(24, 24, 27, 0.7)';
    roundRect(ctx, bx, boxY, boxW, boxHeight, 18);
    ctx.fill();

    // Subtle colored borders
    ctx.strokeStyle = box.borderGlow;
    ctx.lineWidth = 1.5;
    roundRect(ctx, bx, boxY, boxW, boxHeight, 18);
    ctx.stroke();

    // Value
    ctx.fillStyle = '#fafafa';
    ctx.font = '800 42px Inter, sans-serif';
    ctx.fillText(String(box.value), bx + boxW / 2, boxY + 54);

    // Label
    ctx.fillStyle = '#71717a';
    ctx.font = 'bold 16px Inter, sans-serif';
    ctx.fillText(box.label, bx + boxW / 2, boxY + 92);
  });

  // 7. Motivational Quote (Y = 720)
  const quotes = [
    '"Your word is a lamp to my feet and a light to my path." — Psalm 119:105',
    '"Be still, and know that I am God." — Psalm 46:10',
    '"The Lord is my shepherd; I shall not want." — Psalm 23:1',
    '"I can do all things through Christ who strengthens me." — Philippians 4:13',
    '"For I know the plans I have for you, declares the Lord." — Jeremiah 29:11',
  ];
  ctx.fillStyle = '#a1a1aa';
  ctx.font = 'italic italic 22px Georgia, serif';
  ctx.fillText(quotes[month % quotes.length], W / 2, 730);

  // 8. Visual Calendar Grid Section (Y_start = 810)
  const calHeaderY = 790;
  ctx.fillStyle = '#fafafa';
  ctx.font = '800 24px Inter, sans-serif';
  ctx.fillText('MONTHLY JOURNAL CALENDAR', W / 2, calHeaderY);

  // Divider line
  ctx.strokeStyle = 'rgba(63, 63, 70, 0.4)';
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(W / 2 - 120, calHeaderY + 16); ctx.lineTo(W / 2 + 120, calHeaderY + 16); ctx.stroke();

  // Days of week header (Y = 850)
  const daysOfWeek = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
  const colWidth = 92;
  const gridW = 7 * colWidth - 12;
  const startX = (W - gridW) / 2 + 25; // Adjusted offset for grid columns centering
  const calStartGridY = 875;

  ctx.fillStyle = '#71717a';
  ctx.font = 'bold 16px Inter, sans-serif';
  daysOfWeek.forEach((day, idx) => {
    ctx.fillText(day, startX + idx * colWidth, calStartGridY);
  });

  // Render Days Grid (Y starts at 910)
  const firstDayIndex = new Date(year, month - 1, 1).getDay();
  const rowHeight = 54;
  const cellRadius = 20;

  for (let day = 1; day <= daysInMonth; day++) {
    const gridIndex = firstDayIndex + day - 1;
    const colIdx = gridIndex % 7;
    const rowIdx = Math.floor(gridIndex / 7);

    const x = startX + colIdx * colWidth;
    const y = calStartGridY + 42 + rowIdx * rowHeight;

    const dayEntry = entryMap && entryMap[day];

    if (dayEntry) {
      // 1. Draw solid filled circle for read/skipped
      const cellGrad = ctx.createLinearGradient(x - cellRadius, y - cellRadius, x + cellRadius, y + cellRadius);
      if (dayEntry.type === 'read') {
        cellGrad.addColorStop(0, '#10b981'); // Emerald
        cellGrad.addColorStop(1, '#059669');
      } else {
        cellGrad.addColorStop(0, '#f59e0b'); // Amber
        cellGrad.addColorStop(1, '#d97706');
      }
      ctx.fillStyle = cellGrad;
      ctx.beginPath(); ctx.arc(x, y, cellRadius, 0, Math.PI * 2); ctx.fill();

      // Day Text
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 17px Inter, sans-serif';
      ctx.fillText(String(day), x, y + 6);
    } else {
      const isPast = day <= totalDays;
      if (isPast) {
        // 2. Draw zinc dark fill for missed entries
        ctx.fillStyle = '#1f1f22';
        ctx.beginPath(); ctx.arc(x, y, cellRadius, 0, Math.PI * 2); ctx.fill();
        
        ctx.fillStyle = '#52525b';
        ctx.font = '500 17px Inter, sans-serif';
        ctx.fillText(String(day), x, y + 6);
      } else {
        // 3. Draw dashed circle outline for future days
        ctx.strokeStyle = '#27272a';
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 4]);
        ctx.beginPath(); ctx.arc(x, y, cellRadius, 0, Math.PI * 2); ctx.stroke();
        ctx.setLineDash([]); // reset

        ctx.fillStyle = '#3f3f46';
        ctx.font = '500 17px Inter, sans-serif';
        ctx.fillText(String(day), x, y + 6);
      }
    }
  }

  // 9. Footer Text (Y = 1290)
  ctx.fillStyle = '#52525b';
  ctx.font = '500 18px Inter, sans-serif';
  ctx.fillText('dailyword.app • Building Faithful Bible Habits', W / 2, H - 60);

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
