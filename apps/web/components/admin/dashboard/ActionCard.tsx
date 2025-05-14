'use client'

interface ActionCardProps {
  title: string
  count: number
  href: string
}

export default function ActionCard({ title, count, href }: ActionCardProps) {
  return (
    <a href={href} className="block p-4 border rounded-lg hover:shadow-lg transition">
      <div className="text-sm text-gray-500">{title}</div>
      <div className="text-xl font-semibold mt-1">{count}</div>
    </a>
  )
}
