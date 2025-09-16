import React from 'react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertState } from '@/types'

interface AlertSystemProps {
  alerts: AlertState[]
  onRemoveAlert: (id: number) => void
}

const AlertSystem: React.FC<AlertSystemProps> = ({ alerts, onRemoveAlert }) => {
  return (
    <div className="fixed top-20 right-4 z-50 space-y-2 max-w-sm">
      {alerts.map((alert) => (
        <Alert key={alert.id} className={`animate-in slide-in-from-right-full duration-300 ${
          alert.type === 'success' ? 'border-green-200 bg-green-50 text-green-800' :
          alert.type === 'error' ? 'border-red-200 bg-red-50 text-red-800' :
          alert.type === 'warning' ? 'border-yellow-200 bg-yellow-50 text-yellow-800' :
          'border-blue-200 bg-blue-50 text-blue-800'
        }`}>
          <div className="flex items-center justify-between">
            <AlertDescription className="flex-1 pr-2">{alert.message}</AlertDescription>
            <button
              onClick={() => onRemoveAlert(alert.id)}
              className="flex-shrink-0 ml-2 text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Close alert"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </Alert>
      ))}
    </div>
  )
}

export default AlertSystem
