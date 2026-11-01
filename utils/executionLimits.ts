export function positiveFiniteEnv(
    name: string,
    defaultValue: number,
    multiplier = 1,
    requireIntegerScaledValue = false,
): number {
    const rawValue = process.env[name];
    if (rawValue === undefined) {
        return defaultValue * multiplier;
    }

    const value = Number(rawValue);
    const scaledValue = value * multiplier;
    if (
        !Number.isFinite(value) ||
        value <= 0 ||
        !Number.isFinite(scaledValue) ||
        scaledValue <= 0 ||
        (requireIntegerScaledValue && !Number.isSafeInteger(scaledValue))
    ) {
        throw new Error(`${name} must be a positive finite number`);
    }
    return scaledValue;
}

export function positiveIntegerEnv(name: string, defaultValue: number): number {
    const rawValue = process.env[name];
    if (rawValue === undefined) {
        return defaultValue;
    }

    const value = Number(rawValue);
    if (!Number.isSafeInteger(value) || value <= 0) {
        throw new Error(`${name} must be a positive finite integer`);
    }
    return value;
}

