'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

const NAV = [
  { href: '/', label: 'Dashboard' },
  { href: '/documents', label: 'Documents' },
  { href: '/ask', label: 'Ask' },
  { href: '/demo', label: 'Demo' },
  { href: '/history', label: 'History' },
]

export function AppHeader() {
  const path = usePathname()

  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="max-w-6xl mx-auto px-6 flex items-center justify-between h-14">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-sm font-semibold text-gray-900 tracking-tight">
            AI RFP Agent
          </span>
          <span className="text-xs text-gray-400 font-normal hidden sm:block">
            Enterprise Knowledge
          </span>
        </Link>

        <nav className="flex items-center gap-1">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'px-3 py-1.5 rounded text-sm font-medium transition-colors',
                path === item.href
                  ? 'bg-gray-100 text-gray-900'
                  : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
              )}
            >
              {item.label}
            </Link>
          ))}
          <button
            onClick={() => window.dispatchEvent(new Event('show-welcome'))}
            className="ml-1 w-7 h-7 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors text-sm font-medium"
            aria-label="About this tool"
          >
            ?
          </button>
        </nav>
      </div>
    </header>
  )
}
