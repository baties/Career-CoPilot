import React, { useState } from 'react';
import { useSearchJobs } from '@workspace/api-client-react';
import type { 
  JobSearchInput, 
  JobSearchResponse 
} from '@workspace/api-client-react';
import { 
  JobSearchInputEducation, 
  JobSearchInputWorkType 
} from '@workspace/api-client-react';
import { SkillInput } from '../components/SkillInput';
import { JobCard } from '../components/JobCard';
import { Search, Loader2, Sparkles, AlertCircle, Briefcase, MapPin, GraduationCap, Laptop } from 'lucide-react';
import { z } from 'zod';
import bgImage from '@assets/generated_images/job-finder-background.jpg';

// Simple validation schema
const searchSchema = z.object({
  title: z.string().min(2, "Job title must be at least 2 characters").max(100),
  skills: z.array(z.string()).min(1, "Add at least one skill").max(10, "Maximum 10 skills allowed"),
  location: z.string().min(2, "Location must be at least 2 characters").max(100),
  education: z.enum(['high-school', 'diploma', 'bachelors', 'masters', 'doctorate']),
  workType: z.enum(['remote', 'hybrid', 'onsite', 'any']),
});

export default function Home() {
  const [formData, setFormData] = useState<JobSearchInput>({
    title: '',
    skills: [],
    location: '',
    education: 'bachelors',
    workType: 'any'
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const searchJobs = useSearchJobs();

  const validateForm = () => {
    try {
      searchSchema.parse(formData);
      setErrors({});
      return true;
    } catch (err) {
      if (err instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        err.errors.forEach(e => {
          if (e.path[0]) {
            newErrors[e.path[0].toString()] = e.message;
          }
        });
        setErrors(newErrors);
      }
      return false;
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    searchJobs.mutate({ data: formData });
  };

  const isSearching = searchJobs.isPending;
  const results = searchJobs.data;
  const error = searchJobs.error;

  return (
    <div className="min-h-[100dvh] flex flex-col font-sans selection:bg-primary/20 selection:text-primary relative overflow-hidden bg-background">
      {/* Cinematic Background Layer */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <img
          src={bgImage}
          alt=""
          className="absolute inset-0 w-full h-full object-cover object-center"
        />
        <div className="absolute inset-0 bg-background/85 dark:bg-background/90 backdrop-blur-[2px]" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/40 to-background/95" />
      </div>

      <div className="relative z-10 flex flex-col flex-1 w-full">
        {/* Header / Hero */}
        <header className="pt-20 pb-14 px-6 text-center">
          <div className="max-w-3xl mx-auto space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-background/80 dark:bg-slate-900/80 backdrop-blur-md text-primary font-semibold text-sm border border-primary/20 shadow-sm animate-in fade-in slide-in-from-bottom-2">
              <Sparkles size={16} />
              <span>Career Co-Pilot</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-foreground animate-in fade-in slide-in-from-bottom-3 drop-shadow-sm">
              Find your next role in <br className="hidden sm:block"/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-cyan-500">
                under 60 seconds
              </span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-4 delay-75 font-medium leading-relaxed">
              Skip the noise. Enter your exact skills and preferences to instantly match with top verified jobs from across the web.
            </p>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 w-full max-w-5xl mx-auto px-6 pb-24 space-y-12">

          {/* Search Form */}
          <div className="glass-card rounded-[2rem] p-6 md:p-10 animate-in fade-in slide-in-from-bottom-5 delay-150">
            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

                {/* Job Title */}
                <div className="space-y-2.5">
                  <label className="text-sm font-bold text-foreground/90 flex items-center gap-2">
                    <Briefcase size={18} className="text-primary" />
                    Target Role
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Senior Frontend Engineer"
                    className={`w-full px-5 py-3.5 rounded-xl border bg-background/60 backdrop-blur-md text-foreground font-medium placeholder:text-muted-foreground/70 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all shadow-sm hover:border-primary/30 ${errors.title ? 'border-destructive ring-destructive/20' : 'border-border/60'}`}
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    disabled={isSearching}
                  />
                  {errors.title && <p className="text-sm text-destructive font-semibold">{errors.title}</p>}
                </div>

                {/* Location */}
                <div className="space-y-2.5">
                  <label className="text-sm font-bold text-foreground/90 flex items-center gap-2">
                    <MapPin size={18} className="text-primary" />
                    Location
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. San Francisco, CA or Remote"
                    className={`w-full px-5 py-3.5 rounded-xl border bg-background/60 backdrop-blur-md text-foreground font-medium placeholder:text-muted-foreground/70 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all shadow-sm hover:border-primary/30 ${errors.location ? 'border-destructive ring-destructive/20' : 'border-border/60'}`}
                    value={formData.location}
                    onChange={(e) => setFormData({...formData, location: e.target.value})}
                    disabled={isSearching}
                  />
                  {errors.location && <p className="text-sm text-destructive font-semibold">{errors.location}</p>}
                </div>

                {/* Skills - spans full width */}
                <div className="space-y-2.5 md:col-span-2">
                  <label className="text-sm font-bold text-foreground/90 flex items-center gap-2">
                    <Sparkles size={18} className="text-primary" />
                    Core Skills (1-10)
                  </label>
                  <div className={`${errors.skills ? 'ring-2 ring-destructive/20 rounded-xl' : ''}`}>
                    <SkillInput
                      skills={formData.skills}
                      onChange={(skills) => {
                        setFormData({...formData, skills});
                        if (errors.skills && skills.length > 0) {
                          setErrors({...errors, skills: ''});
                        }
                      }}
                      maxSkills={10}
                    />
                  </div>
                  {errors.skills && <p className="text-sm text-destructive font-semibold">{errors.skills}</p>}
                </div>

                {/* Education */}
                <div className="space-y-2.5">
                  <label className="text-sm font-bold text-foreground/90 flex items-center gap-2">
                    <GraduationCap size={18} className="text-primary" />
                    Education Level
                  </label>
                  <div className="relative group">
                    <select
                      className="w-full px-5 py-3.5 rounded-xl border border-border/60 bg-background/60 backdrop-blur-md text-foreground font-medium appearance-none focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all shadow-sm hover:border-primary/30 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                      value={formData.education}
                      onChange={(e) => setFormData({...formData, education: e.target.value as any})}
                      disabled={isSearching}
                    >
                      <option value={JobSearchInputEducation['high-school']}>High School</option>
                      <option value={JobSearchInputEducation.diploma}>Diploma</option>
                      <option value={JobSearchInputEducation.bachelors}>Bachelor's Degree</option>
                      <option value={JobSearchInputEducation.masters}>Master's Degree</option>
                      <option value={JobSearchInputEducation.doctorate}>Doctorate</option>
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground group-hover:text-primary transition-colors">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                    </div>
                  </div>
                </div>

                {/* Work Type */}
                <div className="space-y-2.5">
                  <label className="text-sm font-bold text-foreground/90 flex items-center gap-2">
                    <Laptop size={18} className="text-primary" />
                    Work Type
                  </label>
                  <div className="relative group">
                    <select
                      className="w-full px-5 py-3.5 rounded-xl border border-border/60 bg-background/60 backdrop-blur-md text-foreground font-medium appearance-none focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all shadow-sm hover:border-primary/30 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                      value={formData.workType}
                      onChange={(e) => setFormData({...formData, workType: e.target.value as any})}
                      disabled={isSearching}
                    >
                      <option value={JobSearchInputWorkType.any}>Any</option>
                      <option value={JobSearchInputWorkType.remote}>Remote</option>
                      <option value={JobSearchInputWorkType.hybrid}>Hybrid</option>
                      <option value={JobSearchInputWorkType.onsite}>On-site</option>
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground group-hover:text-primary transition-colors">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                    </div>
                  </div>
                </div>

              </div>

              <div className="pt-6 flex justify-end border-t border-border/50">
                <button
                  type="submit"
                  disabled={isSearching}
                  className="w-full md:w-auto px-10 py-4 bg-primary text-primary-foreground font-bold text-lg rounded-xl shadow-[0_8px_30px_-10px_rgba(37,99,235,0.6)] hover:shadow-[0_12px_40px_-12px_rgba(37,99,235,0.8)] hover:bg-primary/95 hover:-translate-y-1 active:translate-y-0 disabled:opacity-70 disabled:hover:translate-y-0 disabled:shadow-none transition-all duration-300 flex items-center justify-center gap-3 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background"
                >
                  {isSearching ? (
                    <>
                      <Loader2 size={22} className="animate-spin" />
                      Finding Matches...
                    </>
                  ) : (
                    <>
                      <Search size={22} />
                      Search Jobs
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Loading State */}
          {isSearching && (
            <div className="space-y-6 pt-12 pb-16 animate-in fade-in">
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground space-y-6">
                <div className="relative">
                  <div className="absolute inset-0 rounded-full blur-2xl bg-primary/30 animate-pulse" />
                  <Search size={56} className="text-primary animate-bounce relative z-10" />
                </div>
                <p className="text-xl font-bold text-foreground drop-shadow-sm">Scanning thousands of active listings...</p>
                <div className="w-64 h-2 bg-secondary rounded-full overflow-hidden shadow-inner">
                  <div className="h-full bg-primary rounded-full w-1/2 animate-[progress_1.5s_ease-in-out_infinite] origin-left" style={{ animation: 'progress 2s infinite linear' }} />
                </div>
              </div>
            </div>
          )}

          {/* Error State */}
          {error && !isSearching && (
            <div className="bg-destructive/10 border-2 border-destructive/20 backdrop-blur-md rounded-2xl p-6 flex items-start gap-4 animate-in fade-in slide-in-from-bottom-2 shadow-sm">
              <AlertCircle className="text-destructive shrink-0 mt-1" size={24} />
              <div>
                <h3 className="text-lg font-bold text-destructive">Search Failed</h3>
                <p className="text-destructive/80 mt-1 font-medium">
                  We couldn't complete your search. Please check your connection and try again.
                </p>
              </div>
            </div>
          )}

          {/* Results */}
          {results && !isSearching && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
              <div className="flex items-center justify-between border-b border-border/50 pb-6">
                <div>
                  <h2 className="text-3xl font-extrabold text-foreground drop-shadow-sm">
                    Top Matches
                  </h2>
                  <p className="text-muted-foreground mt-2 font-medium text-lg">
                    Found <span className="text-foreground font-bold">{results.jobs.length}</span> roles from <span className="text-foreground font-bold">{results.totalScanned.toLocaleString()}</span> scanned listings.
                  </p>
                </div>
                {results.live && (
                  <div className="hidden md:flex items-center gap-2.5 px-4 py-1.5 bg-green-500/10 text-green-700 dark:text-green-400 rounded-full text-xs font-bold uppercase tracking-widest border border-green-500/20 shadow-sm backdrop-blur-md">
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    Live Search
                  </div>
                )}
              </div>

              {results.jobs.length > 0 ? (
                <div className="space-y-5">
                  {results.jobs.map((job, idx) => (
                    <div key={job.id} style={{ animationDelay: `${idx * 50}ms` }} className="animate-in fade-in slide-in-from-bottom-4 fill-mode-both">
                      <JobCard job={job} searchedSkills={formData.skills} />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-32 bg-background/50 backdrop-blur-md rounded-[2rem] border border-border/60 shadow-sm">
                  <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-secondary mb-6 shadow-inner">
                    <Search size={32} className="text-muted-foreground" />
                  </div>
                  <h3 className="text-2xl font-extrabold text-foreground mb-3">No perfect matches found</h3>
                  <p className="text-muted-foreground text-lg max-w-md mx-auto font-medium">
                    We couldn't find any roles matching all your criteria right now. Try broadening your location, removing a few niche skills, or selecting "Any" work type.
                  </p>
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes progress {
          0% { transform: translateX(-100%) scaleX(0.2); }
          50% { transform: translateX(0%) scaleX(0.5); }
          100% { transform: translateX(200%) scaleX(0.2); }
        }
      `}} />
    </div>
  );
}
