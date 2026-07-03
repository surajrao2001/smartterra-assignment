export function HomeCard({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <div className="bg-surface-muted border border-border rounded-lg p-4">
      <h2 className="text-text font-medium mb-2">{title}</h2>
      {children}
    </div>
  );
}
