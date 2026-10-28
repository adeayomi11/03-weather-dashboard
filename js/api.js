import { weatherCodes } from "./weatherCodes.js";

async function fetchJson(url, signal) {
  let response;
  try {
    response = await fetch(url, { signal });
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw error;
    }
    const reason = error instanceof Error ? ` ${error.message}` : "";
    throw new Error(`Could not reach Open-Meteo.${reason}`);
  }

  if (!response.ok) {
    throw new Error(
      `Open-Meteo request failed (${response.status}${response.statusText ? ` ${response.statusText}` : ""}).`,
    );
  }

  try {
    return await response.json();
  } catch {
    throw new Error("Open-Meteo returned an invalid response.");
  }
}

export async function searchCity(name, { signal } = {}) {
  const query = name.trim();
  if (!query) {
    throw new Error("Enter a city name to search.");
  }

  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=5`;
  const data = await fetchJson(url, signal);

  return (data.results ?? []).map((city) => ({
    name: city.name,
    region: city.admin1 || "",
    country: city.country || "",
    latitude: city.latitude,
    longitude: city.longitude,
    timezone: city.timezone || "UTC",
  }));
}

export async function getForecast(latitude, longitude, { signal } = {}) {
  const params = new URLSearchParams({
    latitude: String(latitude),
    longitude: String(longitude),
    current: "temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m",
    daily: "weather_code,temperature_2m_max,temperature_2m_min",
    timezone: "auto",
  });
  const data = await fetchJson(`https://api.open-meteo.com/v1/forecast?${params}`, signal);
  const currentCode = weatherCodes[data.current.weather_code] ?? {
    label: "Unknown conditions",
    emoji: "🌡️",
  };
  const weekday = new Intl.DateTimeFormat("en", { weekday: "long", timeZone: "UTC" });

  return {
    temperature: data.current.temperature_2m,
    condition: currentCode.label,
    icon: currentCode.emoji,
    wind: Math.round(data.current.wind_speed_10m),
    humidity: Math.round(data.current.relative_humidity_2m),
    timeZone: data.timezone || "UTC",
    forecast: data.daily.time.map((date, index) => {
      const code = weatherCodes[data.daily.weather_code[index]] ?? {
        label: "Unknown conditions",
        emoji: "🌡️",
      };

      return {
        day: weekday.format(new Date(`${date}T12:00:00Z`)),
        icon: code.emoji,
        condition: code.label,
        high: data.daily.temperature_2m_max[index],
        low: data.daily.temperature_2m_min[index],
      };
    }),
  };
}
