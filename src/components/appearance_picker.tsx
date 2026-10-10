import { HiCheck } from "react-icons/hi2";
import { CARD_ICONS, COLORS, resolveColor } from "../utils/appearance";

interface Props {
  icon: string;
  color: string;
  onIconChange: (icon: string) => void;
  onColorChange: (color: string) => void;
}

export default function AppearancePicker({ icon, color, onIconChange, onColorChange }: Props) {
  const selectedColor = resolveColor(color, "");

  return (
    <div className="space-y-4">
      <div>
        <label className="label">Ícone</label>
        <div className="flex flex-wrap gap-2">
          {CARD_ICONS.map(({ key, label, Icon }) => {
            const selected = key === icon;
            return (
              <button
                key={key}
                type="button"
                title={label}
                onClick={() => onIconChange(key)}
                className={`flex h-10 w-10 items-center justify-center rounded-lg border transition-colors ${
                  selected
                    ? `border-transparent ring-2 ${selectedColor.ring} ${selectedColor.soft}`
                    : "border-slate-200 text-slate-500 hover:border-slate-300 hover:bg-slate-50"
                }`}
              >
                <Icon className="h-5 w-5" />
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <label className="label">Cor</label>
        <div className="flex flex-wrap gap-2">
          {COLORS.map((c) => {
            const selected = c.key === color;
            return (
              <button
                key={c.key}
                type="button"
                title={c.label}
                onClick={() => onColorChange(c.key)}
                className={`flex h-7 w-7 items-center justify-center rounded-full text-pure transition ${c.swatch} ${
                  selected ? `ring-2 ring-offset-2 ${c.ring}` : "hover:scale-110"
                }`}
              >
                {selected && <HiCheck className="h-4 w-4" />}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
