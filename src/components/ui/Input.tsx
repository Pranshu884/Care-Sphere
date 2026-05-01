import { forwardRef, type InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className = '', error, ...props }, ref) => {
    return (
      <div className="w-full">
        <input
          ref={ref}
          className={`w-full bg-[#13151e] border border-[#1e2130] rounded-[8px] px-3 py-2 text-[13px] text-white placeholder-[#585f73] focus:outline-none focus:border-[#1a7fe0]/50 transition-colors ${
            error ? 'border-red-500/50 focus:border-red-500/50' : ''
          } ${className}`}
          {...props}
        />
        {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;
