import React, { useRef, useState, useCallback } from 'react';

interface RippleData {
  id: number;
  x: number;
  y: number;
}

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  children: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({
  variant = 'primary', size = 'md', loading = false, children, className = '', disabled, onClick, ...props
}) => {
  const [ripples, setRipples] = useState<RippleData[]>([]);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const base = 'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 disabled:opacity-50 disabled:cursor-not-allowed btn-press ripple-container';

  const variants: Record<string, string> = {
    primary: 'bg-primary text-on-primary hover:bg-primary-active',
    secondary: 'bg-canvas text-ink hairline hover:bg-surface-soft',
    ghost: 'text-muted hover:text-ink hover:bg-surface-soft',
    danger: 'bg-danger text-white hover:bg-danger/80',
  };

  const sizes: Record<string, string> = {
    sm: 'h-8 px-3 text-xs',
    md: 'h-10 px-5 text-sm',
    lg: 'h-11 px-6 text-sm',
  };

  const handleClick = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const id = Date.now();
    setRipples(prev => [...prev, { id, x, y }]);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setRipples([]), 500);
    onClick?.(e);
  }, [onClick]);

  return (
    <button className={`${base} ${variants[variant]} ${sizes[size]} ${className}`} disabled={disabled || loading} onClick={handleClick} {...props}>
      {loading && <span className="animate-spin mr-2 w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full" />}
      {ripples.map(r => (
        <span key={r.id} className="ripple-span" style={{ left: r.x - 4, top: r.y - 4, width: 8, height: 8 }} />
      ))}
      <span className="relative z-10">{children}</span>
    </button>
  );
};

export default Button;
