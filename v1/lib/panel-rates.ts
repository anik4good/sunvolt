/** Global per-watt selling rates for solar panels, keyed by system voltage. */
export interface PanelRate {
  volt: number;
  perWatt: number;
}

/** Parse the settings string "12:30,24:28" into sorted rate rows. */
export function parsePanelRates(value: string | null | undefined): PanelRate[] {
  return (value ?? "")
    .split(",")
    .map((part) => {
      const [volt, perWatt] = part.split(":");
      return { volt: Number(volt?.trim()), perWatt: Number(perWatt?.trim()) };
    })
    .filter(
      (r) =>
        Number.isFinite(r.volt) &&
        r.volt > 0 &&
        Number.isFinite(r.perWatt) &&
        r.perWatt > 0,
    )
    .sort((a, b) => a.volt - b.volt);
}

/** Serialize rate rows back to the settings string. */
export function formatPanelRates(rates: PanelRate[]): string {
  return rates.map((r) => `${r.volt}:${r.perWatt}`).join(",");
}
