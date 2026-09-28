const PALETTE = ["#6366f1", "#f472b6", "#34d399", "#fbbf24", "#60a5fa", "#f87171", "#a78bfa"];

export function colorForUser(userId: string): string {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) hash = userId.charCodeAt(i) + ((hash << 5) - hash);
  return PALETTE[Math.abs(hash) % PALETTE.length];
}
