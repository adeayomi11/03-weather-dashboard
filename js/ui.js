const elements = {
  cityName: document.querySelector("#current-heading"),
  country: document.querySelector("#location-country"),
  temperature: document.querySelector("#current-temperature"),
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
};

function formatLocalTime(timeZone) {
  return new Intl.DateTimeFormat("en", {
    hour: "numeric",
    minute: "2-digit",
    timeZone,
  }).format(new Date());
}

export function renderWeather(weather, isFavorite) {
  elements.cityName.textContent = weather.name;
  elements.country.textContent = weather.country;
  elements.temperature.textContent = weather.temperature;
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
      card.setAttribute("aria-label", `${day.day}: ${day.condition}, high ${day.high}, low ${day.low}`);

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
      high.textContent = `${day.high}°`;
      const low = document.createElement("span");
      low.className = "forecast-low";
      low.textContent = `${day.low}°`;
      temperatures.append(high, low);
      card.append(dayName, icon, temperatures);
      return card;
    }),
  );
}

export function renderFavorites(favorites, activeCityId, onSelect, onRemove) {
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
      temperature.textContent = `${city.temperature}°`;
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
  const input = form.querySelector("#city-search");
  submitButton.disabled = isLoading;
  input.disabled = isLoading;
  submitButton.textContent = isLoading ? "Loading…" : "Search";
  form.setAttribute("aria-busy", String(isLoading));
}
