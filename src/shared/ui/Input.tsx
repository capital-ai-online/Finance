import React from 'react';
import clsx from 'clsx';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  invalid?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, invalid = false, ...props },
  ref,
) {
  return (
    <input
      ref={ref}
      aria-invalid={invalid || undefined}
      className={clsx(
        'min-h-11 w-full rounded-lg border bg-black/30 px-3 py-2 text-sm text-white outline-none transition-colors placeholder:text-white/35 focus:border-aif-gold-DEFAULT focus:ring-2 focus:ring-aif-gold-DEFAULT/25',
        invalid ? 'border-red-400/50' : 'border-white/10',
        className,
      )}
      {...props}
    />
  );
});

export default Input;
