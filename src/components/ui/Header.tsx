import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import ThemeToggle from './ThemeToggle'
import { useTheme } from '../../contexts/ThemeContext'

export const ReusableHeader: React.FC = () => {
  const location = useLocation()
  const { theme } = useTheme()

  const isActive = (path: string) => {
    return location.pathname === path
  }

  return (
    <header className={`${theme === 'dark' ? 'bg-black border-gray-800' : 'bg-white border-gray-200'} border-b sticky top-0 z-50 shadow-sm`}>
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
          <div className="text-3xl">🎬</div>
            <span className="text-2xl font-bold">Vox-App</span>
          </Link>

          <nav className="hidden md:flex items-center gap-8">
            <Link
              to="/"
              className={`transition-colors ${
                isActive('/')
                  ? 'text-red-500 font-semibold'
                  : theme === 'dark'
                    ? 'text-white hover:text-red-500'
                    : 'text-gray-700 hover:text-red-500'
              }`}
            >
              Home
            </Link>
            <Link
              to="/studio"
              className={`transition-colors ${
                isActive('/studio')
                  ? 'text-red-500 font-semibold'
                  : theme === 'dark'
                    ? 'text-white hover:text-red-500'
                    : 'text-gray-700 hover:text-red-500'
              }`}
            >
              Studio
            </Link>
            <Link
              to="/contact"
              className={`transition-colors ${
                isActive('/contact')
                  ? 'text-red-500 font-semibold'
                  : theme === 'dark'
                    ? 'text-white hover:text-red-500'
                    : 'text-gray-700 hover:text-red-500'
              }`}
            >
              Contact
            </Link>
            <Link
              to="/faq"
              className={`transition-colors ${
                isActive('/faq')
                  ? 'text-red-500 font-semibold'
                  : theme === 'dark'
                    ? 'text-white hover:text-red-500'
                    : 'text-gray-700 hover:text-red-500'
              }`}
            >
              FAQ
            </Link>
          </nav>

          <div className="flex items-center gap-4">
            <ThemeToggle />
            <button className="md:hidden text-gray-600 dark:text-gray-300 p-2">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}
