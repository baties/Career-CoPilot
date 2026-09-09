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
    if (score >= 90) return 'text-emerald-600 bg-emerald-50 border-emerald-200';
    if (score >= 75) return 'text-primary bg-primary/10 border-primary/20';
    if (score >= 60) return 'text-amber-600 bg-amber-50 border-amber-200';
    return 'text-muted-foreground bg-secondary border-border';
  };

  const scoreClasses = getScoreColor(job.score);

  return (
    <div className="group relative bg-card border border-border hover:border-primary/50 hover:shadow-md rounded-xl p-6 transition-all duration-300 animate-in fade-in slide-in-from-bottom-4">
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        
        {/* Main Content */}
        <div className="flex-1 space-y-4">
          <div>
            <h3 className="text-xl font-bold text-foreground group-hover:text-primary transition-colors flex items-center gap-2">
              {job.title}
            </h3>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-2 text-sm text-muted-foreground">
              <span className="flex items-center gap-1 font-medium text-foreground/80">
                <Building2 size={16} />
                {job.company}
              </span>
              <span className="flex items-center gap-1">
                <MapPin size={16} />
                {job.location}
              </span>
              <span className="flex items-center gap-1">
                <Briefcase size={16} />
                {job.workType}
              </span>
              <span className="flex items-center gap-1">
                <Calendar size={16} />
                {job.daysAgo === 0 ? 'Today' : `${job.daysAgo}d ago`}
              </span>
            </div>
          </div>

          {job.salary && (
            <div className="inline-flex items-center px-2.5 py-1 rounded-md bg-green-50 text-green-700 text-sm font-semibold border border-green-200">
              {job.salary}
            </div>
          )}

          <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">
            {job.summary}
          </p>

          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Matched Skills</h4>
            <div className="flex flex-wrap gap-2">
              {job.matchedSkills.map(skill => (
                <span 
                  key={skill} 
                  className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-secondary text-secondary-foreground border border-border"
                >
                  <CheckCircle2 size={12} className="text-primary" />
                  {skill}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Right side / Actions */}
        <div className="flex flex-row md:flex-col items-center md:items-end justify-between md:justify-start gap-4 shrink-0">
          <div className={`flex flex-col items-center justify-center w-16 h-16 rounded-full border-4 ${scoreClasses.split(' ')[2]} bg-card`}>
            <span className={`text-xl font-black ${scoreClasses.split(' ')[0]}`}>
              {job.score}
            </span>
            <span className={`text-[10px] font-bold uppercase tracking-wider ${scoreClasses.split(' ')[0]} opacity-80`}>
              Match
            </span>
          </div>

          <a 
            href={job.url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90 font-semibold rounded-lg transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
          >
            Apply Now
            <ExternalLink size={16} />
          </a>
        </div>
      </div>
    </div>
  );
}
