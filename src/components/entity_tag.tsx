import { type EntityKind, resolveAppearance } from "../utils/appearance";

interface Props {
  kind: EntityKind;
  name: string;
  icon?: string | null; // só cartões; grupos têm ícone fixo
  color?: string | null; // só cartões; grupos têm cor fixa
  size?: "sm" | "lg";
  iconOnly?: boolean;
  title?: string;
  onClick?: () => void;
}

const sizes = {
  sm: { chip: "gap-1.5 px-2 py-1 text-xs", icon: "h-4 w-4", square: "h-8 w-8" },
  lg: { chip: "gap-2 px-3 py-2 text-sm", icon: "h-5 w-5", square: "h-10 w-10" },
};

export default function EntityTag({ kind, name, icon, color, size = "sm", iconOnly, title, onClick }: Props) {
  const { Icon, color: tone, label } = resolveAppearance(kind, name, icon, color);
  const s = sizes[size];

  const className = iconOnly
    ? `inline-flex shrink-0 items-center justify-center rounded-lg ${s.square} ${tone.soft}`
    : `inline-flex max-w-full items-center rounded-md font-medium ${s.chip} ${tone.soft}`;
  const content = (
    <>
      <Icon className={`${s.icon} shrink-0`} />
      {!iconOnly && <span className="truncate">{label}</span>}
    </>
  );

  if (onClick) {
    return (
      <button
        type="button"
        title={title ?? label}
        onClick={onClick}
        className={`${className} transition hover:brightness-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500`}
      >
        {content}
      </button>
    );
  }

  return (
    <span title={title ?? label} className={className}>
      {content}
    </span>
  );
}
