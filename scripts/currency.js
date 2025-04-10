
const timerResults = {};
const CACHELIFESPAN = 28800000; // 8 hours in milliseconds; it doesn't change as fast at the weather

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
            saveCacheToLocalStorage(cache); // save to local cache. improved version baby!! great technique to have learned
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
    localStorage.setItem("currencyCache", JSON.stringify(cache));
}

function loadCacheFromLocalStorage() {
    const cachedData = localStorage.getItem("currencyCache");
    return cachedData ? JSON.parse(cachedData) : {};
}

async function convertCurrency(fromCurrency, toCurrency, amount) {
    return fetch(`https://open.er-api.com/v6/latest/${fromCurrency}`)
        .then(response => {
            return response.json();
        })
        .then(data => {
            const rate = data.rates[toCurrency];
            return (amount * rate).toFixed(2);
        })
        .catch(error => {
            console.error(error);
            $('#conversion-result').text("Error fetching conversion data.");
            throw new Error("Error fetching conversion data.");
        });
}

const memoConvertCurrency = memoize(convertCurrency);

$(document).ready(function() {

    $('#currency-form').on('submit', async function (event) {
        event.preventDefault();

        const fromCurrency = $('#from-currency').val();
        const toCurrency = $('#to-currency').val();
        const amount = parseFloat($('#amount').val());
        
        if (!fromCurrency || !toCurrency || isNaN(amount) || amount <= 0) {
            $('#conversion-result').text("Please enter a valid amount and select currencies.");
            return;
        }

        const convertedAmount = await memoConvertCurrency(fromCurrency, toCurrency, amount);

        // display result
        $('#conversion-result').html(`
            <p>${amount} ${fromCurrency} = ${convertedAmount} ${toCurrency}</p>
        `);
    });
});