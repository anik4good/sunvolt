/**
 * Shared types for the SunVolt solar calculation engine.
 * This module is UI- and database-independent (plan §41).
 */

export interface ApplianceInput {
  /** Appliance id from the database; null for custom devices. */
  id: string | null;
  name: string;
  watt: number;
  quantity: number;
  icon?: string | null;
}

export interface LoadLine {
  name: string;
  watt: number;
  quantity: number;
  totalWatt: number;
}

export interface LoadResult {
  totalWatt: number;
  lines: LoadLine[];
}

/** Admin-configurable calculation parameters (settings table, plan §16). */
export interface CalculationSettings {
  /** Usable fraction of battery capacity, e.g. 0.90 for LiFePO4 depth of discharge. */
  batteryEfficiency: number;
  /** Charge-path efficiency (controller + wiring), used for solar recharge estimates. */
  systemEfficiency: number;
  /** Extra energy margin recommended for custom sizing, e.g. 0.10. */
  recommendedReserve: number;
}

/** Minimal structural shape needed for calculations; DB Product satisfies this. */
export interface PackageLike {
  id: string;
  name: string;
  slug: string;
  batteryVoltage: number;
  batteryCapacityAh: number;
  recommendedLoadWatt: number;
  backupHours: number;
  active: boolean;
}

export interface BatteryRequirement {
  /** Nominal battery energy in Wh (voltage × capacity). */
  nominalWh: number;
  /** Usable energy in Wh after applying the usable battery factor. */
  usableWh: number;
  /** Minimum battery capacity in Ah needed to cover requiredWh. */
  requiredAh: number;
}

export type Recommendation<T extends PackageLike = PackageLike> =
  | {
      status: "match";
      product: T;
      usableWh: number;
      /** How much headroom the package has over the requirement, in Wh. */
      headroomWh: number;
    }
  | {
      status: "none";
      /** Why no package matched — used for the customer-facing message. */
      reason: "load" | "energy" | "no-active-packages";
    };
