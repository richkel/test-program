import React from 'react'
import { Play } from 'lucide-react'
import { useTheme } from '../../contexts/ThemeContext'

export const ReusableFooter: React.FC = () => {
  const { theme } = useTheme()

  return (
    <footer className={`${theme === 'dark' ? 'bg-black border-gray-800' : 'bg-white border-gray-200'} border-t w-full`}>
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
          <div className="text-3xl">🎬</div>
            <span className="text-lg font-bold">Vox-App</span>
          </div>

          <div className="flex items-center gap-6 text-sm">
            <a href="mailto:hello@vox.com" className={`${theme === 'dark' ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-900'} transition-colors`}>
              Contact
            </a>
            <a href="#" className={`${theme === 'dark' ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-900'} transition-colors`}>
              Privacy
            </a>
            <a href="#" className={`${theme === 'dark' ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-900'} transition-colors`}>
              Terms
            </a>
          </div>

          <div className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
            © 2024 Vox-App.
            <br />
             All rights reserved.
          </div>
        </div>
      </div>
    </footer>
  )
}
