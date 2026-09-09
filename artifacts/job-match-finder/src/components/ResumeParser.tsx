import { useRef, useState } from 'react';
import { CheckCircle2, FileText, Loader2, Upload } from 'lucide-react';
import { parseResumePdf } from '../lib/resumeParser';

interface ResumeParserProps {
  onParsed: (result: { name: string; skills: string[] }) => void;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024;

export function ResumeParser({ onParsed }: ResumeParserProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [fileName, setFileName] = useState('');
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);

  const handleFile = async (file?: File) => {
    if (!file) return;

    setMessage('');
    setIsError(false);

    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      setIsError(true);
      setMessage('Please choose a PDF resume.');
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      setIsError(true);
      setMessage('Please choose a PDF smaller than 10 MB.');
      return;
    }

    setFileName(file.name);
    setIsParsing(true);
    try {
      const result = await parseResumePdf(file);
      onParsed(result);
      const details = [
        result.name ? 'name' : '',
        result.skills.length ? `${result.skills.length} skill${result.skills.length === 1 ? '' : 's'}` : '',
      ].filter(Boolean);
      setMessage(
        details.length
          ? `Imported ${details.join(' and ')}. Review and edit them below.`
          : 'The PDF was read, but no name or supported skills were confidently detected.',
      );
    } catch (error) {
      setIsError(true);
      setMessage(error instanceof Error ? error.message : 'We could not read this PDF.');
    } finally {
      setIsParsing(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  return (
    <section className="rounded-2xl border border-primary/20 bg-primary/[0.06] p-5 md:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="rounded-xl bg-primary/10 p-2.5 text-primary">
            <FileText size={24} />
          </div>
          <div>
            <h2 className="font-bold text-foreground">Import from your resume</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Upload a PDF to fill your name and up to 10 skills. Your file stays in this browser.
            </p>
          </div>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf,.pdf"
          className="sr-only"
          onChange={(event) => handleFile(event.target.files?.[0])}
        />
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={isParsing}
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-primary/25 bg-background/80 px-5 py-3 font-bold text-primary shadow-sm transition hover:border-primary/50 hover:bg-background disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isParsing ? <Loader2 size={18} className="animate-spin" /> : <Upload size={18} />}
          {isParsing ? 'Reading resume...' : 'Choose PDF'}
        </button>
      </div>
      {(fileName || message) && (
        <div className="mt-4 border-t border-primary/15 pt-4 text-sm">
          {fileName && <p className="truncate font-semibold text-foreground">{fileName}</p>}
          {message && (
            <p className={`mt-1 flex items-start gap-2 ${isError ? 'text-destructive' : 'text-muted-foreground'}`}>
              {!isError && <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-green-600" />}
              {message}
            </p>
          )}
        </div>
      )}
    </section>
  );
}