interface EmptyCopyProps {
  title: string
  hint?: string
}

export function EmptyCopy({ title, hint }: EmptyCopyProps) {
  return (
    <div className="space-y-1">
      <p className="mb-0 font-medium text-slate-800">{title}</p>
      {hint ? <p className="mb-0 text-sm leading-5 text-slate-500">{hint}</p> : null}
    </div>
  )
}
