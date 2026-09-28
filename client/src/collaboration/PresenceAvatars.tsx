import { PresenceUser } from "../hooks/useCollab";

export default function PresenceAvatars({ peers }: { peers: PresenceUser[] }) {
  return (
    <div className="flex items-center -space-x-2">
      {peers.map((p) => (
        <div
          key={p.userId}
          title={p.name}
          className="h-8 w-8 rounded-full border-2 border-neutral-950 flex items-center justify-center text-xs font-medium text-white"
          style={{ backgroundColor: p.color }}
        >
          {p.name?.[0]?.toUpperCase() ?? "?"}
        </div>
      ))}
    </div>
  );
}
