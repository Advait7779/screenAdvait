export interface ExistingDeviceBinding {
  userId: string;
  licenseId: string;
  machineGuid: string;
}

export function deviceBindingMatches(
  existing: ExistingDeviceBinding,
  expected: ExistingDeviceBinding,
) {
  return (
    existing.userId === expected.userId &&
    existing.licenseId === expected.licenseId &&
    existing.machineGuid === expected.machineGuid
  );
}
