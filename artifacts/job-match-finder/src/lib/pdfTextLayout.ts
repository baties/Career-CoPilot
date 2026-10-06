import { isLikelyPersonName } from './resumeText';

export interface PdfTextFragment {
  str: string;
  transform: number[];
  width: number;
  height: number;
  hasEOL?: boolean;
}

export interface PdfTextLine {
  text: string;
  x: number;
  y: number;
  fontSize: number;
}

export function reconstructPdfLines(items: PdfTextFragment[]): PdfTextLine[] {
  const lines: PdfTextLine[] = [];
  let current: PdfTextLine | undefined;
  let lastEnd = 0;
  const flush = () => {
    if (current?.text.trim()) {
      current.text = current.text.replace(/\s+/g, ' ').trim();
      if (!/^Page\s+\d+\s+of\s+\d+$/i.test(current.text)) lines.push(current);
    }
    current = undefined;
  };
  for (const item of items) {
    if (!item.str.trim()) {
      if (item.hasEOL) flush();
      continue;
    }
    const x = item.transform[4];
    const y = item.transform[5];
    const fontSize = Math.max(item.height, Math.hypot(item.transform[2], item.transform[3]));
    const gap = x - lastEnd;
    if (current && (Math.abs(y - current.y) > Math.max(2, fontSize * 0.2) ||
        x < current.x - 2 || gap > Math.max(22, fontSize * 2))) flush();
    if (!current) current = { text: item.str, x, y, fontSize };
    else {
      // Adjacent glyphs can be separate items: don't insert a space inside words.
      current.text += `${gap > Math.max(1, fontSize * 0.12) ? ' ' : ''}${item.str}`;
      current.fontSize = Math.max(current.fontSize, fontSize);
    }
    lastEnd = x + item.width;
    if (item.hasEOL) flush();
  }
  flush();
  return lines;
}

export function pdfPageText(lines: PdfTextLine[]) {
  const output: string[] = [];
  let prior: PdfTextLine | undefined;
  for (const line of lines) {
    if (prior && line.x > prior.x + 70 && line.y > prior.y + 40) {
      // A return to the top of the next column must end the previous sidebar list.
      output.push('[Column break]');
    }
    output.push(line.text);
    prior = line;
  }
  return output.join('\n');
}

export function prominentPdfName(lines: PdfTextLine[]) {
  const sizes = lines.map((line) => line.fontSize).sort((a, b) => a - b);
  const bodySize = sizes[Math.floor(sizes.length / 2)] ?? 12;
  const top = Math.max(...lines.map((line) => line.y), 0);
  // Require a prominent first-page header. Sidebar skill lists are usually body-size.
  return lines.filter((line) => line.y > top * 0.6 && line.fontSize >= bodySize * 1.3 &&
    isLikelyPersonName(line.text)).sort((a, b) => b.fontSize - a.fontSize || b.y - a.y)[0]?.text;
}
