import { GlobalWorkerOptions, getDocument } from 'pdfjs-dist';
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import { parseResumeText, type ParsedResume } from './resumeText';
import { pdfPageText, prominentPdfName, reconstructPdfLines } from './pdfTextLayout';

GlobalWorkerOptions.workerSrc = workerUrl;
export { parseResumeText, type ParsedResume } from './resumeText';

export async function parseResumePdf(file: File): Promise<ParsedResume> {
  const bytes = new Uint8Array(await file.arrayBuffer());
  const loadingTask = getDocument({ data: bytes });
  try {
    const pdf = await loadingTask.promise;
    const pages: string[] = [];
    let nameHint: string | undefined;
    for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
      const page = await pdf.getPage(pageNumber);
      const content = await page.getTextContent();
      const lines = reconstructPdfLines(content.items.filter((item) => 'str' in item));
      if (pageNumber === 1) nameHint = prominentPdfName(lines);
      pages.push(pdfPageText(lines));
    }
    const text = pages.join('\n');
    if (!text.trim()) {
      throw new Error('No readable text was found. Please use a text-based PDF rather than a scanned image.');
    }
    return parseResumeText(text, { nameHint });
  } finally {
    await loadingTask.destroy();
  }
}
