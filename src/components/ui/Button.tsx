import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'danger' | 'outline';
  fullWidth?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ children, variant = 'primary', fullWidth = false, className = '', ...props }, ref) => {
    
    let variantClasses = '';
    
    switch (variant) {
      case 'primary':
        variantClasses = 'bg-[#1a7fe0] hover:bg-[#1a7fe0]/80 text-white border border-transparent';
        break;
      case 'secondary':
        variantClasses = 'bg-[#13151e] hover:bg-[#1e2130] text-white border border-[#1e2130]';
        break;
      case 'danger':
        variantClasses = 'bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20';
        break;
      case 'outline':
        variantClasses = 'bg-transparent border border-[#21262d] text-white hover:bg-[#21262d]';
        break;
    }

    return (
      <button
        ref={ref}
        className={`flex items-center justify-center gap-2 rounded-[8px] px-4 py-2 text-[13px] font-medium transition-colors ${
          fullWidth ? 'w-full' : ''
        } ${props.disabled ? 'opacity-50 cursor-not-allowed' : ''} ${variantClasses} ${className}`}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';

export default Button;
