import type { CalculationSettings } from "./types";
import { clamp } from "./calculator";

/**
 * Custom system sizing (plan §42). Given a customer's load and backup
 * hours, produce the component spec SunVolt would quote:
 *
 *   Battery:    Ah = requiredWh ÷ systemVoltage, rounded UP to the next
 *               standard size from settings.batterySizes.
 *   Panel:      nameplate W = requiredWh ÷ (peakSunHours × panelOutputFactor)
 *               — panels deliver ~70% of nameplate in real conditions —
 *               rounded UP to the next 50W step.
 *   Controller: first standard rating ≥ panel nameplate
 *               (400W panel → 400W controller, 200W → 300W).
 */

export interface SystemSpec {
  requiredWh: number;
  /** Exact Ah needed before rounding. */
  requiredAh: number;
  /** Snapped standard battery size (or rounded-up Ah beyond the list). */
  batteryAh: number;
  /** Snapped panel nameplate wattage (50W steps). */
  panelWatt: number;
  /** Standard controller rating ≥ panel wattage. */
  controllerWatt: number;
}

function parseSizes(csv: string): number[] {
  return csv
    .split(",")
    .map((v) => Number(v.trim()))
    .filter((n) => Number.isFinite(n) && n > 0)
    .sort((a, b) => a - b);
}

function snapUpToList(value: number, sizes: number[]): number {
  for (const size of sizes) {
    if (value <= size) return size;
  }
  // Beyond the largest listed size — round up to a sane custom step.
  return Math.ceil(value / 10) * 10;
}

export function sizeSystem(
  totalLoadWatt: number,
  backupHours: number,
  settings: CalculationSettings,
): SystemSpec {
  const requiredWh = Math.round(totalLoadWatt * backupHours);
  const voltage = settings.systemVoltage > 0 ? settings.systemVoltage : 12.6;
  const requiredAh = requiredWh / voltage;

  const batterySizes = parseSizes(settings.batterySizes ?? "");
  const batteryAh =
    batterySizes.length > 0
      ? snapUpToList(requiredAh, batterySizes)
      : Math.ceil(requiredAh / 5) * 5;

  const panelFactor = clamp(settings.panelOutputFactor, 0.1, 1);
  const sunHours = clamp(settings.peakSunHours, 1, 12);
  const exactPanelWatt = requiredWh / (sunHours * panelFactor);
  const panelWatt = Math.max(50, Math.ceil(exactPanelWatt / 50) * 50);

  const controllerSizes = parseSizes(settings.controllerSizes ?? "");
  const controllerWatt =
    controllerSizes.length > 0
      ? snapUpToList(panelWatt, controllerSizes)
      : panelWatt;

  return {
    requiredWh,
    requiredAh: Math.round(requiredAh * 10) / 10,
    batteryAh,
    panelWatt,
    controllerWatt,
  };
}
