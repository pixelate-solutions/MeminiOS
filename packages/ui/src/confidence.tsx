export function ConfidenceTick({ value, label = true }: { value: number; label?: boolean }) {
  const percentage = Math.round(value * 100);

  return (
    <span
      className="confidence"
      title={`${percentage}% confidence`}
      aria-label={`${percentage}% confidence`}
    >
      <span className="confidence-bars" aria-hidden="true">
        {[0.25, 0.5, 0.75, 0.9].map((threshold, index) => (
          <span
            key={threshold}
            className={value >= threshold ? "is-filled" : ""}
            style={{ height: 4 + index * 2 }}
          />
        ))}
      </span>
      {label && <span>{percentage}%</span>}
    </span>
  );
}
