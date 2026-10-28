const elements = {
  cityName: document.querySelector("#current-heading"),
  country: document.querySelector("#location-country"),
  temperature: document.querySelector("#current-temperature"),
  temperatureScale: document.querySelector("#temperature-scale"),
  condition: document.querySelector("#condition-text"),
  conditionIcon: document.querySelector("#condition-icon"),
  wind: document.querySelector("#wind-speed"),
  humidity: document.querySelector("#humidity"),
  localTime: document.querySelector("#local-time"),
  forecast: document.querySelector("#forecast-grid"),
  favorites: document.querySelector("#favorites-list"),
  favoritesCount: document.querySelector("#favorites-count"),
  favoriteToggle: document.querySelector("#favorite-toggle"),
  status: document.querySelector("#status-message"),
  error: document.querySelector("#error-message"),
  cityResults: document.querySelector("#city-results"),
  celsiusButton: document.querySelector("#celsius-button"),
  fahrenheitButton: document.querySelector("#fahrenheit-button"),
};

function displayTemperature(celsius, unit) {
  const temperature = unit === "fahrenheit" ? (celsius * 9) / 5 + 32 : celsius;
  return Math.round(temperature);
}

function formatLocalTime(timeZone) {
  return new Intl.DateTimeFormat("en", {
    hour: "numeric",
    minute: "2-digit",
    timeZone,
  }).format(new Date());
}

export function renderWeather(weather, isFavorite, unit) {
  elements.cityName.textContent = weather.name;
  elements.country.textContent = weather.country;
  elements.temperature.textContent = displayTemperature(weather.temperature, unit);
  elements.temperatureScale.textContent = unit === "fahrenheit" ? "F" : "C";
  elements.condition.textContent = weather.condition;
  elements.conditionIcon.textContent = weather.icon;
  elements.wind.textContent = weather.wind;
  elements.humidity.textContent = weather.humidity;
  elements.localTime.textContent = formatLocalTime(weather.timeZone);
  elements.favoriteToggle.setAttribute("aria-pressed", String(isFavorite));
  elements.favoriteToggle.setAttribute(
    "aria-label",
    `${isFavorite ? "Remove" : "Add"} ${weather.name} ${isFavorite ? "from" : "to"} favourites`,
  );
  elements.favoriteToggle.title = isFavorite ? "Remove from favourites" : "Add to favourites";

  elements.forecast.replaceChildren(
    ...weather.forecast.map((day) => {
      const card = document.createElement("article");
      card.className = "forecast-card";
      const unitLabel = unit === "fahrenheit" ? "F" : "C";
      card.setAttribute(
        "aria-label",
        `${day.day}: ${day.condition}, high ${displayTemperature(day.high, unit)}° ${unitLabel}, low ${displayTemperature(day.low, unit)}° ${unitLabel}`,
      );

      const dayName = document.createElement("span");
      dayName.className = "forecast-day";
      dayName.textContent = day.day;

      const icon = document.createElement("span");
      icon.className = "forecast-icon";
      icon.setAttribute("aria-hidden", "true");
      icon.textContent = day.icon;

      const temperatures = document.createElement("span");
      temperatures.className = "forecast-temperatures";
      const high = document.createElement("span");
      high.className = "forecast-high";
      high.textContent = `${displayTemperature(day.high, unit)}°`;
      const low = document.createElement("span");
      low.className = "forecast-low";
      low.textContent = `${displayTemperature(day.low, unit)}°`;
      temperatures.append(high, low);
      card.append(dayName, icon, temperatures);
      return card;
    }),
  );
}

export function renderFavorites(favorites, activeCityId, onSelect, onRemove, unit) {
  elements.favoritesCount.textContent = String(favorites.length);

  if (!favorites.length) {
    const empty = document.createElement("li");
    empty.className = "favorites-empty";
    empty.textContent = "No saved places yet. Add your first city with the star above.";
    elements.favorites.replaceChildren(empty);
    return;
  }

  elements.favorites.replaceChildren(
    ...favorites.map((city) => {
      const item = document.createElement("li");
      item.className = "favorite-item";

      const selectButton = document.createElement("button");
      selectButton.className = "favorite-city-button";
      selectButton.type = "button";
      selectButton.setAttribute("aria-current", String(city.id === activeCityId));
      selectButton.addEventListener("click", () => onSelect(city));

      const icon = document.createElement("span");
      icon.className = "favorite-city-icon";
      icon.setAttribute("aria-hidden", "true");
      icon.textContent = city.icon;

      const copy = document.createElement("span");
      copy.className = "favorite-city-copy";
      const name = document.createElement("span");
      name.className = "favorite-city-name";
      name.textContent = city.name;
      const condition = document.createElement("span");
      condition.className = "favorite-city-condition";
      condition.textContent = city.condition;
      copy.append(name, condition);

      const temperature = document.createElement("span");
      temperature.className = "favorite-city-temperature";
      temperature.textContent = `${displayTemperature(city.temperature, unit)}°`;
      selectButton.append(icon, copy, temperature);

      const removeButton = document.createElement("button");
      removeButton.className = "remove-favorite";
      removeButton.type = "button";
      removeButton.textContent = "×";
      removeButton.setAttribute("aria-label", `Remove ${city.name} from favourites`);
      removeButton.addEventListener("click", () => onRemove(city.id));

      item.append(selectButton, removeButton);
      return item;
    }),
  );
}

export function renderCityResults(cities, onSelect) {
  elements.cityResults.replaceChildren(
    ...cities.map((city) => {
      const option = document.createElement("button");
      option.className = "city-result-option";
      option.type = "button";
      option.setAttribute("role", "option");
      option.setAttribute("aria-selected", "false");
      option.textContent = [city.name, city.region, city.country].filter(Boolean).join(", ");
      option.addEventListener("click", () => onSelect(city));
      return option;
    }),
  );
  elements.cityResults.hidden = cities.length === 0;
}

export function clearCityResults() {
  elements.cityResults.replaceChildren();
  elements.cityResults.hidden = true;
}

export function setTemperatureUnit(unit) {
  elements.celsiusButton.setAttribute("aria-pressed", String(unit === "celsius"));
  elements.fahrenheitButton.setAttribute("aria-pressed", String(unit === "fahrenheit"));
}

export function setStatus(message = "") {
  elements.status.textContent = message;
}

export function setError(message = "") {
  elements.error.textContent = message;
  elements.error.hidden = !message;
}

export function setSearchLoading(isLoading) {
  const form = document.querySelector("#search-form");
  const submitButton = form.querySelector('button[type="submit"]');
  submitButton.textContent = isLoading ? "Loading…" : "Search";
  form.setAttribute("aria-busy", String(isLoading));
}
