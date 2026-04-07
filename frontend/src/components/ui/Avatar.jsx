import { useState } from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';

const sizeClasses = {
  xs: 'w-6 h-6',
  sm: 'w-8 h-8',
  md: 'w-12 h-12',
  lg: 'w-16 h-16',
  xl: 'w-24 h-24',
};

export function Avatar({ seed, size = 'md', className, alt = 'Avatar' }) {
  const avatarUrl = `https://api.dicebear.com/9.x/lorelei/svg?seed=${encodeURIComponent(seed)}`;

  return (
    <img
      src={avatarUrl}
      alt={alt}
      className={cn(
        'rounded-full bg-white/5 border border-white/10',
        sizeClasses[size],
        className
      )}
    />
  );
}

export function TeamLogo({ seed, size = 'md', className, alt = 'Team Logo' }) {
  const logoUrl = `https://api.dicebear.com/9.x/glass/svg?seed=${encodeURIComponent(seed)}`;

  return (
    <img
      src={logoUrl}
      alt={alt}
      className={cn(
        'rounded-xl bg-white/5 border border-white/10',
        sizeClasses[size],
        className
      )}
    />
  );
}

// Pre-defined avatar seeds for picker - expanded list
const AVATAR_PRESETS = [
  // Row 1 - Tech themed
  'happy-coder', 'tech-ninja', 'pixel-hero', 'cyber-punk', 'digital-star', 'code-wizard',
  // Row 2 - Dev themed
  'byte-master', 'data-sage', 'cloud-surfer', 'algo-ace', 'stack-pro', 'dev-legend',
  // Row 3 - Creative
  'pixel-artist', 'web-guru', 'api-master', 'debug-hero', 'git-wizard', 'react-ninja',
  // Row 4 - Fun
  'coffee-coder', 'night-owl', 'bug-hunter', 'feature-king', 'merge-master', 'deploy-hero',
  // Row 5 - Professional
  'senior-dev', 'tech-lead', 'full-stack', 'backend-pro', 'frontend-ace', 'devops-guru',
  // Row 6 - Nature
  'mountain-dev', 'ocean-coder', 'forest-hacker', 'desert-ninja', 'arctic-dev', 'tropical-coder',
];

export function AvatarPicker({ value, onChange, className }) {
  const [isOpen, setIsOpen] = useState(false);
  const [customSeed, setCustomSeed] = useState('');

  const handleSelect = (seed) => {
    onChange(seed);
    setIsOpen(false);
  };

  const handleCustomSeed = () => {
    if (customSeed.trim()) {
      onChange(customSeed.trim());
      setCustomSeed('');
      setIsOpen(false);
    }
  };

  return (
    <div className={cn('relative', className)}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 p-2 rounded-xl bg-white/[0.03] border border-white/[0.08] hover:bg-white/[0.06] transition-colors"
      >
        <Avatar seed={value || 'default'} size="sm" />
        <svg className="w-4 h-4 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <>
          {/* Backdrop — closes the picker when tapping outside, especially on mobile */}
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />

          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute z-50 top-full mt-2 p-3 rounded-xl bg-black/95 border border-white/10 shadow-2xl
                       w-[min(20rem,calc(100vw-2rem))]
                       start-1/2 -translate-x-1/2 sm:start-0 sm:translate-x-0"
          >
            <p className="text-xs text-white/40 uppercase tracking-wider mb-2">Choose Avatar</p>
            <div className="max-h-48 overflow-y-auto pe-1 mb-3 scrollbar-thin">
              <div className="grid grid-cols-6 gap-2">
                {AVATAR_PRESETS.map((seed) => (
                  <button
                    key={seed}
                    type="button"
                    onClick={() => handleSelect(seed)}
                    className={cn(
                      'p-1 rounded-lg transition-all flex items-center justify-center',
                      value === seed
                        ? 'bg-[#d4b069]/20 ring-2 ring-[#d4b069]'
                        : 'hover:bg-white/10'
                    )}
                  >
                    <Avatar seed={seed} size="sm" />
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-2 border-t border-white/[0.06]">
              <p className="text-xs text-white/40 mb-2">Or enter custom name</p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={customSeed}
                  onChange={(e) => setCustomSeed(e.target.value)}
                  placeholder="Your name..."
                  className="flex-1 min-w-0 px-3 py-1.5 rounded-lg bg-white/[0.05] border border-white/[0.08] text-white text-sm placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-[#d4b069]"
                  onKeyDown={(e) => e.key === 'Enter' && handleCustomSeed()}
                />
                <button
                  type="button"
                  onClick={handleCustomSeed}
                  className="px-3 py-1.5 rounded-lg bg-[#d4b069] text-[#1a1306] text-sm font-semibold hover:bg-[#e0bc78] transition-colors"
                >
                  Set
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </div>
  );
}

export function AvatarGroup({ seeds, size = 'sm', max = 4, className }) {
  const displayed = seeds.slice(0, max);
  const remaining = seeds.length - max;

  return (
    <div className={cn('flex -space-x-2', className)}>
      {displayed.map((seed, idx) => (
        <Avatar
          key={seed}
          seed={seed}
          size={size}
          className="ring-2 ring-black"
        />
      ))}
      {remaining > 0 && (
        <div
          className={cn(
            'flex items-center justify-center rounded-full bg-white/10 border border-white/20 text-xs font-medium text-white ring-2 ring-black',
            sizeClasses[size]
          )}
        >
          +{remaining}
        </div>
      )}
    </div>
  );
}
