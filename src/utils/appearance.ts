import type { IconType } from "react-icons";
import {
  TbBooks,
  TbBuildingBank,
  TbBulb,
  TbBurger,
  TbCar,
  TbCash,
  TbCreditCard,
  TbCurrencyDollar,
  TbDroplet,
  TbFlame,
  TbHome,
  TbPlane,
  TbShoppingBag,
  TbTag,
  TbWallet,
  TbWifi,
} from "react-icons/tb";

export type EntityKind = "group" | "card";

export type ColorOption = {
  key: string;
  label: string;
  swatch: string; // bolinha do seletor
  soft: string; // fundo + texto do chip
  ring: string; // destaque quando selecionado
};

// Classes completas (sem interpolação) para o Tailwind não descartar no build
export const COLORS: ColorOption[] = [
  { key: "indigo", label: "Índigo", swatch: "bg-indigo-500", soft: "bg-indigo-100 text-indigo-700", ring: "ring-indigo-500" },
  { key: "blue", label: "Azul", swatch: "bg-blue-500", soft: "bg-blue-100 text-blue-700", ring: "ring-blue-500" },
  { key: "sky", label: "Céu", swatch: "bg-sky-500", soft: "bg-sky-100 text-sky-700", ring: "ring-sky-500" },
  { key: "cyan", label: "Ciano", swatch: "bg-cyan-500", soft: "bg-cyan-100 text-cyan-700", ring: "ring-cyan-500" },
  { key: "teal", label: "Turquesa", swatch: "bg-teal-500", soft: "bg-teal-100 text-teal-700", ring: "ring-teal-500" },
  { key: "emerald", label: "Verde", swatch: "bg-emerald-500", soft: "bg-emerald-100 text-emerald-700", ring: "ring-emerald-500" },
  { key: "amber", label: "Âmbar", swatch: "bg-amber-500", soft: "bg-amber-100 text-amber-700", ring: "ring-amber-500" },
  { key: "orange", label: "Laranja", swatch: "bg-orange-500", soft: "bg-orange-100 text-orange-700", ring: "ring-orange-500" },
  { key: "rose", label: "Rosa", swatch: "bg-rose-500", soft: "bg-rose-100 text-rose-700", ring: "ring-rose-500" },
  { key: "fuchsia", label: "Magenta", swatch: "bg-fuchsia-500", soft: "bg-fuchsia-100 text-fuchsia-700", ring: "ring-fuchsia-500" },
  { key: "violet", label: "Violeta", swatch: "bg-violet-500", soft: "bg-violet-100 text-violet-700", ring: "ring-violet-500" },
  { key: "slate", label: "Grafite", swatch: "bg-slate-500", soft: "bg-slate-200 text-slate-700", ring: "ring-slate-500" },
];

const colorByKey = (key: string) => COLORS.find((c) => c.key === key) ?? COLORS[0];

export type GroupOption = { name: string; label: string; Icon: IconType; color: string };

// Grupos fixos. `name` é o que fica gravado em debits.group
export const GROUPS: GroupOption[] = [
  { name: "VEÍCULO", label: "Veículo", Icon: TbCar, color: "blue" },
  { name: "ALIMENTAÇÃO / DELIVERY", label: "Alimentação / Delivery", Icon: TbBurger, color: "rose" },
  { name: "MERCADO", label: "Mercado", Icon: TbShoppingBag, color: "teal" },
  { name: "COMPRAS ONLINE", label: "Compras online", Icon: TbShoppingBag, color: "violet" },
  { name: "VIAGEM", label: "Viagem", Icon: TbPlane, color: "cyan" },
  { name: "EDUCAÇÃO", label: "Educação", Icon: TbBooks, color: "fuchsia" },
  { name: "IMÓVEIS", label: "Imóveis", Icon: TbHome, color: "slate" },
  { name: "ÁGUA", label: "Água", Icon: TbDroplet, color: "sky" },
  { name: "LUZ", label: "Luz", Icon: TbBulb, color: "amber" },
  { name: "GÁS", label: "Gás", Icon: TbFlame, color: "orange" },
  { name: "INTERNET / TECNOLOGIA", label: "Internet / Tecnologia", Icon: TbWifi, color: "indigo" },
  { name: "EMPRESA", label: "Empresa", Icon: TbCurrencyDollar, color: "emerald" },
];

const normalize = (text: string) =>
  text.normalize("NFD").replace(/[̀-ͯ]/g, "").trim().toUpperCase();

// Compara sem acento/caixa, para débitos antigos ("AGUA", "Luz"...) também casarem
export const findGroup = (name: string | null | undefined) =>
  name ? GROUPS.find((g) => normalize(g.name) === normalize(name)) : undefined;

export type IconOption = { key: string; label: string; Icon: IconType };

export const CARD_ICONS: IconOption[] = [
  { key: "credit-card", label: "Cartão", Icon: TbCreditCard },
  { key: "wallet", label: "Carteira", Icon: TbWallet },
  { key: "bank", label: "Banco", Icon: TbBuildingBank },
  { key: "banknotes", label: "Dinheiro", Icon: TbCash },
];

const hash = (text: string) =>
  [...text].reduce((acc, char) => (acc * 31 + char.charCodeAt(0)) >>> 0, 7);

// Sem cor salva (registros antigos), escolhe uma estável a partir do nome
export const resolveColor = (color: string | null | undefined, name: string) =>
  COLORS.find((c) => c.key === color) ?? COLORS[hash(name) % COLORS.length];

export const resolveCardIcon = (icon: string | null | undefined) =>
  CARD_ICONS.find((i) => i.key === icon) ?? CARD_ICONS[0];

// Ícone + cor de um grupo ou cartão. Grupo fora da lista fixa usa uma etiqueta genérica
export const resolveAppearance = (
  kind: EntityKind,
  name: string,
  icon?: string | null,
  color?: string | null
) => {
  if (kind === "group") {
    const group = findGroup(name);
    return group
      ? { Icon: group.Icon, color: colorByKey(group.color), label: group.label }
      : { Icon: TbTag, color: colorByKey("slate"), label: name };
  }
  return { Icon: resolveCardIcon(icon).Icon, color: resolveColor(color, name), label: name };
};

// Primeira cor ainda não usada, para cada cartão novo nascer diferente dos demais
export const nextFreeColor = (used: (string | null | undefined)[]) =>
  (COLORS.find((c) => !used.includes(c.key)) ?? COLORS[0]).key;
