import { getForecast, searchCity } from "./api.js";
import {
  clearCityResults,
  renderCityResults,
  renderFavorites,
  renderWeather,
  setError,
  setSearchLoading,
  setStatus,
  setTemperatureUnit,
} from "./ui.js";

const STORAGE_KEY = "swd-weather-favourites";
const UNIT_STORAGE_KEY = "swd-weather-temperature-unit";
const searchForm = document.querySelector("#search-form");
const searchInput = document.querySelector("#city-search");
const favoriteToggle = document.querySelector("#favorite-toggle");
const celsiusButton = document.querySelector("#celsius-button");
const fahrenheitButton = document.querySelector("#fahrenheit-button");
const dateElement = document.querySelector("#today-date");

let currentWeather;
let searchController;
let temperatureUnit = loadTemperatureUnit();
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

function loadTemperatureUnit() {
  try {
    return window.localStorage.getItem(UNIT_STORAGE_KEY) === "fahrenheit" ? "fahrenheit" : "celsius";
  } catch (error) {
    console.error("Could not read the saved temperature unit.", error);
    return "celsius";
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

function saveTemperatureUnit() {
  try {
    window.localStorage.setItem(UNIT_STORAGE_KEY, temperatureUnit);
  } catch (error) {
    console.error("Could not save the temperature unit.", error);
    setError("Your browser could not save the temperature preference.");
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
      searchController?.abort();
      clearCityResults();
      setSearchLoading(false);
      currentWeather = city;
      renderWeather(currentWeather, isCurrentFavorite(), temperatureUnit);
      updateFavorites();
      setError();
      setStatus(`Showing live weather for ${currentWeather.name}.`);
    },
    (cityId) => {
      favorites = favorites.filter((city) => city.id !== cityId);
      saveFavorites();
      updateFavorites();
      if (currentWeather?.id === cityId) {
        renderWeather(currentWeather, false, temperatureUnit);
      }
    },
    temperatureUnit,
  );
}

function handleRequestError(error) {
  if (error instanceof Error && error.name === "AbortError") {
    return;
  }
  setError(error instanceof Error ? error.message : "Something went wrong while loading the forecast.");
  setStatus();
}

async function loadCityForecast(city, controller) {
  try {
    const forecast = await getForecast(city.latitude, city.longitude, {
      signal: controller.signal,
    });
    if (controller.signal.aborted) {
      return;
    }

    currentWeather = {
      ...forecast,
      id: `${city.latitude},${city.longitude}`,
      name: city.name,
      country: [city.region, city.country].filter(Boolean).join(", "),
      latitude: city.latitude,
      longitude: city.longitude,
      region: city.region,
    };
    renderWeather(currentWeather, isCurrentFavorite(), temperatureUnit);
    updateFavorites();
    setStatus(`Showing live weather for ${currentWeather.name}.`);
    searchInput.value = "";
    clearCityResults();
  } catch (error) {
    if (!controller.signal.aborted) {
      handleRequestError(error);
    }
  } finally {
    if (searchController === controller) {
      setSearchLoading(false);
    }
  }
}

async function showWeather(cityName, { selectFirstMatch = false } = {}) {
  searchController?.abort();
  const controller = new AbortController();
  searchController = controller;
  clearCityResults();
  setSearchLoading(true);
  setError();
  setStatus("Loading…");

  try {
    const cities = await searchCity(cityName, { signal: controller.signal });
    if (controller.signal.aborted) {
      return;
    }
    if (!cities.length) {
      setError("We couldn't find that city. Check the spelling or try a nearby city.");
      setStatus();
      return;
    }

    if (cities.length > 1 && !selectFirstMatch) {
      renderCityResults(cities, (city) => {
        clearCityResults();
        setError();
        setStatus("Loading…");
        setSearchLoading(true);
        loadCityForecast(city, controller);
      });
      setStatus("Choose a location to see its forecast.");
      return;
    }

    await loadCityForecast(cities[0], controller);
  } catch (error) {
    if (!controller.signal.aborted) {
      handleRequestError(error);
    }
  } finally {
    if (searchController === controller) {
      setSearchLoading(false);
    }
  }
}

function setUnit(unit) {
  if (temperatureUnit === unit) {
    return;
  }
  temperatureUnit = unit;
  setTemperatureUnit(temperatureUnit);
  saveTemperatureUnit();
  if (currentWeather) {
    renderWeather(currentWeather, isCurrentFavorite(), temperatureUnit);
  }
  updateFavorites();
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
  renderWeather(currentWeather, isCurrentFavorite(), temperatureUnit);
  updateFavorites();
});

celsiusButton.addEventListener("click", () => setUnit("celsius"));
fahrenheitButton.addEventListener("click", () => setUnit("fahrenheit"));

dateElement.textContent = new Intl.DateTimeFormat("en", {
  weekday: "long",
  month: "short",
  day: "numeric",
}).format(new Date());

setTemperatureUnit(temperatureUnit);
updateFavorites();
showWeather("Calgary", { selectFirstMatch: true });
