import { useRef, useState } from 'react';
import { CheckCircle2, FileText, Info, Loader2, Upload } from 'lucide-react';
import { parseResumePdf, parseResumeText, type ParsedResume } from '../lib/resumeParser';

export interface ImportSummary {
  added: number;
  duplicates: number;
  overLimit: number;
  nameSet: boolean;
}

interface ResumeParserProps {
  onImport: (result: { name: string; skills: string[] }) => ImportSummary;
  disabled?: boolean;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024;

function describe(found: number, s: ImportSummary) {
  if (found === 0 && !s.nameSet) return 'Nothing was confidently detected. You can add skills manually.';
  const parts = [`Detected ${found} skill${found === 1 ? '' : 's'}; added ${s.added} new`];
  if (s.duplicates) parts.push(`${s.duplicates} already in your list`);
  if (s.overLimit) parts.push(`${s.overLimit} not added because the 10-skill limit was reached`);
  const name = s.nameSet ? ' Name filled in.' : '';
  return `${parts.join('; ')}.${name} New skills are set to Beginner. Please review their levels below.`;
}

export function ResumeParser({ onImport, disabled = false }: ResumeParserProps) {
  const onImportRef = useRef(onImport);
  onImportRef.current = onImport;
  const inputRef = useRef<HTMLInputElement>(null);
  const [mode, setMode] = useState<'pdf' | 'text'>('pdf');
  const [isParsing, setIsParsing] = useState(false);
  const [fileName, setFileName] = useState('');
  const [pasted, setPasted] = useState('');
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);

  const finish = (result: ParsedResume) => {
    const summary = onImportRef.current(result);
    summary.overLimit += result.detectedSkillCount - result.skills.length;
    setMessage(describe(result.detectedSkillCount, summary));
  };

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
      finish(await parseResumePdf(file));
    } catch (error) {
      setIsError(true);
      setMessage(error instanceof Error ? error.message : 'We could not read this PDF.');
    } finally {
      setIsParsing(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const handleText = async () => {
    setMessage('');
    setIsError(false);
    if (pasted.trim().length < 20) {
      setIsError(true);
      setMessage('Paste more of your profile text first.');
      return;
    }
    setIsParsing(true);
    try {
      finish(await parseResumeText(pasted));
    } catch (error) {
      setIsError(true);
      setMessage(error instanceof Error ? error.message : 'We could not read that text.');
    } finally {
      setIsParsing(false);
    }
  };

  const tab = (on: boolean) =>
    `rounded-lg px-4 py-2 text-sm font-bold transition focus:outline-none focus:ring-2 focus:ring-primary/50 ${
      on ? 'bg-primary text-primary-foreground' : 'bg-background/70 text-foreground hover:bg-background'
    }`;

  return (
    <section className="rounded-2xl border border-primary/20 bg-primary/[0.06] p-5 md:p-6 space-y-4">
      <div className="flex items-start gap-3">
        <div className="rounded-xl bg-primary/10 p-2.5 text-primary">
          <FileText size={24} />
        </div>
        <div>
          <h2 className="font-bold text-foreground">Import your skills</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Use a resume PDF, a LinkedIn profile PDF, or pasted LinkedIn text. Everything is read in this browser. Detected skills are merged into your list, up to 10.
          </p>
        </div>
      </div>

      <div role="tablist" aria-label="Import method" className="flex flex-wrap gap-2">
        <button type="button" role="tab" aria-selected={mode === 'pdf'} disabled={isParsing || disabled} onClick={() => setMode('pdf')} className={tab(mode === 'pdf')}>
          PDF upload
        </button>
        <button type="button" role="tab" aria-selected={mode === 'text'} disabled={isParsing || disabled} onClick={() => setMode('text')} className={tab(mode === 'text')} data-testid="tab-paste-text">
          Paste LinkedIn text
        </button>
      </div>

      {mode === 'pdf' ? (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">PDF up to 10 MB. Works with resumes and LinkedIn "Save to PDF" exports.</p>
          <input ref={inputRef} type="file" accept="application/pdf,.pdf" disabled={isParsing || disabled} className="sr-only" aria-label="Choose PDF file" onChange={(e) => handleFile(e.target.files?.[0])} />
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={isParsing || disabled}
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-primary/25 bg-background/80 px-5 py-3 font-bold text-primary shadow-sm transition hover:border-primary/50 hover:bg-background disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isParsing ? <Loader2 size={18} className="animate-spin" /> : <Upload size={18} />}
            {isParsing ? 'Reading resume...' : 'Choose PDF'}
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <label htmlFor="paste-profile" className="sr-only">Pasted LinkedIn profile text</label>
          <textarea
            id="paste-profile"
            rows={5}
            value={pasted}
            disabled={isParsing || disabled}
            maxLength={100000}
            onChange={(e) => setPasted(e.target.value)}
            placeholder="Open your LinkedIn profile, copy the About, Experience and Skills sections, and paste them here."
            className="w-full rounded-xl border border-border/60 bg-background/70 px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/50"
            data-testid="textarea-profile"
          />
          <button
            type="button"
            onClick={handleText}
            disabled={isParsing || disabled}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-primary/25 bg-background/80 px-5 py-3 font-bold text-primary shadow-sm transition hover:border-primary/50 disabled:opacity-60"
            data-testid="button-import-text"
          >
            {isParsing && <Loader2 size={18} className="animate-spin" />}
            Import from text
          </button>
        </div>
      )}

      <div className="flex items-start gap-2 rounded-xl border border-border/60 bg-background/50 px-4 py-3 text-sm text-muted-foreground" role="note">
        <Info size={16} className="mt-0.5 shrink-0 text-primary" />
        <p>
          Importing from a profile URL alone is unavailable until a URL import provider is connected. Paste your profile text or upload your LinkedIn PDF instead.
        </p>
      </div>

      {(fileName || message) && (
        <div className="border-t border-primary/15 pt-4 text-sm" aria-live="polite">
          {mode === 'pdf' && fileName && <p className="truncate font-semibold text-foreground">{fileName}</p>}
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
