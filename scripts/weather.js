

// got inspiration from https://gist.github.com/stellasphere/9490c195ed2b53c707087c8c2db4ec0c I built mine using icons
const weatherCodeMap = {
    0: {
        description: "Clear sky",
        iconClass: "wi-day-sunny" // Clear sky icon
    },
    1: {
        description: "Mainly clear",
        iconClass: "wi-day-sunny-overcast" // Mainly clear icon
    },
    2: {
        description: "Partly cloudy",
        iconClass: "wi-day-cloudy" // Partly cloudy icon
    },
    3: {
        description: "Overcast",
        iconClass: "wi-cloudy" // Overcast icon
    },
    45: {
        description: "Fog",
        iconClass: "wi-fog" // Fog icon
    },
    48: {
        description: "Depositing rime fog",
        iconClass: "wi-fog" // Fog icon (same as code 45)
    },
    51: {
        description: "Light drizzle",
        iconClass: "wi-sprinkle" // Drizzle icon
    },
    53: {
        description: "Moderate drizzle",
        iconClass: "wi-sprinkle" // Drizzle icon
    },
    55: {
        description: "Dense drizzle",
        iconClass: "wi-sprinkle" // Drizzle icon
    },
    61: {
        description: "Rain showers (slight)",
        iconClass: "wi-showers" // Light rain showers icon
    },
    63: {
        description: "Rain showers (moderate)",
        iconClass: "wi-showers" // Moderate rain showers icon
    },
    65: {
        description: "Rain showers (heavy)",
        iconClass: "wi-rain" // Heavy rain showers icon
    },
    66: {
        description: "Freezing rain (light)",
        iconClass: "wi-rain-mix" // Light freezing rain icon
    },
    67: {
        description: "Freezing rain (heavy)",
        iconClass: "wi-rain-mix" // Heavy freezing rain icon
    },
    71: {
        description: "Snow (slight)",
        iconClass: "wi-snow" // Light snow icon
    },
    73: {
        description: "Snow (moderate)",
        iconClass: "wi-snow" // Moderate snow icon
    },
    75: {
        description: "Snow (heavy)",
        iconClass: "wi-snow" // Heavy snow icon
    },
    77: {
        description: "Snow grains",
        iconClass: "wi-snow" // Snow grains icon
    },
    80: {
        description: "Rain showers (slight)",
        iconClass: "wi-day-showers" // Slight rain showers icon
    },
    81: {
        description: "Rain showers (moderate)",
        iconClass: "wi-day-showers" // Moderate rain showers icon
    },
    82: {
        description: "Rain showers (violent)",
        iconClass: "wi-day-thunderstorm" // Violent rain showers icon
    },
    85: {
        description: "Snow showers (slight)",
        iconClass: "wi-day-snow" // Slight snow showers icon
    },
    86: {
        description: "Snow showers (heavy)",
        iconClass: "wi-day-snow" // Heavy snow showers icon
    },
    95: {
        description: "Thunderstorm (slight or moderate)",
        iconClass: "wi-day-thunderstorm" // Thunderstorm icon
    },
    96: {
        description: "Thunderstorm with slight hail",
        iconClass: "wi-day-thunderstorm" // Thunderstorm with hail icon
    },
    99: {
        description: "Thunderstorm with heavy hail",
        iconClass: "wi-day-thunderstorm" // Severe thunderstorm icon
    }
};




const timerResults = {};
const CACHELIFESPAN = 1800000; // 30 minutes in milliseconds; 

function memoize(fn, expiryTime = CACHELIFESPAN) {
   
    // const cache = {};
    const cache = loadCacheFromLocalStorage();

    return async function(...args) {
        const start = performance.now();
        console.time(`time ${fn.name}:`);

        const fnName = fn.name;
        const fnArgs = JSON.stringify(args);
        const key = `${fnName}:${fnArgs}`;
        const now = Date.now();

        if (cache[key] !== undefined && (now - cache[key].timestamp < expiryTime)) { //checking if cache is fresh or stale
            console.log(`\nFound in cache and still fresh.`);
            console.timeEnd(`time ${fn.name}:`);
            const end = performance.now();
            const comparison = ((start-end) / timerResults[key]) * 100;
            console.log("Time spent reading from cache, compared to running the function: " + comparison.toFixed(2)+"%");
            return cache[key].data; //returning weather data only, timestamp not needed
        } else {
            const result = await fn(...args);   //AL - I never learn!! need await for promises!!!
            cache[key] = { data: result, timestamp: now };  //storing weather data AND when it was fetched
            //console.log("Weather Data (before caching):", result);
            saveCacheToLocalStorage(cache); // save to local cache. improved version baby!!
            console.log("\nInvoking the function for the first time. Updating cache.");
            console.timeEnd(`time ${fn.name}:`);
            const end = performance.now();
            timerResults[key] = start-end;
            return result;
        }
    }
}

//improving Will's awesome memoize function
function saveCacheToLocalStorage(cache) {
    localStorage.setItem("weatherCache", JSON.stringify(cache));
}

function loadCacheFromLocalStorage() {
    const cachedData = localStorage.getItem("weatherCache");
    return cachedData ? JSON.parse(cachedData) : {};
}

function getCoordinates(city) {
    // sends back coordinates of initial cities, I can expand this list later, added cities where my family lives, I could ask them if this weather app is honest
    // had to use AI to get coordinates, otherwise too much trouble looking manually
    const cities = {
        "Calgary": { latitude: 51.05, longitude: -114.07 },
        "Manila": { latitude: 14.6, longitude: 120.98 },
        "San Francisco": { latitude: 37.77, longitude: -122.42 },
        "Abu Dhabi": { latitude: 24.45, longitude: 54.38 }
    };
    return cities[city];
}

function getLocalTime(currentUTC, timezone) {
    return new Intl.DateTimeFormat('en-US', {
        timeZone: timezone,
        year: 'numeric',
        month: 'numeric',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        second: 'numeric'
    }).format(new Date(currentUTC));
}


function displayWeatherIcon(weatherCode) {
    const weather = weatherCodeMap[weatherCode] || {
        description: "Unknown weather condition",
        iconClass: "wi-na" // Default fallback icon for unknown codes
    };
    const iconHTML = `<span class="wi ${weather.iconClass}"></span>`;
    const descriptionHTML = `<p>${weather.description}</p>`;
    $('.weather-icon').html(iconHTML);
}

async function getWeather(latitude, longitude) {
    // fetch weather data, current temperature
    // used meteo because it's free and open source, and no need for API key
    const baseUrl = "https://api.open-meteo.com/v1/forecast";
    const params = new URLSearchParams({
        latitude: latitude,
        longitude: longitude,
        hourly: "temperature_2m",  
        daily: "sunrise,sunset,weathercode",
        timezone: "auto"
    });

    try {
        const response = await fetch(`${baseUrl}?${params.toString()}`);
        if (!response.ok) {
            throw new Error("Failed to fetch weather data from API");
        }
        const data = await response.json();
        return data;
    } catch (error) {
        console.error("Error fetching weather data:", error);
        return null;
    }
}

const memoGetWeather = memoize(getWeather); // memoize the getWeather function


$(document).ready(function() {

    $('#weather-form').on('submit', async function(event) {
        event.preventDefault();

        const city = $('#city').val();
        const coordinates = getCoordinates(city);

        if (!coordinates) { //just in case I fogot to update list of cities
            $('#weather-result').text("City not found!");
            return;
        }

        // const weatherData = await getWeather(coordinates.latitude, coordinates.longitude);
        const weatherData = await memoGetWeather(coordinates.latitude, coordinates.longitude); //!discovery! await is important!!! caused a lot of headaches, need to remember to wait when dealing with a promise

        if (weatherData) {
            // console.log(weatherData);
            const weatherCode = weatherData.daily.weathercode[0];   // get the day's weather code
            const weatherInfo = weatherCodeMap[weatherCode];        // get weather info from the map using weather code
            
            const currentHour = new Date().getHours();              // get current hour    
            const currentTemperature = weatherData.hourly.temperature_2m[currentHour]; // get current temperature using the current hour
            
            const currentUTC = new Date().toISOString();
            const cityTimezone = weatherData.timezone; 
            const localTimeStr = getLocalTime(currentUTC, cityTimezone);    //formatted local time, maybe I should have a try catch here
            const localTime = new Date(localTimeStr);                       //had lots of trouble comparing string and date, so I had to convert it to a date object
            
            if (!cityTimezone) {
                $('#weather-result').text("Timezone data missing. Unable to determine local time.");
                return;
            }

            const sunrise = new Date(weatherData.daily.sunrise[0]);    
            const sunset = new Date(weatherData.daily.sunset[0]);
            const isDaytime = localTime >= sunrise && localTime <= sunset;
            const dayOrNight = isDaytime ? "day" : "night"; //get day or night for nice dynamic background color
            

            //<img src="${weatherInfo.image}" alt="${weatherInfo.description}" class='weather-icon'/>
            if (weatherInfo) {
                $('#weather-result').html(`
                    <h2>Weather in ${city}</h2>
                    <div class='weather-info'>
                        <div class='weather-icon'>.</div>
                        <div><span class='temperature'>${currentTemperature}°C</span></div>
                        <span class='weather-desc'>${weatherInfo.description}</span><br/>
                        </div>
                    <span class='curr-time'>Local time: ${localTimeStr}</span>
                `);
                $('.weather-section').removeClass('day night').addClass(dayOrNight);
                displayWeatherIcon(weatherCode); 
            } else {
                $('#weather-result').text("Weather condition not found!");
            }
        } else {
            $('#weather-result').text("Unable to fetch weather data.");
        }
    });
});