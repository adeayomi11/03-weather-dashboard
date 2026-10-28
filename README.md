# SWD Weather Dashboard

A responsive weather dashboard built with plain HTML, CSS, and JavaScript ES modules.

## Features

- Search for a city and choose among matching locations.
- View current conditions and a seven-day forecast.
- Switch between Celsius and Fahrenheit.
- Save and revisit favourite cities.
- Restore the last viewed city on startup.
- Request the device's location with the browser geolocation API.
- Responsive glassmorphism-inspired layout with animated loading skeletons.

## API used

Weather data is provided by [Open-Meteo](https://open-meteo.com/), with no API key:

- Geocoding: `https://geocoding-api.open-meteo.com/v1/search`
- Forecast: `https://api.open-meteo.com/v1/forecast`

The browser's Geolocation API is used only when the user requests their location, or when location permission was already granted and there is no previously viewed city.

## Run locally

Serve this directory from a local web server, then open its `index.html`. For example, with Python installed:

```powershell
python -m http.server 8000
```

Open `http://localhost:8000`. A local server is recommended for JavaScript modules and is required for geolocation in browsers that restrict it to secure contexts.

## Screenshot

> Screenshot placeholder: add an image of the running dashboard here.

## What I learned

- Use `async`/`await` and `try`/`catch` to make API requests and handle failures.
- Convert geocoded city results into coordinates for a forecast request.
- Use `AbortController` to cancel stale requests when a new search starts.
- Use `Intl.DateTimeFormat` for readable local times and forecast weekdays.
- Render API data with DOM elements and `textContent` rather than `innerHTML`.
- Persist small user preferences, favourites, and the last viewed city with `localStorage`.
- Ask for geolocation permission and explain denied or unavailable location access clearly.
