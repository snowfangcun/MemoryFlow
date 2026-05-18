import React, { forwardRef } from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(({ label, error, className = '', ...props }, ref) => (
  <div className="space-y-1.5">
    {label && <label className="block text-sm font-medium text-body">{label}</label>}
    <input ref={ref}
      className={`w-full h-10 px-3.5 rounded-lg bg-canvas text-ink text-sm border hairline placeholder:text-muted-soft
        focus:outline-none focus:border-primary focus:ring-[3px] focus:ring-primary/15 transition-all duration-150
        ${error ? 'border-danger focus:border-danger focus:ring-danger/15' : ''} ${className}`} {...props} />
    {error && <p className="text-xs text-danger">{error}</p>}
  </div>
));
Input.displayName = 'Input';

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(({ label, error, className = '', ...props }, ref) => (
  <div className="space-y-1.5">
    {label && <label className="block text-sm font-medium text-body">{label}</label>}
    <textarea ref={ref}
      className={`w-full px-3.5 py-2.5 rounded-lg bg-canvas text-ink text-sm border hairline placeholder:text-muted-soft resize-none
        focus:outline-none focus:border-primary focus:ring-[3px] focus:ring-primary/15 transition-all duration-150
        ${error ? 'border-danger focus:border-danger focus:ring-danger/15' : ''} ${className}`} {...props} />
    {error && <p className="text-xs text-danger">{error}</p>}
  </div>
));
Textarea.displayName = 'Textarea';

export { Input, Textarea };
