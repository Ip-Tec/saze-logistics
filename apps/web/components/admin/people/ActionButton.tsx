// components/admin/people/ActionButton.tsx

'use client'

interface ActionButtonProps {
  label: string
  onClick: () => void
  colorClass?: string
  disabled?: boolean
}

export default function ActionButton({
  label, onClick,
  disabled = false,
  colorClass = 'bg-blue-600 hover:bg-blue-700 text-white'
}: ActionButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${colorClass} px-3 py-1 rounded text-sm font-medium transition cursor-pointer`}
    >
      {label}
    </button>
  )
}
