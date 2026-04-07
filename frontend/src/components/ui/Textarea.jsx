import { cn } from '../../lib/utils';

export function Textarea({ className, ...props }) {
  return (
    <textarea
      className={cn(
        'flex min-h-[100px] w-full rounded-xl px-4 py-3 text-base text-white',
        'bg-black/20 border border-white/[0.15]',
        'placeholder:text-white/30',
        'focus:outline-none focus:border-[#2b58f7]/50 focus:ring-2 focus:ring-[#2b58f7]/20',
        'transition-all duration-200 resize-none',
        className
      )}
      {...props}
    />
  );
}
