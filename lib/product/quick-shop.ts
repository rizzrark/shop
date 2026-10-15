import type { SelectedOption } from "@/lib/product/types";

interface QuickShopOption {
  name: string;
  values: Array<{ name: string }>;
}

export function canonicalQuickShopOptions(
  options: readonly QuickShopOption[],
  selectedOptions: SelectedOption[],
): SelectedOption[] | null {
  if (
    !Array.isArray(selectedOptions) ||
    selectedOptions.length !== options.length ||
    selectedOptions.some(
      (option) => typeof option?.name !== "string" || typeof option?.value !== "string",
    )
  ) {
    return null;
  }

  const canonicalOptions: SelectedOption[] = [];
  for (const option of options) {
    const exactNames = selectedOptions.filter(({ name }) => name === option.name);
    const selected = exactNames.length
      ? exactNames
      : selectedOptions.filter(({ name }) => name.toLowerCase() === option.name.toLowerCase());
    if (selected.length !== 1) return null;
    const matchedValue =
      option.values.find((value) => value.name === selected[0].value) ??
      option.values.find((value) => value.name.toLowerCase() === selected[0].value.toLowerCase());
    if (!matchedValue) return null;
    canonicalOptions.push({ name: option.name, value: matchedValue.name });
  }

  return canonicalOptions;
}
