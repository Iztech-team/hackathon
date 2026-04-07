import { cva } from 'class-variance-authority';
import { cn } from '../../lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-xl text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2b58f7]/50 disabled:opacity-50 disabled:pointer-events-none',
  {
    variants: {
      variant: {
        default: 'bg-gradient-to-r from-[#a8842d] via-[#d4b069] to-[#e8c98a] text-[#1a1306] hover:from-[#b8932f] hover:via-[#e0bc78] hover:to-[#f0d49a]',
        blue: 'bg-gradient-to-r from-[#1e4fda] to-[#2e5afc] text-white hover:from-[#2558e8] hover:to-[#3d68ff]',
        secondary: 'bg-white/5 text-white border border-white/10 hover:bg-white/10',
        outline: 'border border-white/10 bg-transparent text-white hover:bg-white/5',
        ghost: 'text-white/70 hover:text-white hover:bg-white/5',
        destructive: 'bg-red-500/80 text-white hover:bg-red-500',
      },
      size: {
        default: 'h-11 py-2.5 px-5',
        sm: 'h-9 px-4 text-xs',
        lg: 'h-12 px-8 text-base',
        icon: 'h-10 w-10',
      },
      glow: {
        true: 'btn-glow',
        false: '',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
      glow: false,
    },
  }
);

export function Button({ className, variant, size, glow, ...props }) {
  return (
    <button
      className={cn(buttonVariants({ variant, size, glow, className }))}
      {...props}
    />
  );
}
