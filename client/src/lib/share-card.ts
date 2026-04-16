// ============================================================
// Vive la Résistance! — Shareable Workout Summary Card
// Generates a branded canvas image for social sharing
// ============================================================

interface ShareCardData {
  routineName: string;
  durationFormatted: string;
  totalSets: number;
  totalReps: number;
  totalPartials: number;
  exercises: { name: string; sets: number; bestReps: number; bandLabel: string; isPR: boolean }[];
  streak: number;
  prCount: number;
  date: string;
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y, x + w, y + r, r);
  ctx.lineTo(x + w, y + h - r);
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h);
  ctx.arcTo(x, y + h, x, y + h - r, r);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
}

export async function generateShareCard(data: ShareCardData): Promise<Blob> {
  const W = 720;
  const PAD = 40;
  const INNER = W - PAD * 2;

  // Calculate dynamic height based on exercise count
  const exerciseRows = Math.min(data.exercises.length, 8);
  const H = 520 + exerciseRows * 44;

  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;

  // --- Background ---
  const bgGrad = ctx.createLinearGradient(0, 0, 0, H);
  bgGrad.addColorStop(0, "#0f0f0f");
  bgGrad.addColorStop(0.5, "#1a1a1a");
  bgGrad.addColorStop(1, "#0a0a0a");
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, W, H);

  // Subtle noise texture effect
  ctx.globalAlpha = 0.03;
  for (let i = 0; i < 2000; i++) {
    const nx = Math.random() * W;
    const ny = Math.random() * H;
    ctx.fillStyle = Math.random() > 0.5 ? "#fff" : "#000";
    ctx.fillRect(nx, ny, 1, 1);
  }
  ctx.globalAlpha = 1;

  // Top accent line
  const accentGrad = ctx.createLinearGradient(PAD, 0, W - PAD, 0);
  accentGrad.addColorStop(0, "transparent");
  accentGrad.addColorStop(0.2, "#c8a96e");
  accentGrad.addColorStop(0.8, "#c8a96e");
  accentGrad.addColorStop(1, "transparent");
  ctx.fillStyle = accentGrad;
  ctx.fillRect(PAD, 0, INNER, 3);

  // --- Header ---
  let y = 40;

  // App name
  ctx.font = "bold 14px 'Inter', system-ui, sans-serif";
  ctx.fillStyle = "#c8a96e";
  ctx.textAlign = "center";
  ctx.letterSpacing = "3px";
  ctx.fillText("VIVE LA RÉSISTANCE!", W / 2, y);
  y += 36;

  // Trophy emoji / icon area
  ctx.font = "40px serif";
  ctx.fillText("🏆", W / 2, y + 8);
  y += 50;

  // "Workout Complete"
  ctx.font = "bold 28px 'Inter', system-ui, sans-serif";
  ctx.fillStyle = "#f5f5f5";
  ctx.letterSpacing = "0px";
  ctx.fillText("Workout Complete", W / 2, y);
  y += 24;

  // Routine name
  ctx.font = "500 16px 'Inter', system-ui, sans-serif";
  ctx.fillStyle = "#888";
  ctx.fillText(data.routineName, W / 2, y);
  y += 12;

  // Date
  ctx.font = "400 12px 'Inter', system-ui, sans-serif";
  ctx.fillStyle = "#666";
  ctx.fillText(data.date, W / 2, y + 14);
  y += 36;

  // --- Stats Row ---
  const statsY = y;
  const statW = INNER / 3;
  const stats = [
    { value: data.durationFormatted, label: "Duration" },
    { value: String(data.totalSets), label: "Sets" },
    { value: String(data.totalReps), label: "Total Reps" },
  ];

  stats.forEach((stat, i) => {
    const cx = PAD + statW * i + statW / 2;
    // Stat box background
    roundRect(ctx, PAD + statW * i + 6, statsY, statW - 12, 64, 12);
    ctx.fillStyle = "rgba(255,255,255,0.04)";
    ctx.fill();

    ctx.font = "bold 22px 'Inter', system-ui, sans-serif";
    ctx.fillStyle = i === 0 ? "#c8a96e" : "#f5f5f5";
    ctx.textAlign = "center";
    ctx.fillText(stat.value, cx, statsY + 30);

    ctx.font = "400 11px 'Inter', system-ui, sans-serif";
    ctx.fillStyle = "#777";
    ctx.fillText(stat.label, cx, statsY + 50);
  });
  y = statsY + 80;

  // --- Streak & PR badges ---
  if (data.streak > 0 || data.prCount > 0) {
    const badges: string[] = [];
    if (data.streak > 0) badges.push(`🔥 ${data.streak} day streak`);
    if (data.prCount > 0) badges.push(`🏆 ${data.prCount} new PR${data.prCount > 1 ? "s" : ""}`);

    ctx.font = "bold 13px 'Inter', system-ui, sans-serif";
    ctx.fillStyle = "#c8a96e";
    ctx.textAlign = "center";
    ctx.fillText(badges.join("   •   "), W / 2, y);
    y += 28;
  }

  // --- Partials ---
  if (data.totalPartials > 0) {
    ctx.font = "500 12px 'Inter', system-ui, sans-serif";
    ctx.fillStyle = "#c8a96e88";
    ctx.textAlign = "center";
    ctx.fillText(`✨ +${data.totalPartials} lengthened partials`, W / 2, y);
    y += 24;
  }

  // --- Exercise Breakdown ---
  // Divider
  const divGrad = ctx.createLinearGradient(PAD + 20, 0, W - PAD - 20, 0);
  divGrad.addColorStop(0, "transparent");
  divGrad.addColorStop(0.3, "#333");
  divGrad.addColorStop(0.7, "#333");
  divGrad.addColorStop(1, "transparent");
  ctx.fillStyle = divGrad;
  ctx.fillRect(PAD + 20, y, INNER - 40, 1);
  y += 20;

  ctx.font = "bold 10px 'Inter', system-ui, sans-serif";
  ctx.fillStyle = "#666";
  ctx.textAlign = "left";
  ctx.letterSpacing = "2px";
  ctx.fillText("EXERCISE BREAKDOWN", PAD + 8, y);
  ctx.letterSpacing = "0px";
  y += 20;

  // Exercise rows
  const visibleExercises = data.exercises.slice(0, 8);
  visibleExercises.forEach((ex, i) => {
    const rowY = y + i * 44;

    // Row background
    roundRect(ctx, PAD, rowY, INNER, 36, 8);
    ctx.fillStyle = ex.isPR ? "rgba(245, 158, 11, 0.08)" : "rgba(255,255,255,0.02)";
    ctx.fill();
    if (ex.isPR) {
      ctx.strokeStyle = "rgba(245, 158, 11, 0.15)";
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    // Exercise name
    ctx.font = "500 13px 'Inter', system-ui, sans-serif";
    ctx.fillStyle = "#e0e0e0";
    ctx.textAlign = "left";
    const nameText = ex.isPR ? `🏆 ${ex.name}` : ex.name;
    ctx.fillText(nameText, PAD + 14, rowY + 16);

    // Band label
    ctx.font = "400 10px 'Inter', system-ui, sans-serif";
    ctx.fillStyle = "#666";
    ctx.fillText(ex.bandLabel, PAD + 14, rowY + 28);

    // Sets x Reps
    ctx.font = "bold 13px 'Inter', system-ui, sans-serif";
    ctx.fillStyle = ex.isPR ? "#f59e0b" : "#aaa";
    ctx.textAlign = "right";
    ctx.fillText(`${ex.sets}s × ${ex.bestReps}r`, W - PAD - 14, rowY + 20);

    if (ex.isPR) {
      ctx.font = "bold 9px 'Inter', system-ui, sans-serif";
      ctx.fillStyle = "#f59e0b";
      ctx.fillText("PR", W - PAD - 14, rowY + 32);
    }
  });

  if (data.exercises.length > 8) {
    y += 8 * 44 + 8;
    ctx.font = "400 11px 'Inter', system-ui, sans-serif";
    ctx.fillStyle = "#666";
    ctx.textAlign = "center";
    ctx.fillText(`+${data.exercises.length - 8} more exercises`, W / 2, y);
  }

  // --- Footer ---
  const footerY = H - 30;
  const footGrad = ctx.createLinearGradient(PAD, 0, W - PAD, 0);
  footGrad.addColorStop(0, "transparent");
  footGrad.addColorStop(0.3, "#333");
  footGrad.addColorStop(0.7, "#333");
  footGrad.addColorStop(1, "transparent");
  ctx.fillStyle = footGrad;
  ctx.fillRect(PAD + 20, footerY - 16, INNER - 40, 1);

  ctx.font = "400 10px 'Inter', system-ui, sans-serif";
  ctx.fillStyle = "#555";
  ctx.textAlign = "center";
  ctx.fillText("Powered by Vive la Résistance! — Resistance Band Training", W / 2, footerY);

  // Convert to blob
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(blob => {
      if (blob) resolve(blob);
      else reject(new Error("Failed to generate image"));
    }, "image/png");
  });
}

export async function shareWorkoutCard(data: ShareCardData): Promise<void> {
  const blob = await generateShareCard(data);
  const file = new File([blob], `workout-${Date.now()}.png`, { type: "image/png" });

  // Try Web Share API first (mobile)
  if (navigator.share && navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({
        title: "Workout Complete!",
        text: `Just crushed ${data.routineName}! ${data.totalSets} sets, ${data.totalReps} reps in ${data.durationFormatted}. 💪`,
        files: [file],
      });
      return;
    } catch (err) {
      // User cancelled or share failed, fall through to download
      if ((err as Error).name === "AbortError") return;
    }
  }

  // Fallback: download the image
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `vive-la-resistance-${data.date.replace(/\//g, "-")}.png`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
