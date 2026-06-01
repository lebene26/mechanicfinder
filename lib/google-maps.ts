export const GOOGLE_MAPS_LIBRARIES: ("places")[] = ["places"];

export function getGoogleMapsApiKey(): string {
  return process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";
}
