import { getWeather } from "./api.js";
import { renderFavorites, renderWeather, setError, setSearchLoading, setStatus } from "./ui.js";

const STORAGE_KEY = "swd-weather-favourites";
const searchForm = document.querySelector("#search-form");
const searchInput = document.querySelector("#city-search");
const favoriteToggle = document.querySelector("#favorite-toggle");
const dateElement = document.querySelector("#today-date");

let currentWeather;
let favorites = loadFavorites();

function loadFavorites() {
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    const parsed = saved ? JSON.parse(saved) : null;
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error("Could not read saved weather favourites.", error);
    return [];
  }
}

function saveFavorites() {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites));
  } catch (error) {
    console.error("Could not save weather favourites.", error);
    setError("Your browser could not save favourites. They will be available until you close this page.");
  }
}

function isCurrentFavorite() {
  return favorites.some((city) => city.id === currentWeather.id);
}

function updateFavorites() {
  renderFavorites(
    favorites,
    currentWeather?.id,
    (city) => {
      currentWeather = city;
      renderWeather(currentWeather, isCurrentFavorite());
      updateFavorites();
      setError();
      setStatus(`Showing sample weather for ${currentWeather.name}.`);
    },
    (cityId) => {
      favorites = favorites.filter((city) => city.id !== cityId);
      saveFavorites();
      updateFavorites();
      if (currentWeather.id === cityId) {
        renderWeather(currentWeather, false);
      }
    },
  );
}

async function showWeather(cityName) {
  setSearchLoading(true);
  setError();
  setStatus("Finding your forecast…");
  try {
    const weather = await getWeather(cityName);
    currentWeather = weather;
    renderWeather(currentWeather, isCurrentFavorite());
    updateFavorites();
    setStatus(`Showing sample weather for ${weather.name}.`);
    searchInput.value = "";
  } catch (error) {
    setError(error instanceof Error ? error.message : "Something went wrong while loading the forecast.");
    setStatus();
  } finally {
    setSearchLoading(false);
  }
}

searchForm.addEventListener("submit", (event) => {
  event.preventDefault();
  showWeather(searchInput.value);
});

favoriteToggle.addEventListener("click", () => {
  if (!currentWeather) {
    return;
  }

  if (isCurrentFavorite()) {
    favorites = favorites.filter((city) => city.id !== currentWeather.id);
  } else {
    favorites = [currentWeather, ...favorites];
  }

  saveFavorites();
  renderWeather(currentWeather, isCurrentFavorite());
  updateFavorites();
});

dateElement.textContent = new Intl.DateTimeFormat("en", {
  weekday: "long",
  month: "short",
  day: "numeric",
}).format(new Date());

renderFavorites(favorites, undefined, () => {}, () => {});
showWeather("Calgary");
