'use client'

interface ChartPanelProps {
  title: string
  children: React.ReactNode
}

export default function ChartPanel({ title, children }: ChartPanelProps) {
  return (
    <div className="bg-white rounded-lg shadow p-4 space-y-2">
      <h3 className="text-lg font-medium">{title}</h3>
      <div className="h-64">
        {children /* e.g. <canvas id="chart"/> or placeholder */}
      </div>
    </div>
  )
}
