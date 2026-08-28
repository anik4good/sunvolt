import { Fan, Lightbulb, Tv, Wifi, Plug } from "lucide-react";

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  fan: Fan,
  bulb: Lightbulb,
  light: Lightbulb,
  tv: Tv,
  router: Wifi,
  wifi: Wifi,
  plug: Plug,
};

/**
 * Renders an appliance icon. The appliances.icon column accepts either an
 * icon keyword ("fan", "bulb", "tv", "router", "plug") rendered as a Lucide
 * icon, or any other text (e.g. an emoji) rendered as-is.
 */
export function ApplianceIcon({
  icon,
  className,
}: {
  icon?: string | null;
  className?: string;
}) {
  const IconComponent = icon ? ICON_MAP[icon.toLowerCase()] : undefined;
  if (IconComponent) {
    return <IconComponent className={className} />;
  }
  return <span className={className} aria-hidden>{icon ?? "🔌"}</span>;
}
