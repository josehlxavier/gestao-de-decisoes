import * as React from 'react'
import { cn } from '@/lib/utils'

const badgeVariants = {
  default: 'border-transparent bg-blue-600 text-white hover:bg-blue-700',
  secondary: 'border-transparent bg-gray-100 text-gray-900 hover:bg-gray-200',
  destructive: 'border-transparent bg-red-500 text-white hover:bg-red-600',
  outline: 'text-gray-700 border-gray-300',
  success: 'border-transparent bg-green-100 text-green-800',
  warning: 'border-transparent bg-yellow-100 text-yellow-800',
}

function Badge({ className, variant = 'default', ...props }) {
  return (
    <div
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
        badgeVariants[variant] || badgeVariants.default,
        className
      )}
      {...props}
    />
  )
}

export { Badge }
