import { useRef, useState } from 'react';
import { CheckCircle2, FileText, Info, Loader2, Upload } from 'lucide-react';
import { parseResumePdf, parseResumeText, type ParsedResume } from '../lib/resumeParser';
import { importLinkedInProfile } from '@workspace/api-client-react';

export interface ImportSummary {
  added: number;
  duplicates: number;
  activated: number;
  inactive: number;
  nameSet: boolean;
}

interface ResumeParserProps {
  onImport: (result: { name: string; skills: string[] }) => ImportSummary;
  disabled?: boolean;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024;

function describe(found: number, s: ImportSummary) {
  if (found === 0 && !s.nameSet) return 'Nothing was confidently detected. You can add skills manually.';
  const parts = [`Extracted ${found} skill${found === 1 ? '' : 's'}; saved ${s.added} new; activated ${s.activated} new`];
  if (s.duplicates) parts.push(`${s.duplicates} already in your list`);
  if (s.inactive) parts.push(`${s.inactive} inactive extracted skill${s.inactive === 1 ? '' : 's'} available to activate`);
  const name = s.nameSet ? ' Name filled in.' : '';
  return `${parts.join('; ')}.${name} New skills are set to Beginner. Please review their levels below.`;
}

export function ResumeParser({ onImport, disabled = false }: ResumeParserProps) {
  const onImportRef = useRef(onImport);
  onImportRef.current = onImport;
  const inputRef = useRef<HTMLInputElement>(null);
  const [mode, setMode] = useState<'pdf' | 'text' | 'url'>('pdf');
  const [isParsing, setIsParsing] = useState(false);
  const [fileName, setFileName] = useState('');
  const [pasted, setPasted] = useState('');
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);
  const [profileUrl, setProfileUrl] = useState('');
  const [consent, setConsent] = useState(false);

  const finish = (result: ParsedResume) => {
    const summary = onImportRef.current(result);
    setMessage(`${describe(result.detectedSkillCount, summary)}${!result.name ? ' No name was confidently identified; enter it manually rather than using a guessed skill or title.' : ''}`);
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

  const handleUrl = async () => {
    setMessage('');
    setIsError(false);
    setIsParsing(true);
    try {
      const result = await importLinkedInProfile({ url: profileUrl.trim(), consent });
      finish(result);
      if (!result.skills.length) {
        setMessage('The provider returned no skills for this profile. Any available name was imported without replacing your edits. Use your LinkedIn PDF or pasted profile text to import skills.');
      }
    } catch (error) {
      setIsError(true);
      const data = (error as { data?: { error?: unknown } })?.data;
      setMessage(typeof data?.error === 'string' ? data.error : 'We could not look up that profile. Please try PDF or text import.');
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
            Read all available skills from a resume PDF, a LinkedIn profile URL or PDF, or pasted LinkedIn text. Skills stay in source order; up to 20 are active for searches, and the rest remain available.
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
        <button type="button" role="tab" aria-selected={mode === 'url'} disabled={isParsing || disabled} onClick={() => setMode('url')} className={tab(mode === 'url')} data-testid="tab-linkedin-url">
          LinkedIn URL
        </button>
      </div>

      {mode === 'pdf' ? (
        <div key="pdf" className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
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
      ) : mode === 'text' ? (
        <div key="text" className="space-y-3">
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
      ) : (
        <div key="url" className="space-y-3">
          <label htmlFor="linkedin-url" className="block text-sm font-semibold">LinkedIn profile URL</label>
          <input
            id="linkedin-url"
            type="text"
            inputMode="url"
            autoComplete="off"
            placeholder="https://www.linkedin.com/in/your-profile"
            value={profileUrl}
            maxLength={500}
            onChange={(e) => { setProfileUrl(e.target.value); setConsent(false); }}
            disabled={isParsing || disabled}
            className="w-full rounded-xl border border-border/60 bg-background/70 px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
          <label className="flex items-start gap-2 text-sm text-muted-foreground">
            <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} disabled={isParsing || disabled} className="mt-1 shrink-0" />
            <span>I agree to send this profile URL to People Data Labs to look up available name and skills. Successful matches may consume credits from the connected provider account.</span>
          </label>
          <button
            type="button"
            onClick={handleUrl}
            disabled={isParsing || disabled || !consent || !profileUrl.trim()}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-primary/25 bg-background/80 px-5 py-3 font-bold text-primary shadow-sm transition hover:border-primary/50 disabled:cursor-not-allowed disabled:opacity-60"
            data-testid="button-import-url"
          >
            {isParsing && <Loader2 size={18} className="animate-spin" />}
            {isParsing ? 'Looking up profile...' : 'Import from LinkedIn URL'}
          </button>
          <p className="text-xs text-muted-foreground">Coverage may be incomplete or out of date. For a first import, the first 20 returned skills start active. The provider does not supply skill dates or guarantee LinkedIn's exact order; we preserve its returned order. Review the active selection and levels below.</p>
        </div>
      )}

      <div className="flex items-start gap-2 rounded-xl border border-border/60 bg-background/50 px-4 py-3 text-sm text-muted-foreground" role="note">
        <Info size={16} className="mt-0.5 shrink-0 text-primary" />
        <p>
          Original PDFs and pasted text are not saved or uploaded. Imported names, skills and your preferences are saved in this browser on this device. URL imports use People Data Labs through our server; the app does not save the profile URL or provider response to a database.
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
