// Weather API Configuration - Open-Meteo (Free, No API Key Required)
const TBILISI_LAT = 41.7151; // Tbilisi latitude
const TBILISI_LON = 44.8271; // Tbilisi longitude
const WEATHER_API_URL = "https://api.open-meteo.com/v1/forecast";

// Weather codes mapping for Open-Meteo
const weatherCodes = {
  0: { description: "clear sky", icon: "01d", georgian: "მზიანი" },
  1: { description: "mainly clear", icon: "01d", georgian: "ძირითადად მზიანი" },
  2: {
    description: "partly cloudy",
    icon: "02d",
    georgian: "ნაწილობრივ ღრუბლიანი",
  },
  3: { description: "overcast", icon: "03d", georgian: "ღრუბლიანი" },
  45: { description: "fog", icon: "50d", georgian: "ნისლიანი" },
  48: {
    description: "depositing rime fog",
    icon: "50d",
    georgian: "ყინულოვანი ნისლი",
  },
  51: { description: "light drizzle", icon: "09d", georgian: "სუსტი ღრიალი" },
  53: {
    description: "moderate drizzle",
    icon: "09d",
    georgian: "ზომიერი ღრიალი",
  },
  55: { description: "dense drizzle", icon: "09d", georgian: "ძლიერი ღრიალი" },
  61: { description: "slight rain", icon: "10d", georgian: "სუსტი წვიმა" },
  63: { description: "moderate rain", icon: "10d", georgian: "ზომიერი წვიმა" },
  65: { description: "heavy rain", icon: "10d", georgian: "ძლიერი წვიმა" },
  71: { description: "slight snow fall", icon: "13d", georgian: "სუსტი თოვლი" },
  73: {
    description: "moderate snow fall",
    icon: "13d",
    georgian: "ზომიერი თოვლი",
  },
  75: { description: "heavy snow fall", icon: "13d", georgian: "ძლიერი თოვლი" },
  95: { description: "thunderstorm", icon: "11d", georgian: "ქარიშხალი" },
  96: {
    description: "thunderstorm with hail",
    icon: "11d",
    georgian: "ქარიშხალი სეტყვით",
  },
  99: {
    description: "heavy thunderstorm with hail",
    icon: "11d",
    georgian: "ძლიერი ქარიშხალი სეტყვით",
  },
};

// Weather Icons Mapping for Font Awesome
const weatherIcons = {
  "01d": "fas fa-sun sunny", 
  "01n": "fas fa-moon", 
  "02d": "fas fa-cloud-sun cloudy", 
  "02n": "fas fa-cloud-moon cloudy", 
  "03d": "fas fa-cloud cloudy", 
  "03n": "fas fa-cloud cloudy", 
  "04d": "fas fa-clouds cloudy", 
  "04n": "fas fa-clouds cloudy", 
  "09d": "fas fa-cloud-rain rainy", 
  "09n": "fas fa-cloud-rain rainy", 
  "10d": "fas fa-cloud-sun-rain rainy", 
  "10n": "fas fa-cloud-moon-rain rainy", 
  "11d": "fas fa-bolt stormy", 
  "11n": "fas fa-bolt stormy", 
  "13d": "fas fa-snowflake snowy", 
  "13n": "fas fa-snowflake snowy", 
  "50d": "fas fa-smog", 
  "50n": "fas fa-smog", 
};

// Main weather fetch function
async function fetchWeather() {
  const weatherContent = document.getElementById("weatherContent");

  if (!weatherContent) {
    console.error("Weather content element not found");
    return;
  }

  try {
    // Show loading state
    weatherContent.innerHTML = `
      <div class="weather-loading">
        <i class="fas fa-spinner fa-spin"></i> იტვირთება...
      </div>
    `;

    // Fetch real weather data from API
    const url = `${WEATHER_API_URL}?latitude=${TBILISI_LAT}&longitude=${TBILISI_LON}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m,surface_pressure&timezone=Asia/Tbilisi`;

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    // Transform data to our format
    const transformedData = {
      name: "თბილისი",
      main: {
        temp: Math.round(data.current.temperature_2m),
        feels_like: Math.round(data.current.temperature_2m + 2),
        humidity: data.current.relative_humidity_2m,
        pressure: Math.round(data.current.surface_pressure),
      },
      weather: [
        {
          main:
            weatherCodes[data.current.weather_code]?.description || "unknown",
          description:
            weatherCodes[data.current.weather_code]?.description || "unknown",
          icon: weatherCodes[data.current.weather_code]?.icon || "01d",
          georgian:
            weatherCodes[data.current.weather_code]?.georgian || "უცნობი",
        },
      ],
      wind: {
        speed: Math.round(data.current.wind_speed_10m * 0.277778),
      },
      visibility: 10000,
      last_updated: data.current.time,
    };

    displayWeather(transformedData);
  } catch (error) {
    console.error("Weather fetch error:", error);
    displayWeatherError();
  }
}

// Display weather data
function displayWeather(data) {
  const weatherContent = document.getElementById("weatherContent");

  if (!data || !data.weather || !data.weather[0]) {
    displayWeatherError();
    return;
  }

  const weather = data.weather[0];
  const iconClass = weatherIcons[weather.icon] || "fas fa-cloud cloudy";
  const description = weather.georgian || weather.description;

  weatherContent.innerHTML = `
    <div class="weather-location">
      <i class="fas fa-map-marker-alt"></i>
      <span>${data.name}</span>
    </div>
    <div class="weather-main">
      <div class="weather-temp">${Math.round(data.main.temp)}°</div>
      <i class="${iconClass} weather-condition-icon"></i>
    </div>
    <div class="weather-description">${description}</div>
    <div class="weather-details">
      <div class="weather-detail">
        <i class="fas fa-thermometer-half"></i>
        <span>გრძნობა: ${Math.round(data.main.feels_like)}°</span>
      </div>
      <div class="weather-detail">
        <i class="fas fa-tint"></i>
        <span>ტენიანობა: ${data.main.humidity}%</span>
      </div>
      <div class="weather-detail">
        <i class="fas fa-tachometer-alt"></i>
        <span>წნევა: ${Math.round(data.main.pressure)} hPa</span>
      </div>
      <div class="weather-detail">
        <i class="fas fa-wind"></i>
        <span>ქარი: ${Math.round(data.wind.speed)} მ/წმ</span>
      </div>
    </div>
    <div class="weather-last-updated">
      <span class="last-updated">
  ბოლოს განახლდა: ${formatWeatherTime(data.last_updated)}
</span>

    </div>
  `;
}

// Display weather error
function displayWeatherError() {
  const weatherContent = document.getElementById("weatherContent");

  if (!weatherContent) return;

  weatherContent.innerHTML = `
    <div class="weather-error">
      <i class="fas fa-exclamation-triangle"></i>
      ამინდის ინფორმაციის ჩატვირთვა ვერ მოხერხდა
    </div>
    <div class="weather-last-updated">
      <span class="last-updated">ბოლო მცდელობა: ${new Date().toLocaleTimeString(
        "ka-GE"
      )}</span>
    </div>
  `;
}

// Initialize weather widget when page loads
document.addEventListener("DOMContentLoaded", function () {
  // Initial weather fetch
  fetchWeather();

  // Auto-refresh weather every 360 minutes 
  setInterval(fetchWeather, 360 * 60 * 1000);
});

// Function to format weather time
function formatWeatherTime(timestamp) {
  const date = new Date(timestamp);
  return date.toLocaleTimeString('ka-GE', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
}


// Function to get weather condition color
function getWeatherColor(condition) {
  const colors = {
    Clear: "#ffd700",
    Clouds: "#87ceeb",
    Rain: "#4682b4",
    Drizzle: "#708090",
    Thunderstorm: "#483d8b",
    Snow: "#f0f8ff",
    Mist: "#d3d3d3",
    Smoke: "#a9a9a9",
    Haze: "#dda0dd",
    Dust: "#daa520",
    Fog: "#708090",
    Sand: "#f4a460",
    Ash: "#696969",
    Squall: "#4682b4",
    Tornado: "#8b0000",
  };

  return colors[condition] || "#87ceeb";
}
