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

const FAVORITES_KEY = "swd-weather-favourites";
const LAST_CITY_KEY = "swd-weather-last-city";
const UNIT_STORAGE_KEY = "swd-weather-temperature-unit";
const searchForm = document.querySelector("#search-form");
const searchInput = document.querySelector("#city-search");
const favoriteToggle = document.querySelector("#favorite-toggle");
const locationButton = document.querySelector("#use-location");
const celsiusButton = document.querySelector("#celsius-button");
const fahrenheitButton = document.querySelector("#fahrenheit-button");
const dateElement = document.querySelector("#today-date");

let currentWeather;
let searchController;
let requestId = 0;
let temperatureUnit = loadTemperatureUnit();
let favorites = loadFavorites();

function isValidSavedCity(city) {
  return (
    city &&
    typeof city.name === "string" &&
    typeof city.country === "string" &&
    Number.isFinite(city.latitude) &&
    Number.isFinite(city.longitude)
  );
}

function loadFavorites() {
  try {
    const saved = window.localStorage.getItem(FAVORITES_KEY);
    const parsed = saved ? JSON.parse(saved) : [];
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed.filter(isValidSavedCity).map(({ name, country, latitude, longitude }) => ({
      name,
      country,
      latitude,
      longitude,
    }));
  } catch (error) {
    console.error("Could not read saved weather favourites.", error);
    return [];
  }
}

function loadLastCity() {
  try {
    const saved = window.localStorage.getItem(LAST_CITY_KEY);
    const city = saved ? JSON.parse(saved) : null;
    return isValidSavedCity(city) ? city : null;
  } catch (error) {
    console.error("Could not read the last viewed city.", error);
    return null;
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
    window.localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
  } catch (error) {
    console.error("Could not save weather favourites.", error);
    setError("Your browser could not save favourites. They will be available until you close this page.");
  }
}

function saveLastCity(city) {
  try {
    const lastCity = {
      name: city.name,
      country: city.country,
      latitude: city.latitude,
      longitude: city.longitude,
    };
    window.localStorage.setItem(LAST_CITY_KEY, JSON.stringify(lastCity));
  } catch (error) {
    console.error("Could not save the last viewed city.", error);
    setError("Your browser could not save the last viewed city.");
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

function startRequest() {
  searchController?.abort();
  searchController = new AbortController();
  requestId += 1;
  clearCityResults();
  setSearchLoading(true);
  setError();
  return { controller: searchController, id: requestId };
}

function isCurrentFavorite() {
  return favorites.some(
    (city) => city.latitude === currentWeather.latitude && city.longitude === currentWeather.longitude,
  );
}

function updateFavorites() {
  renderFavorites(
    favorites,
    currentWeather?.id,
    (city) => {
      const request = startRequest();
      setStatus("Updating weather for your saved city…");
      loadCityForecast(city, request);
    },
    (cityId) => {
      favorites = favorites.filter((city) => `${city.latitude},${city.longitude}` !== cityId);
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

async function loadCityForecast(city, request) {
  try {
    const forecast = await getForecast(city.latitude, city.longitude, {
      signal: request.controller.signal,
    });
    if (request.controller.signal.aborted || request.id !== requestId) {
      return;
    }

    currentWeather = {
      ...forecast,
      id: `${city.latitude},${city.longitude}`,
      name: city.name,
      country: city.country,
      latitude: city.latitude,
      longitude: city.longitude,
    };
    renderWeather(currentWeather, isCurrentFavorite(), temperatureUnit);
    saveLastCity(currentWeather);
    updateFavorites();
    setStatus(`Showing live weather for ${currentWeather.name}.`);
    searchInput.value = "";
    clearCityResults();
  } catch (error) {
    if (!request.controller.signal.aborted && request.id === requestId) {
      handleRequestError(error);
    }
  } finally {
    if (request.id === requestId) {
      setSearchLoading(false);
    }
  }
}

async function showWeather(cityName, { selectFirstMatch = false } = {}) {
  const request = startRequest();
  setStatus("Updating forecast…");

  try {
    const cities = await searchCity(cityName, { signal: request.controller.signal });
    if (request.controller.signal.aborted || request.id !== requestId) {
      return;
    }
    if (!cities.length) {
      setError("We couldn't find that city. Check the spelling or try a nearby city.");
      setStatus();
      return;
    }

    if (cities.length > 1 && !selectFirstMatch) {
      renderCityResults(cities, (city) => {
        setError();
        setStatus("Updating forecast…");
        setSearchLoading(true);
        loadCityForecast(city, request);
      });
      setStatus("Choose a location to see its forecast.");
      return;
    }

    await loadCityForecast(cities[0], request);
  } catch (error) {
    if (!request.controller.signal.aborted && request.id === requestId) {
      handleRequestError(error);
    }
  } finally {
    if (request.id === requestId) {
      setSearchLoading(false);
    }
  }
}

function handleLocationError(error, id) {
  if (id !== requestId) {
    return;
  }

  setSearchLoading(false);
  setStatus();
  if (error.code === (error.PERMISSION_DENIED ?? 1)) {
    setError("Location permission was denied. Allow location access in your browser settings, then try again.");
  } else if (error.code === (error.POSITION_UNAVAILABLE ?? 2)) {
    setError("Your location is unavailable right now. Try searching for a city instead.");
  } else if (error.code === (error.TIMEOUT ?? 3)) {
    setError("Finding your location took too long. Please try again.");
  } else {
    setError("We couldn't get your location. You can still search for a city.");
  }
}

function requestLocation({ automatic = false } = {}) {
  if (!navigator.geolocation) {
    setError("Location is not supported by this browser. Search for a city instead.");
    setStatus();
    return;
  }

  const request = startRequest();
  setStatus(automatic ? "Finding your location…" : "Waiting for your location…");
  navigator.geolocation.getCurrentPosition(
    (position) => {
      if (request.id !== requestId) {
        return;
      }
      setStatus("Updating forecast…");
      loadCityForecast(
        {
          name: "My location",
          country: "Your current location",
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        },
        request,
      );
    },
    (error) => handleLocationError(error, request.id),
    { enableHighAccuracy: false, timeout: 12000, maximumAge: 300000 },
  );
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

async function initialize() {
  setTemperatureUnit(temperatureUnit);
  updateFavorites();

  const lastCity = loadLastCity();
  if (lastCity) {
    const request = startRequest();
    setStatus("Restoring your last city…");
    await loadCityForecast(lastCity, request);
    return;
  }

  if (navigator.geolocation && navigator.permissions?.query) {
    try {
      const permission = await navigator.permissions.query({ name: "geolocation" });
      if (permission.state === "granted" && requestId === 0) {
        requestLocation({ automatic: true });
        return;
      }
    } catch (error) {
      console.error("Could not check location permission.", error);
    }
  }

  if (requestId === 0) {
    showWeather("Calgary", { selectFirstMatch: true });
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
    favorites = favorites.filter(
      (city) => city.latitude !== currentWeather.latitude || city.longitude !== currentWeather.longitude,
    );
  } else {
    favorites = [
      {
        name: currentWeather.name,
        country: currentWeather.country,
        latitude: currentWeather.latitude,
        longitude: currentWeather.longitude,
      },
      ...favorites,
    ];
  }

  saveFavorites();
  renderWeather(currentWeather, isCurrentFavorite(), temperatureUnit);
  updateFavorites();
});

locationButton.addEventListener("click", () => requestLocation());
celsiusButton.addEventListener("click", () => setUnit("celsius"));
fahrenheitButton.addEventListener("click", () => setUnit("fahrenheit"));

dateElement.textContent = new Intl.DateTimeFormat("en", {
  weekday: "long",
  month: "short",
  day: "numeric",
}).format(new Date());

initialize();
