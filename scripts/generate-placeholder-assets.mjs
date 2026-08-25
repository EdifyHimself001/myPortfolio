import sharp from "sharp";
import { mkdirSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const workDir = join(root, "src", "assets", "work");
const publicDir = join(root, "public");

const palettes = {
  webapps: ["#101828", "#1d4ed8"],
  photography: ["#1c1917", "#57534e"],
  graphics: ["#172554", "#2563eb"],
  videography: ["#18181b", "#3f3f46"],
};

function esc(text) {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function svg({ w, h, c1, c2, big, small, tag = "SAMPLE PROJECT", fontSizeOverride }) {
  const fontSize = fontSizeOverride ?? Math.min(w, h) / 6;
  const subSize = Math.max(22, Math.min(w, h) / 22);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <defs>
    <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${c1}"/>
      <stop offset="100%" stop-color="${c2}"/>
    </linearGradient>
  </defs>
  <rect width="${w}" height="${h}" fill="url(#g)"/>
  <rect x="0.5" y="0.5" width="${w - 1}" height="${h - 1}" fill="none" stroke="rgba(255,255,255,0.12)"/>
  <line x1="0" y1="${h * 0.62}" x2="${w}" y2="${h * 0.62}" stroke="rgba(255,255,255,0.15)" stroke-width="1"/>
  <text x="50%" y="${h / 2 - fontSize * 0.05}" text-anchor="middle" dominant-baseline="middle"
    font-family="Arial, Helvetica, sans-serif" font-weight="800" font-size="${fontSize}"
    letter-spacing="${fontSize * 0.02}" fill="rgba(255,255,255,0.92)">${esc(big)}</text>
  <text x="50%" y="${h * 0.72}" text-anchor="middle" font-family="Arial, Helvetica, sans-serif"
    font-size="${subSize}" letter-spacing="${subSize * 0.18}" fill="rgba(255,255,255,0.6)"
    style="text-transform:uppercase">${esc(small.toUpperCase())}</text>
  <text x="${w - 24}" y="40" text-anchor="end" font-family="Arial, Helvetica, sans-serif"
    font-size="${Math.max(14, w / 90)}" letter-spacing="4" fill="rgba(255,255,255,0.35)">${esc(tag)}</text>
</svg>`;
}

async function makeJpeg(outPath, opts) {
  await sharp(Buffer.from(svg(opts)))
    .jpeg({ quality: 82, mozjpeg: true })
    .toFile(outPath);
}

const galleryDims = [
  [1600, 1067],
  [1200, 1560],
  [1400, 1400],
];

const projects = [
  { category: "webapps", slug: "podium-lms", title: "Podium LMS" },
  { category: "webapps", slug: "farmshift", title: "FarmShift" },
  {
    category: "webapps",
    slug: "african-payment-platform",
    title: "Payment Platform",
  },
  {
    category: "photography",
    slug: "youth-empowerment-program",
    title: "Youth Program",
  },
  {
    category: "photography",
    slug: "corporate-portrait-series",
    title: "Portrait Series",
  },
  {
    category: "photography",
    slug: "event-documentary",
    title: "Event Documentary",
  },
  {
    category: "graphics",
    slug: "rf-studios-brand-identity",
    title: "Brand Identity",
  },
  {
    category: "graphics",
    slug: "product-campaign",
    title: "Product Campaign",
  },
  {
    category: "graphics",
    slug: "social-media-campaign",
    title: "Social Campaign",
  },
  { category: "videography", slug: "brand-story", title: "Brand Story" },
  { category: "videography", slug: "event-highlights", title: "Event Highlights" },
  {
    category: "videography",
    slug: "documentary-short",
    title: "Documentary Short",
  },
];

async function main() {
  for (const project of projects) {
    const dir = join(workDir, project.category, project.slug);
    mkdirSync(dir, { recursive: true });
    const [c1, c2] = palettes[project.category];

    await makeJpeg(join(dir, "cover.jpg"), {
      w: 1600,
      h: 1000,
      c1,
      c2,
      big: project.title,
      small: `${project.category} · cover`,
    });

    const count =
      project.category === "photography" ? 6 : project.category === "graphics" ? 4 : 3;

    for (let i = 0; i < count; i++) {
      const prefix =
        project.category === "photography"
          ? "photo"
          : project.category === "graphics"
            ? "board"
            : project.category === "videography"
              ? "still"
              : "screen";
      const dims =
        project.category === "photography"
          ? galleryDims[i % galleryDims.length]
          : [1600, 1067];
      const name = `${prefix}-${String(i + 1).padStart(2, "0")}.jpg`;
      await makeJpeg(join(dir, name), {
        w: dims[0],
        h: dims[1],
        c1,
        c2,
        big: String(i + 1).padStart(2, "0"),
        small: `${project.title} · ${prefix}`,
      });
    }
    console.log(`assets: ${project.slug}`);
  }

  const assetsDir = join(root, "src", "assets");
  mkdirSync(join(publicDir, "images"), { recursive: true });
  mkdirSync(join(publicDir, "cv"), { recursive: true });

  await makeJpeg(join(assetsDir, "portrait.jpg"), {
    w: 1200,
    h: 1500,
    c1: "#111113",
    c2: "#2563eb",
    big: "PORTRAIT",
    small: "Replace with your photo",
  });

  await makeJpeg(join(publicDir, "images", "og-default.jpg"), {
    w: 1200,
    h: 630,
    c1: "#0A0A0A",
    c2: "#1d4ed8",
    big: "ACKWONU EDWIN KWAMENA",
    small: "Build. Capture. Design. Tell.",
    fontSizeOverride: 62,
  });

  writeFileSync(
    join(publicDir, "cv", "CV_Ackwonu_Edwin_Kwamena.pdf"),
    buildPdf([
      [24, "Ackwonu Edwin Kwamena"],
      [13, "Creative Developer & Visual Storyteller"],
      [11, ""],
      [11, "This is a placeholder CV generated by the portfolio scaffold."],
      [11, "Replace public/cv/CV_Ackwonu_Edwin_Kwamena.pdf with your real document."],
      [11, ""],
      [11, "Build - Web applications, front-end architecture, accessibility."],
      [11, "Capture - Documentary, portrait and event photography."],
      [11, "Design - Brand identity, campaigns and design systems."],
      [11, "Tell - Brand films, event highlights, documentary shorts."],
      [11, ""],
      [11, "Contact - edwinackwonu1@gmail.com"],
    ])
  );

  console.log("done.");
}

function buildPdf(lines) {
  const esc = (t) => t.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
  let y = 780;
  const parts = [];
  for (const [size, text] of lines) {
    if (text === "") {
      y -= size * 1.4;
      continue;
    }
    parts.push(
      `BT /F1 ${size} Tf 56 ${y} Td (${esc(text)}) Tj ET`
    );
    y -= size * 1.5;
  }
  const stream = parts.join("\n");

  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    `<< /Length ${Buffer.byteLength(stream)} >>\nstream\n${stream}\nendstream`,
  ];

  let pdf = "%PDF-1.4\n";
  const offsets = [];
  objects.forEach((body, i) => {
    offsets.push(Buffer.byteLength(pdf));
    pdf += `${i + 1} 0 obj\n${body}\nendobj\n`;
  });
  const xrefOffset = Buffer.byteLength(pdf);
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += "0000000000 65535 f \n";
  for (const offset of offsets) {
    pdf += `${String(offset).padStart(10, "0")} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
  return Buffer.from(pdf, "binary");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});