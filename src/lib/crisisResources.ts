export type CrisisResource = {
  country: string;
  label: string;
  display: string;
  tel: string;
  description: string;
};

export const CRISIS_RESOURCES: Record<string, CrisisResource> = {
  Germany: {
    country: "Germany",
    label: "Telefonseelsorge",
    display: "0800 111 0 111",
    tel: "tel:08001110111",
    description: "Free, confidential, available 24/7.",
  },
  "United States": {
    country: "United States",
    label: "988 Suicide & Crisis Lifeline",
    display: "Call or text 988",
    tel: "tel:988",
    description: "Free, confidential, available 24/7.",
  },
  "United Kingdom": {
    country: "United Kingdom",
    label: "Samaritans",
    display: "116 123",
    tel: "tel:116123",
    description: "Free, confidential, available 24/7.",
  },
  Australia: {
    country: "Australia",
    label: "Lifeline",
    display: "13 11 14",
    tel: "tel:131114",
    description: "Confidential, available 24/7.",
  },
  Canada: {
    country: "Canada",
    label: "Crisis Services Canada",
    display: "1-833-456-4566",
    tel: "tel:18334564566",
    description: "Free, confidential, available 24/7.",
  },
};

export const INTERNATIONAL_FALLBACK = {
  label: "findahelpline.com",
  url: "https://findahelpline.com",
  description: "A directory of crisis lines around the world.",
};

export function crisisResourceForCountry(country: string | null | undefined): CrisisResource | null {
  if (!country) return null;
  return CRISIS_RESOURCES[country] ?? null;
}
