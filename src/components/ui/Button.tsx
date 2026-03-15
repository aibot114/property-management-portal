import { cn } from '@/lib/utils'
import { type ButtonHTMLAttributes, forwardRef } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline'
  size?: 'sm' | 'md' | 'lg'
}

const VARIANT_STYLES = {
  primary:   'bg-[#BFF549] text-[#0D0D0D] hover:bg-[#AADB3A] font-semibold',
  secondary: 'bg-[#1E1E1E] text-white hover:bg-[#2A2A2A] border border-[#272727]',
  ghost:     'bg-transparent text-[#A1A1A1] hover:bg-[#1E1E1E] hover:text-white',
  danger:    'bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20',
  outline:   'bg-transparent text-white border border-[#272727] hover:border-[#383838] hover:bg-[#1E1E1E]',
}

const SIZE_STYLES = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2 text-sm',
  lg: 'px-5 py-2.5 text-sm',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'secondary', size = 'md', className, children, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled}
        className={cn(
          'inline-flex items-center justify-center gap-2 rounded-xl transition-colors duration-150',
          'disabled:opacity-40 disabled:cursor-not-allowed',
          VARIANT_STYLES[variant],
          SIZE_STYLES[size],
          className
        )}
        {...props}
      >
        {children}
      </button>
    )
  }
)
Button.displayName = 'Button'
