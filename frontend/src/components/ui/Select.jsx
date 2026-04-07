import { cn } from '../../lib/utils';

export function Select({ className, options, placeholder, ...props }) {
  return (
    <select
      className={cn(
        'flex h-11 w-full rounded-xl px-4 py-2 text-base text-white',
        'bg-black/20 border border-white/[0.15]',
        'focus:outline-none focus:border-[#2b58f7]/50 focus:ring-2 focus:ring-[#2b58f7]/20',
        'transition-all duration-200',
        'appearance-none cursor-pointer',
        className
      )}
      {...props}
    >
      {placeholder && (
        <option value="" disabled>
          {placeholder}
        </option>
      )}
      {options.map((option) => (
        <option
          key={option.value}
          value={option.value}
          className="bg-zinc-900 text-white"
        >
          {option.label}
        </option>
      ))}
    </select>
  );
}

export function SelectField({ label, required, error, className, ...props }) {
  return (
    <div className={cn('space-y-2', className)}>
      {label && (
        <label className="block text-sm font-medium text-white/70">
          {label}
          {required && <span className="text-red-400 ml-1">*</span>}
        </label>
      )}
      <div className="relative">
        <Select {...props} />
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
          <svg
            className="h-4 w-4 text-white/40"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </div>
      </div>
      {error && <p className="text-sm text-red-400">{error}</p>}
    </div>
  );
}
