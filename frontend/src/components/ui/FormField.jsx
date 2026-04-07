import { cn } from '../../lib/utils';

export function FormField({ className, children, ...props }) {
  return (
    <div className={cn('space-y-2', className)} {...props}>
      {children}
    </div>
  );
}

export function FormLabel({ className, children, required, ...props }) {
  return (
    <label
      className={cn('text-sm font-medium text-white/70', className)}
      {...props}
    >
      {children}
      {required && <span className="text-red-400 ml-1">*</span>}
    </label>
  );
}

export function FormDescription({ className, children, ...props }) {
  return (
    <p
      className={cn('text-sm text-white/40', className)}
      {...props}
    >
      {children}
    </p>
  );
}

export function FormMessage({ className, children, ...props }) {
  return (
    <p
      className={cn('text-sm font-medium text-red-400', className)}
      {...props}
    >
      {children}
    </p>
  );
}
