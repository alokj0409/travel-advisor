export async function fetchWeather(center, signal) {
  const params = new URLSearchParams({
    lat: String(center.lat),
    lng: String(center.lng),
  });
  const response = await fetch(`/api/weather?${params}`, {
    signal,
    headers: { Accept: 'application/json' },
  });

  if (!response.ok) throw new Error(`Weather request failed with ${response.status}`);
  const payload = await response.json();
  return payload.weather ?? null;
}
