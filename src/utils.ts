export function normalizePairs(input: string | string[] | undefined | null): string[] {
  if (Array.isArray(input)) {
    return input
      .flatMap((value) => String(value).split(","))
      .map(normalizePair)
      .filter(Boolean);
  }

  return String(input ?? "")
    .split(",")
    .map(normalizePair)
    .filter(Boolean);
}

function normalizePair(pair: string): string {
  return pair.trim().toUpperCase();
}

export function calculatePercentageChange(previousRate: number, currentRate: number): number {
  validatePositiveRate(previousRate, "previousRate");
  validatePositiveRate(currentRate, "currentRate");

  return ((currentRate - previousRate) / previousRate) * 100;
}

export interface ShouldTriggerAlertInput {
  previousRate: number;
  currentRate: number;
  thresholdPercentage: number;
}

export function shouldTriggerAlert({
  previousRate,
  currentRate,
  thresholdPercentage,
}: ShouldTriggerAlertInput): boolean {
  validatePositiveRate(previousRate, "previousRate");
  validatePositiveRate(currentRate, "currentRate");

  if (!Number.isFinite(thresholdPercentage) || thresholdPercentage <= 0) {
    throw new Error("thresholdPercentage must be a positive number.");
  }

  const percentageChange = calculatePercentageChange(previousRate, currentRate);

  return Math.abs(percentageChange) >= thresholdPercentage;
}

function validatePositiveRate(value: number, name: string): void {
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`${name} must be a positive number.`);
  }
}
