import { cn } from '../../lib/utils';

export function Input({ className, type, ...props }) {
  return (
    <input
      type={type}
      className={cn(
        'flex h-11 w-full rounded-xl px-4 py-2 text-base text-white',
        'bg-black/20 border border-white/[0.15]',
        'placeholder:text-white/30',
        'focus:outline-none focus:border-[#2b58f7]/50 focus:ring-2 focus:ring-[#2b58f7]/20',
        'transition-all duration-200',
        className
      )}
      {...props}
    />
  );
}
