'use client'

interface SummaryCardProps {
  title: string
  value: string | number
  icon?: React.ReactNode
  colorClass?: string
}

export default function SummaryCard({
  title, value, icon, colorClass = 'bg-blue-600'
}: SummaryCardProps) {
  return (
    <div className={`flex items-center p-4 rounded-lg shadow ${colorClass} text-white`}>
      {icon && <div className="mr-4">{icon}</div>}
      <div>
        <div className="text-sm font-medium">{title}</div>
        <div className="text-2xl font-bold">{value}</div>
      </div>
    </div>
  )
}
