import { BadRequestException } from '@nestjs/common';

export function parsePage(value?: string) {
  return parsePositiveInteger(value, 'page', 1, 1_000_000);
}

export function parsePageSize(value: string | undefined, maxSize = 100, defaultSize = 10) {
  return parsePositiveInteger(value, 'pageSize', defaultSize, maxSize);
}

function parsePositiveInteger(value: string | undefined, name: string, fallback: number, max: number) {
  if (value === undefined) return fallback;
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed < 1 || parsed > max) {
    throw new BadRequestException(`${name} must be an integer between 1 and ${max}`);
  }
  return parsed;
}
