import { cn } from '../../lib/utils';

const sizeClasses = {
  sm: 'text-[10px] px-2 py-0.5',
  md: 'text-xs px-2.5 py-1',
  lg: 'text-sm px-3 py-1.5',
};

export function Badge({
  children,
  color,
  size = 'md',
  variant = 'default',
  className,
}) {
  const baseClasses = 'inline-flex items-center font-medium rounded-full transition-colors';

  const variantClasses = {
    default: 'bg-white/10 text-white border border-white/10',
    solid: '',
    outline: 'bg-transparent border',
  };

  const style = color
    ? {
        backgroundColor: variant === 'solid' ? color : `${color}20`,
        color: variant === 'solid' ? '#fff' : color,
        borderColor: variant === 'outline' ? color : 'transparent',
      }
    : {};

  return (
    <span
      className={cn(
        baseClasses,
        sizeClasses[size],
        !color && variantClasses[variant],
        className
      )}
      style={color ? style : undefined}
    >
      {children}
    </span>
  );
}

export function CategoryBadge({ category, size = 'md', showScore, score }) {
  return (
    <Badge color={category.color} size={size}>
      {category.name}
      {showScore && score !== undefined && (
        <span className="ml-1.5 font-bold">{score}</span>
      )}
    </Badge>
  );
}
