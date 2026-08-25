import type {
  CalculationSettings,
  PackageLike,
  Recommendation,
} from "./types";
import { usableEnergyWh } from "./battery";

/**
 * Package recommendation engine (plan §17, §19).
 *
 * A package is suitable when:
 *   1. it is active, and
 *   2. the customer's total load fits its recommended load, and
 *   3. the required energy fits its usable battery energy.
 *
 * Among suitable packages the SMALLEST one is recommended (plan §17).
 * If nothing fits we return { status: "none" } — never an undersized
 * package (plan §19, UX Rule 4).
 */

export function isPackageSuitable(
  pkg: PackageLike,
  totalLoadWatt: number,
  requiredWh: number,
  settings: CalculationSettings,
): boolean {
  if (!pkg.active) return false;
  if (totalLoadWatt <= 0 || requiredWh <= 0) return false;
  const usableWh = usableEnergyWh(pkg, settings);
  return totalLoadWatt <= pkg.recommendedLoadWatt && requiredWh <= usableWh;
}

export function checkPackageCompatibility(
  pkg: PackageLike,
  totalLoadWatt: number,
  requiredWh: number,
  settings: CalculationSettings,
): { loadOk: boolean; energyOk: boolean } {
  const usableWh = usableEnergyWh(pkg, settings);
  return {
    loadOk: totalLoadWatt <= pkg.recommendedLoadWatt,
    energyOk: requiredWh <= usableWh,
  };
}

export function recommendPackage<T extends PackageLike>(
  packages: T[],
  totalLoadWatt: number,
  requiredWh: number,
  settings: CalculationSettings,
): Recommendation<T> {
  const active = packages.filter((p) => p.active);
  if (active.length === 0) {
    return { status: "none", reason: "no-active-packages" };
  }

  const suitable = active
    .filter((p) => isPackageSuitable(p, totalLoadWatt, requiredWh, settings))
    .sort((a, b) => usableEnergyWh(a, settings) - usableEnergyWh(b, settings));

  if (suitable.length > 0) {
    const best = suitable[0];
    const usableWh = usableEnergyWh(best, settings);
    return {
      status: "match",
      product: best,
      usableWh: Math.round(usableWh),
      headroomWh: Math.round(usableWh - requiredWh),
    };
  }

  // Nothing fits: explain why (used for the no-suitable-package state).
  const anyLoadOk = active.some(
    (p) => totalLoadWatt <= p.recommendedLoadWatt,
  );
  return { status: "none", reason: anyLoadOk ? "energy" : "load" };
}
