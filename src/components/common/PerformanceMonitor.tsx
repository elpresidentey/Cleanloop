import React, { useEffect, useState } from 'react'

interface PerformanceMonitorProps {
  componentName: string
  children: React.ReactNode
}

export const PerformanceMonitor: React.FC<PerformanceMonitorProps> = ({ 
  componentName, 
  children 
}) => {
  const [renderTime, setRenderTime] = useState<number | null>(null)

  useEffect(() => {
    const startTime = performance.now()
    
    const timer = setTimeout(() => {
      const endTime = performance.now()
      const duration = endTime - startTime
      setRenderTime(duration)
      
      if (duration > 1000) {
        console.warn(`⚠️ Slow render detected in ${componentName}: ${duration.toFixed(2)}ms`)
      }
    }, 0)

    return () => clearTimeout(timer)
  }, [componentName])

  return (
    <>
      {children}
      {process.env.NODE_ENV === 'development' && renderTime && renderTime > 500 && (
        <div className="fixed bottom-4 right-4 bg-yellow-100 border border-yellow-400 text-yellow-700 px-3 py-2 rounded text-xs">
          {componentName}: {renderTime.toFixed(0)}ms
        </div>
      )}
    </>
  )
}