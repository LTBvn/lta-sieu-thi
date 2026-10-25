import React from 'react'

type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label?: string
}

export default function Input({ label, className = '', ...rest }: InputProps) {
  return (
    <div className={`flex flex-col ${className}`}>
      {label && <label className="text-sm text-gray-700 mb-1">{label}</label>}
      <input className="border rounded-md px-3 py-2 focus:ring-1 focus:ring-primary" {...rest} />
    </div>
  )
}
