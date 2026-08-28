import type {
  ApplianceInput,
  LoadResult,
  CalculationSettings,
  BatteryRequirement,
} from "./types";

/**
 * Core solar math for SunVolt. Pure functions only — no React, no database.
 * The recommended load/backup pairing of the flagship package
 * (39W × 12h = 468Wh from a 12V 45Ah battery) implies a single ~0.87
 * derate, so package matching applies the usable battery factor only;
 * system efficiency and reserve are not stacked on top (see packages.ts).
 */

export function calculateTotalLoad(appliances: ApplianceInput[]): LoadResult {
  const lines = appliances
    .filter((a) => a.quantity > 0)
    .map((a) => ({
      name: a.name,
      watt: a.watt,
      quantity: a.quantity,
      totalWatt: a.watt * a.quantity,
    }));
  return {
    totalWatt: lines.reduce((sum, line) => sum + line.totalWatt, 0),
    lines,
  };
}

export function calculateEnergyRequirement(
  totalLoadWatt: number,
  backupHours: number,
): number {
  return Math.round(totalLoadWatt * backupHours);
}

/**
 * Minimum battery needed to supply requiredWh at the given nominal voltage.
 */
export function calculateBatteryRequirement(
  requiredWh: number,
  voltage: number,
  settings: CalculationSettings,
): BatteryRequirement {
  const usableFactor = clamp(settings.batteryEfficiency, 0.1, 1);
  const requiredAh = requiredWh / (voltage * usableFactor);
  return {
    nominalWh: voltage * requiredAh,
    usableWh: requiredWh,
    requiredAh: round1(requiredAh),
  };
}

/**
 * Estimated backup hours a battery provides under a given load.
 */
export function calculateBackupTime(
  totalLoadWatt: number,
  batteryVoltage: number,
  batteryCapacityAh: number,
  settings: CalculationSettings,
): number {
  if (totalLoadWatt <= 0) return 0;
  const usableWh =
    batteryVoltage * batteryCapacityAh * clamp(settings.batteryEfficiency, 0.1, 1);
  return round1(usableWh / totalLoadWatt);
}

/**
 * Rough hours for the solar panel to recharge an empty battery
 * (charge path goes through the controller, hence system efficiency).
 */
export function calculateRechargeHours(
  batteryVoltage: number,
  batteryCapacityAh: number,
  panelWatt: number,
  settings: CalculationSettings,
): number | null {
  if (panelWatt <= 0) return null;
  const nominalWh = batteryVoltage * batteryCapacityAh;
  const effectivePanelWatt = panelWatt * clamp(settings.systemEfficiency, 0.1, 1);
  return round1(nominalWh / effectivePanelWatt);
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function round1(value: number): number {
  return Math.round(value * 10) / 10;
}
