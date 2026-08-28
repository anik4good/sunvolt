import type { CalculationSettings, PackageLike } from "./types";
import { clamp } from "./calculator";

/**
 * Package-level battery helpers (plan §41 battery.ts).
 */

/** Nominal energy of a package battery in Wh. */
export function nominalEnergyWh(pkg: PackageLike): number {
  return pkg.batteryVoltage * pkg.batteryCapacityAh;
}

/**
 * Energy a package can actually deliver to appliances, applying the
 * usable battery factor only. The flagship reference design
 * (12V 45Ah → 39W for ~12h) is calibrated against this single derate;
 * stacking more factors here would reject SunVolt's own package for
 * its own rated load.
 */
export function usableEnergyWh(pkg: PackageLike, settings: CalculationSettings): number {
  return nominalEnergyWh(pkg) * clamp(settings.batteryEfficiency, 0.1, 1);
}

/** Battery capacity in Ah needed to cover requiredWh at the package voltage. */
export function requiredAhFor(
  requiredWh: number,
  pkg: PackageLike,
  settings: CalculationSettings,
): number {
  return requiredWh / (pkg.batteryVoltage * clamp(settings.batteryEfficiency, 0.1, 1));
}
