/** The 5-square stair glyph the design puts on primary buttons and "Open" links. */
export default function ArrowGlyph({ size = 13 }: { size?: number }) {
  return (
    <svg
      width={(size * 7.794) / 13}
      height={size}
      viewBox="0 0 7.794 13"
      fill="currentColor"
      aria-hidden
      focusable="false"
      style={{ flexShrink: 0 }}
    >
      <path
        fillRule="nonzero"
        d="M 7.794 5.198 L 5.198 5.198 L 5.198 7.802 L 7.794 7.802 L 7.794 5.198 Z M 5.195 2.603 L 2.599 2.603 L 2.599 5.205 L 5.195 5.205 L 5.195 2.603 Z M 2.596 0 L 0 0 L 0 2.603 L 2.596 2.603 L 2.596 0 Z M 5.195 7.802 L 2.599 7.802 L 2.599 10.404 L 5.195 10.404 L 5.195 7.802 Z M 2.596 10.397 L 0 10.397 L 0 13 L 2.596 13 L 2.596 10.397 Z"
      />
    </svg>
  );
}
