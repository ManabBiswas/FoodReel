import React, { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'

const baseInput =
  'w-full rounded-xl border bg-white px-4 py-3 font-sans text-[15px] text-[#1a1208] placeholder:text-[#9e9890] transition-colors focus:border-[#ff6a00] focus:outline-none focus:ring-2 focus:ring-[#ff6a00]/15 disabled:cursor-not-allowed disabled:opacity-60'

const AuthField = ({
  id,
  label,
  error,
  type = 'text',
  as = 'input',
  className = '',
  ...props
}) => {
  const [visible, setVisible] = useState(false)
  const isPassword = type === 'password'
  const inputType = isPassword && visible ? 'text' : type
  const errorId = error ? `${id}-error` : undefined
  const Tag = as

  return (
    <div>
      <label
        htmlFor={id}
        className="mb-1.5 block font-sans text-[13px] font-semibold text-[#3f3428]"
      >
        {label}
      </label>
      <div className="relative">
        <Tag
          id={id}
          name={id}
          type={as === 'input' ? inputType : undefined}
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={errorId}
          className={`${baseInput} ${
            error ? 'border-[#b91c1c]' : 'border-[#d9cdb9]'
          } ${isPassword ? 'pr-12' : ''} ${className}`}
          {...props}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setVisible((current) => !current)}
            className="absolute inset-y-0 right-0 flex w-12 items-center justify-center text-[#6b6460] transition-colors hover:text-[#1a1208] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff6a00]"
            aria-label={visible ? 'Hide password' : 'Show password'}
          >
            {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        )}
      </div>
      {error && (
        <p id={errorId} className="mt-1.5 font-sans text-xs text-[#b91c1c]">
          {error}
        </p>
      )}
    </div>
  )
}

export default AuthField
