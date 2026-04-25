import React from 'react'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary'
  loading?: boolean
  fullWidth?: boolean
}

export default function Button({
  variant = 'primary',
  loading = false,
  fullWidth = false,
  disabled,
  className = '',
  children,
  ...props
}: ButtonProps) {
  const baseStyles = 'px-6 py-3 rounded-2xl font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed'
  
  const variantStyles = {
    primary: 'bg-[var(--color-primary)] text-white hover:bg-[#008043] active:bg-[#006633]',
    secondary: 'bg-white text-[var(--color-primary)] border-2 border-[var(--color-primary)] hover:bg-slate-50 active:bg-slate-100'
  }
  
  const widthStyle = fullWidth ? 'w-full' : ''
  
  return (
    <button
      disabled={disabled || loading}
      className={`${baseStyles} ${variantStyles[variant]} ${widthStyle} ${className}`}
      {...props}
    >
      {loading ? (
        <span className="inline-flex items-center gap-2">
          <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-r-transparent" />
          Loading...
        </span>
      ) : (
        children
      )}
    </button>
  )
}
