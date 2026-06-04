'use client'

interface Props {
  label: string
  value: number
  min: number
  max: number
  step?: number
  unit?: string
  onChange: (value: number) => void
}

export default function RangeSlider({ label, value, min, max, step = 1, unit = '', onChange }: Props) {
  return (
    <div>
      <label className="text-sm text-white/70 mb-2 block">{label}</label>
      <div className="flex items-center gap-3">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={e => onChange(Number(e.target.value))}
          className="flex-1"
        />
        <span className="text-sm text-white/80 w-12 text-right tabular-nums">
          {value}{unit}
        </span>
      </div>
    </div>
  )
}
