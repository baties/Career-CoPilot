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
    <div className="min-h-screen bg-background flex flex-col font-sans selection:bg-primary/20 selection:text-primary">
      {/* Header / Hero */}
      <header className="pt-16 pb-12 px-6 text-center relative overflow-hidden">
        {/* Abstract background blobs */}
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[150%] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute top-[20%] right-[-10%] w-[40%] h-[120%] bg-[#06b6d4]/5 rounded-full blur-[100px] pointer-events-none" />
        
        <div className="relative z-10 max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary font-semibold text-sm mb-4 border border-primary/20 animate-in fade-in slide-in-from-bottom-2">
            <Sparkles size={16} />
            Career Co-Pilot
          </div>
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-foreground animate-in fade-in slide-in-from-bottom-3">
            Find your next role in <br/>
            <span className="text-gradient">under 60 seconds</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-4 delay-75">
            Skip the noise. Enter your exact skills and preferences to instantly match with top verified jobs from across the web.
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-5xl mx-auto px-6 pb-24 relative z-10 space-y-12">
        
        {/* Search Form */}
        <div className="glass-card rounded-2xl shadow-xl p-6 md:p-8 animate-in fade-in slide-in-from-bottom-5 delay-150">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Job Title */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <Briefcase size={16} className="text-primary" />
                  Target Role
                </label>
                <input 
                  type="text"
                  placeholder="e.g. Senior Frontend Engineer"
                  className={`w-full px-4 py-2.5 rounded-lg border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-shadow ${errors.title ? 'border-destructive ring-destructive/20' : 'border-input'}`}
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  disabled={isSearching}
                />
                {errors.title && <p className="text-xs text-destructive font-medium">{errors.title}</p>}
              </div>

              {/* Location */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <MapPin size={16} className="text-primary" />
                  Location
                </label>
                <input 
                  type="text"
                  placeholder="e.g. San Francisco, CA or Remote"
                  className={`w-full px-4 py-2.5 rounded-lg border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-shadow ${errors.location ? 'border-destructive ring-destructive/20' : 'border-input'}`}
                  value={formData.location}
                  onChange={(e) => setFormData({...formData, location: e.target.value})}
                  disabled={isSearching}
                />
                {errors.location && <p className="text-xs text-destructive font-medium">{errors.location}</p>}
              </div>
              
              {/* Skills - spans full width */}
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <Sparkles size={16} className="text-primary" />
                  Core Skills (1-10)
                </label>
                <div className={`${errors.skills ? 'ring-2 ring-destructive/20 rounded-md' : ''}`}>
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
                {errors.skills && <p className="text-xs text-destructive font-medium">{errors.skills}</p>}
              </div>

              {/* Education */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <GraduationCap size={16} className="text-primary" />
                  Education Level
                </label>
                <div className="relative">
                  <select 
                    className="w-full px-4 py-2.5 rounded-lg border border-input bg-card text-foreground appearance-none focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-shadow cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
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
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                  </div>
                </div>
              </div>

              {/* Work Type */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <Laptop size={16} className="text-primary" />
                  Work Type
                </label>
                <div className="relative">
                  <select 
                    className="w-full px-4 py-2.5 rounded-lg border border-input bg-card text-foreground appearance-none focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-shadow cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    value={formData.workType}
                    onChange={(e) => setFormData({...formData, workType: e.target.value as any})}
                    disabled={isSearching}
                  >
                    <option value={JobSearchInputWorkType.any}>Any</option>
                    <option value={JobSearchInputWorkType.remote}>Remote</option>
                    <option value={JobSearchInputWorkType.hybrid}>Hybrid</option>
                    <option value={JobSearchInputWorkType.onsite}>On-site</option>
                  </select>
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                  </div>
                </div>
              </div>

            </div>

            <div className="pt-4 flex justify-end border-t border-border">
              <button 
                type="submit" 
                disabled={isSearching}
                className="w-full md:w-auto px-8 py-3.5 bg-primary text-primary-foreground font-bold rounded-lg shadow-lg hover:bg-primary/90 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-70 disabled:hover:translate-y-0 transition-all flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-card"
              >
                {isSearching ? (
                  <>
                    <Loader2 size={20} className="animate-spin" />
                    Finding Matches...
                  </>
                ) : (
                  <>
                    <Search size={20} />
                    Search Jobs
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Loading State */}
        {isSearching && (
          <div className="space-y-6 pt-8 animate-in fade-in">
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground space-y-4">
              <div className="relative">
                <div className="absolute inset-0 rounded-full blur-xl bg-primary/20 animate-pulse" />
                <Search size={48} className="text-primary animate-bounce relative z-10" />
              </div>
              <p className="text-lg font-medium text-foreground">Scanning thousands of active listings...</p>
              <div className="w-48 h-1.5 bg-secondary rounded-full overflow-hidden">
                <div className="h-full bg-primary rounded-full w-1/2 animate-[pulse_1s_ease-in-out_infinite] origin-left" style={{ animation: 'progress 2s infinite linear' }} />
              </div>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && !isSearching && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-6 flex items-start gap-4 animate-in fade-in slide-in-from-bottom-2">
            <AlertCircle className="text-destructive shrink-0 mt-0.5" size={24} />
            <div>
              <h3 className="text-lg font-bold text-destructive">Search Failed</h3>
              <p className="text-destructive/80 mt-1">
                We couldn't complete your search. Please check your connection and try again.
              </p>
            </div>
          </div>
        )}

        {/* Results */}
        {results && !isSearching && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div>
                <h2 className="text-2xl font-bold text-foreground">
                  Top Matches
                </h2>
                <p className="text-muted-foreground mt-1">
                  Found {results.jobs.length} roles from {results.totalScanned.toLocaleString()} scanned listings.
                </p>
              </div>
              {results.live && (
                <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-green-50 text-green-700 rounded-full text-xs font-bold uppercase tracking-wide border border-green-200">
                  <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  Live Search
                </div>
              )}
            </div>

            {results.jobs.length > 0 ? (
              <div className="space-y-4">
                {results.jobs.map((job, idx) => (
                  <div key={job.id} style={{ animationDelay: `${idx * 50}ms` }} className="animate-in fade-in slide-in-from-bottom-4 fill-mode-both">
                    <JobCard job={job} searchedSkills={formData.skills} />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-24 bg-card rounded-2xl border border-border shadow-sm">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-secondary mb-4">
                  <Search size={24} className="text-muted-foreground" />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-2">No perfect matches found</h3>
                <p className="text-muted-foreground max-w-md mx-auto">
                  We couldn't find any roles matching all your criteria right now. Try broadening your location, removing a few niche skills, or selecting "Any" work type.
                </p>
              </div>
            )}
          </div>
        )}
      </main>

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
