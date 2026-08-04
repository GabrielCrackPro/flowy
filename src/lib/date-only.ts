const DATE_ONLY_RE = /^(\d{4})-(\d{2})-(\d{2})/;

function pad(value: number) {
  return String(value).padStart(2, "0");
}

export function formatDateOnlyValue(year: number, month: number, day: number) {
  return `${year}-${pad(month)}-${pad(day)}`;
}

export function serializeDateOnly(
  value: Date | null | undefined,
): string | null | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (value === null) {
    return null;
  }

  return formatDateOnlyValue(
    value.getFullYear(),
    value.getMonth() + 1,
    value.getDate(),
  );
}

export function parseDateOnly(
  value: string | Date | null | undefined,
): Date | null | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (value === null) {
    return null;
  }

  if (value instanceof Date) {
    return new Date(value.getFullYear(), value.getMonth(), value.getDate());
  }

  const match = DATE_ONLY_RE.exec(value);

  if (match) {
    const [, year, month, day] = match;
    return new Date(Number(year), Number(month) - 1, Number(day));
  }

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return undefined;
  }

  return parsed;
}

export function toDateOnlyDatabaseValue(
  value: Date | string | null | undefined,
): Date | null | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (value === null) {
    return null;
  }

  if (typeof value === "string") {
    const match = DATE_ONLY_RE.exec(value);

    if (match) {
      const [, year, month, day] = match;
      return new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));
    }

    const parsed = new Date(value);

    if (Number.isNaN(parsed.getTime())) {
      throw new Error("Fecha inválida");
    }

    return new Date(
      Date.UTC(
        parsed.getUTCFullYear(),
        parsed.getUTCMonth(),
        parsed.getUTCDate(),
      ),
    );
  }

  return new Date(
    Date.UTC(value.getFullYear(), value.getMonth(), value.getDate()),
  );
}
