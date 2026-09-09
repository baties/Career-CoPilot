import React from 'react';
import { Building2, MapPin, Briefcase, Calendar, ExternalLink, CheckCircle2 } from 'lucide-react';
import type { JobMatch } from '@workspace/api-client-react';

interface JobCardProps {
  job: JobMatch;
  searchedSkills: string[];
}

export function JobCard({ job, searchedSkills }: JobCardProps) {
  // Determine score color based on value
  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-emerald-600 border-emerald-200 dark:text-emerald-400 dark:border-emerald-800 bg-emerald-500/10';
    if (score >= 75) return 'text-blue-600 border-blue-200 dark:text-blue-400 dark:border-blue-800 bg-blue-500/10';
    if (score >= 60) return 'text-amber-600 border-amber-200 dark:text-amber-400 dark:border-amber-800 bg-amber-500/10';
    return 'text-slate-600 border-slate-200 dark:text-slate-400 dark:border-slate-800 bg-slate-500/10';
  };

  const scoreClasses = getScoreColor(job.score);

  return (
    <div className="group relative bg-background/70 backdrop-blur-md border border-border/60 hover:border-primary/40 hover:bg-background/90 rounded-[1.5rem] p-6 md:p-8 transition-all duration-300 animate-in fade-in slide-in-from-bottom-4 shadow-sm hover:shadow-xl">
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
        
        {/* Main Content */}
        <div className="flex-1 space-y-5">
          <div>
            <h3 className="text-2xl font-extrabold text-foreground group-hover:text-primary transition-colors flex items-center gap-2">
              {job.title}
            </h3>
            <div className="flex flex-wrap items-center gap-x-5 gap-y-3 mt-3 text-sm text-muted-foreground font-medium">
              <span className="flex items-center gap-1.5 text-foreground/80">
                <Building2 size={18} className="text-primary/80" />
                {job.company}
              </span>
              <span className="flex items-center gap-1.5">
                <MapPin size={18} className="text-primary/80" />
                {job.location}
              </span>
              <span className="flex items-center gap-1.5">
                <Briefcase size={18} className="text-primary/80" />
                {job.workType}
              </span>
              <span className="flex items-center gap-1.5">
                <Calendar size={18} className="text-primary/80" />
                {job.daysAgo === 0 ? 'Today' : `${job.daysAgo}d ago`}
              </span>
            </div>
          </div>

          {job.salary && (
            <div className="inline-flex items-center px-3 py-1.5 rounded-lg bg-green-500/10 text-green-700 dark:text-green-400 text-sm font-bold border border-green-500/20 shadow-sm">
              {job.salary}
            </div>
          )}

          <p className="text-base text-muted-foreground leading-relaxed line-clamp-2 font-medium">
            {job.summary}
          </p>

          <div className="space-y-3 pt-2">
            <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Matched Skills</h4>
            <div className="flex flex-wrap gap-2.5">
              {job.matchedSkills.map(skill => (
                <span 
                  key={skill} 
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-secondary/80 border border-border/50 text-secondary-foreground shadow-sm"
                >
                  <CheckCircle2 size={14} className="text-primary" />
                  {skill}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Right side / Actions */}
        <div className="flex flex-row md:flex-col items-center md:items-end justify-between md:justify-start gap-5 shrink-0">
          <div className={`flex flex-col items-center justify-center w-20 h-20 rounded-2xl border-2 ${scoreClasses.split(' ').slice(1).join(' ')} shadow-sm`}>
            <span className={`text-2xl font-black ${scoreClasses.split(' ')[0]}`}>
              {job.score}
            </span>
            <span className={`text-[10px] font-bold uppercase tracking-widest ${scoreClasses.split(' ')[0]} opacity-80 mt-0.5`}>
              Match
            </span>
          </div>

          <a 
            href={job.url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-foreground text-background hover:bg-primary hover:text-primary-foreground font-bold rounded-xl transition-all shadow-sm hover:shadow-lg hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background"
          >
            Apply Now
            <ExternalLink size={18} />
          </a>
        </div>
      </div>
    </div>
  );
}
