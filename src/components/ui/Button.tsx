import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  children: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({
  variant = 'primary', size = 'md', loading = false, children, className = '', disabled, ...props
}) => {
  const base = 'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 disabled:opacity-50 disabled:cursor-not-allowed btn-press';

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

  return (
    <button className={`${base} ${variants[variant]} ${sizes[size]} ${className}`} disabled={disabled || loading} {...props}>
      {loading && <span className="animate-spin mr-2 w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full" />}
      {children}
    </button>
  );
};

export default Button;
