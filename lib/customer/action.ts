import { isNotFound, isRedirect } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";

import type { CustomerAddressInput } from "@/lib/customer/types";
import { type CustomerUserError } from "@/lib/shopify/operations/customer/types";

import type { AccountActionResult } from "./types";

const MAX_FIELD_LENGTH = 255;
const MAX_NAME_LENGTH = 100;

const ADDRESS_FIELDS = [
  "address1",
  "address2",
  "city",
  "company",
  "countryCode",
  "firstName",
  "lastName",
  "phoneNumber",
  "zip",
  "zoneCode",
] as const satisfies readonly (keyof CustomerAddressInput)[];

const UPPERCASE_FIELDS = new Set<keyof CustomerAddressInput>(["countryCode", "zoneCode"]);

function mapUserErrors(errors: CustomerUserError[]): AccountActionResult {
  if (errors.length === 0) return { success: true };

  const fieldErrors: Record<string, string> = {};
  for (const error of errors) {
    const key = error.field?.at(-1);
    if (key && !fieldErrors[key]) fieldErrors[key] = error.message;
  }

  return {
    success: false,
    error: errors[0].message,
    fieldErrors: Object.keys(fieldErrors).length > 0 ? fieldErrors : undefined,
  };
}

function buildAddressInput(raw: CustomerAddressInput): CustomerAddressInput {
  const input: CustomerAddressInput = {};

  for (const field of ADDRESS_FIELDS) {
    const value = raw[field]?.trim().slice(0, MAX_FIELD_LENGTH);
    if (!value) continue;
    input[field] = UPPERCASE_FIELDS.has(field) ? value.toUpperCase() : value;
  }

  return input;
}

function validateAddress(input: CustomerAddressInput): string | null {
  if (!input.address1) return "Address is required";
  if (!input.city) return "City is required";
  if (!input.countryCode) return "Country is required";
  return null;
}

async function runCustomerMutation(
  mutate: () => Promise<CustomerUserError[]>,
  failureMessage: string,
): Promise<AccountActionResult> {
  try {
    return mapUserErrors(await mutate());
  } catch (error) {
    if (isRedirect(error) || isNotFound(error)) throw error;
    console.error(`${failureMessage}:`, error);
    return { success: false, error: failureMessage };
  }
}

export const createAddressAction = createServerFn({ method: "POST" })
  .validator((data: { isDefault: boolean; raw: CustomerAddressInput }) => data)
  .handler(async ({ data }): Promise<AccountActionResult> => {
    const input = buildAddressInput(data.raw);
    const validationError = validateAddress(input);
    if (validationError) return { success: false, error: validationError };
    const { createCustomerAddress } = await import("@/lib/shopify/operations/customer/server");
    return runCustomerMutation(
      () => createCustomerAddress(input, data.isDefault),
      "Failed to create address",
    );
  });

export const updateAddressAction = createServerFn({ method: "POST" })
  .validator((data: { addressId: string; isDefault: boolean; raw: CustomerAddressInput }) => data)
  .handler(async ({ data }): Promise<AccountActionResult> => {
    if (!data.addressId) return { success: false, error: "Invalid address ID" };
    const input = buildAddressInput(data.raw);
    const validationError = validateAddress(input);
    if (validationError) return { success: false, error: validationError };
    const { updateCustomerAddress } = await import("@/lib/shopify/operations/customer/server");
    return runCustomerMutation(
      () => updateCustomerAddress(data.addressId, input, data.isDefault),
      "Failed to update address",
    );
  });

export const deleteAddressAction = createServerFn({ method: "POST" })
  .validator((data: { addressId: string }) => data)
  .handler(async ({ data }): Promise<AccountActionResult> => {
    if (!data.addressId) return { success: false, error: "Invalid address ID" };
    const { deleteCustomerAddress } = await import("@/lib/shopify/operations/customer/server");
    return runCustomerMutation(
      () => deleteCustomerAddress(data.addressId),
      "Failed to delete address",
    );
  });

export const updateProfileAction = createServerFn({ method: "POST" })
  .validator((data: { firstName: string; lastName: string }) => data)
  .handler(async ({ data }): Promise<AccountActionResult> => {
    const input = {
      firstName: data.firstName.trim().slice(0, MAX_NAME_LENGTH),
      lastName: data.lastName.trim().slice(0, MAX_NAME_LENGTH),
    };
    const { updateCustomerProfile } = await import("@/lib/shopify/operations/customer/server");
    return runCustomerMutation(() => updateCustomerProfile(input), "Failed to update profile");
  });
