// Opacity pattern for the decorative tile grid behind the main panel.
const TILE_ALPHA = [0.95, 0.4, 0.3, 0.55, 0.9, 0.75, 0.8, 0.62, 0.75, 0.4, 0.75, 0.4, 0.75, 0.4, 0.75, 0.4, 0.3, 0.4, 0.95, 0.62, 0.8, 0.75, 0.9, 0.55]

export function TileGrid() {
  return (
    <div className="ap-tiles" aria-hidden="true">
      {Array.from({ length: 80 }, (_, i) => <i key={i} style={{ background: `rgba(255,255,255,${TILE_ALPHA[i % TILE_ALPHA.length]})` }} />)}
    </div>
  )
}
