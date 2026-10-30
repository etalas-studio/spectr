export function BrandMark({ size = 'md' }: { size?: 'md' | 'lg' }) {
  return (
    <span className={`ap-mark${size === 'lg' ? ' ap-mark--lg' : ''}`} aria-hidden="true">
      <span className="ap-logo" />
    </span>
  )
}
