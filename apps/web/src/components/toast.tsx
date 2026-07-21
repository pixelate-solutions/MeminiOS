import { Check } from "lucide-react";

export function Toast({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <div className="toast" role="status">
      <Check size={14} /> {message}
    </div>
  );
}
