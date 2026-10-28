const forecastIcons = ["☀️", "🌤️", "🌦️", "⛅", "☀️", "🌥️", "🌦️"];
const forecastConditions = [
  "Sunny",
  "Partly cloudy",
  "Light rain",
  "Cloudy",
  "Sunny",
  "Mostly cloudy",
  "Showers",
];

const cityData = [
  {
    name: "Calgary",
    country: "Alberta, Canada",
    aliases: ["calgary"],
    temperature: 18,
    feelsLike: 16,
    condition: "Mostly sunny",
    icon: "☀️",
    wind: 12,
    humidity: 42,
    timeZone: "America/Edmonton",
    forecast: [18, 19, 16, 15, 20, 17, 14],
  },
  {
    name: "London",
    country: "England, United Kingdom",
    aliases: ["london"],
    temperature: 14,
    feelsLike: 12,
    condition: "Light rain",
    icon: "🌦️",
    wind: 18,
    humidity: 76,
    timeZone: "Europe/London",
    forecast: [14, 15, 13, 16, 17, 15, 14],
  },
  {
    name: "Tokyo",
    country: "Tokyo, Japan",
    aliases: ["tokyo"],
    temperature: 23,
    feelsLike: 24,
    condition: "Partly cloudy",
    icon: "🌤️",
    wind: 9,
    humidity: 58,
    timeZone: "Asia/Tokyo",
    forecast: [23, 24, 22, 25, 26, 24, 23],
  },
  {
    name: "New York",
    country: "New York, United States",
    aliases: ["new york", "nyc", "new york city"],
    temperature: 21,
    feelsLike: 20,
    condition: "Clear skies",
    icon: "☀️",
    wind: 14,
    humidity: 48,
    timeZone: "America/New_York",
    forecast: [21, 22, 20, 19, 23, 22, 20],
  },
  {
    name: "Paris",
    country: "Île-de-France, France",
    aliases: ["paris"],
    temperature: 17,
    feelsLike: 16,
    condition: "Partly cloudy",
    icon: "⛅",
    wind: 11,
    humidity: 54,
    timeZone: "Europe/Paris",
    forecast: [17, 18, 16, 19, 20, 18, 17],
  },
  {
    name: "Sydney",
    country: "New South Wales, Australia",
    aliases: ["sydney"],
    temperature: 22,
    feelsLike: 21,
    condition: "Sunny",
    icon: "☀️",
    wind: 16,
    humidity: 51,
    timeZone: "Australia/Sydney",
    forecast: [22, 23, 21, 24, 25, 23, 22],
  },
  {
    name: "Toronto",
    country: "Ontario, Canada",
    aliases: ["toronto"],
    temperature: 19,
    feelsLike: 18,
    condition: "Mostly cloudy",
    icon: "🌥️",
    wind: 13,
    humidity: 61,
    timeZone: "America/Toronto",
    forecast: [19, 20, 18, 21, 22, 20, 19],
  },
];

function getForecast(temperatures) {
  const today = new Date();
  const weekday = new Intl.DateTimeFormat("en", { weekday: "short" });

  return temperatures.map((high, index) => {
    const date = new Date(today);
    date.setDate(today.getDate() + index);

    return {
      day: index === 0 ? "Today" : weekday.format(date),
      icon: forecastIcons[index],
      condition: forecastConditions[index],
      high,
      low: high - (index % 2 === 0 ? 6 : 5),
    };
  });
}

export async function getWeather(cityName) {
  const query = cityName.trim();
  if (!query) {
    throw new Error("Enter a city name to search.");
  }

  const normalizedQuery = query.toLocaleLowerCase();
  const match = cityData.find(
    (city) =>
      city.aliases.includes(normalizedQuery) ||
      city.name.toLocaleLowerCase() === normalizedQuery,
  );

  if (match) {
    return {
      ...match,
      id: match.name.toLocaleLowerCase(),
      forecast: getForecast(match.forecast),
    };
  }

  return {
    id: query.toLocaleLowerCase(),
    name: query.replace(/\b\w/g, (letter) => letter.toLocaleUpperCase()),
    country: "Sample location",
    temperature: 18,
    feelsLike: 16,
    condition: "Partly cloudy",
    icon: "🌤️",
    wind: 12,
    humidity: 48,
    timeZone: "UTC",
    forecast: getForecast([18, 19, 16, 15, 20, 17, 14]),
  };
}
