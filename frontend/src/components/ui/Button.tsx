import React from 'react'

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'ghost' | 'outline'
  size?: 'sm' | 'md' | 'lg'
}

export default function Button({ variant = 'primary', size = 'md', className = '', children, ...rest }: ButtonProps) {
  const variantCls = variant === 'primary'
    ? 'bg-primary text-white border-transparent'
    : variant === 'ghost'
      ? 'bg-white text-primary border border-primary'
      : 'bg-white text-gray-700 border border-gray-200'

  const sizeCls = size === 'sm' ? 'px-3 py-1 text-sm' : size === 'lg' ? 'px-6 py-3 text-base' : 'px-4 py-2 text-sm'

  return (
    <button className={`${variantCls} ${sizeCls} rounded-md focus:outline-none ${className}`} {...rest}>
      {children}
    </button>
  )
}
