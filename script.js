// DOM Elements
const currentDateElement = document.getElementById('current-date');
const currentTimeElement = document.getElementById('current-time');
const citySelect = document.getElementById('city');
const nextPrayerNameElement = document.getElementById('next-prayer-name');
const nextPrayerTimeElement = document.getElementById('next-prayer-time');
const timeRemainingElement = document.getElementById('time-remaining');

// Prayer time elements
const prayerTimeElements = {
    fajr: document.getElementById('fajr-time'),
    dhuhr: document.getElementById('dhuhr-time'),
    asr: document.getElementById('asr-time'),
    maghrib: document.getElementById('maghrib-time'),
    isha: document.getElementById('isha-time')
};

// City coordinates (latitude, longitude)
const cityCoordinates = {
    'Jakarta': { lat: -6.2088, lng: 106.8456 },
    'Bandung': { lat: -6.9175, lng: 107.6191 },
    'Surabaya': { lat: -7.2575, lng: 112.7521 },
    'Yogyakarta': { lat: -7.7971, lng: 110.3688 },
    'Makassar': { lat: -5.1477, lng: 119.4327 },
    'Medan': { lat: 3.5952, lng: 98.6722 },
    'Palembang': { lat: -2.9761, lng: 104.7754 }
};

// Initialize
let prayerTimes = {};
let currentCity = 'Jakarta';

// Update date and time
function updateDateTime() {
    const now = new Date();

    // Format date: Monday, January 1, 2023
    const dateOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    currentDateElement.textContent = now.toLocaleDateString('en-US', dateOptions);

    // Format time: 12:00:00 AM
    const timeOptions = { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true };
    currentTimeElement.textContent = now.toLocaleTimeString('en-US', timeOptions);

    // Update next prayer time remaining
    updateNextPrayer();
}

// Fetch prayer times from API
async function fetchPrayerTimes(city) {
    try {
        const { lat, lng } = cityCoordinates[city];
        const today = new Date();
        const year = today.getFullYear();
        const month = today.getMonth() + 1;
        const day = today.getDate();

        // Using the Aladhan API
        const response = await fetch(`https://api.aladhan.com/v1/timings/${day}-${month}-${year}?latitude=${lat}&longitude=${lng}&method=2`);
        const data = await response.json();

        if (data.code === 200) {
            return {
                fajr: data.data.timings.Fajr,
                dhuhr: data.data.timings.Dhuhr,
                asr: data.data.timings.Asr,
                maghrib: data.data.timings.Maghrib,
                isha: data.data.timings.Isha
            };
        } else {
            throw new Error('Failed to fetch prayer times');
        }
    } catch (error) {
        console.error('Error fetching prayer times:', error);
        return null;
    }
}

// Update prayer times display
function updatePrayerTimesDisplay() {
    for (const prayer in prayerTimes) {
        if (prayerTimeElements[prayer]) {
            prayerTimeElements[prayer].textContent = prayerTimes[prayer];
        }
    }
}

// Convert time string to Date object
function timeStringToDate(timeStr) {
    const [hours, minutes] = timeStr.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    return date;
}

// Get next prayer
function getNextPrayer() {
    const now = new Date();
    let nextPrayer = null;
    let nextPrayerTime = null;
    let minDiff = Infinity;

    // Reset all prayer cards
    document.querySelectorAll('.prayer-card').forEach(card => {
        card.classList.remove('active-prayer');
    });

    for (const prayer in prayerTimes) {
        const prayerTime = timeStringToDate(prayerTimes[prayer]);
        const diff = prayerTime - now;

        // If prayer time is in the future and closer than current next prayer
        if (diff > 0 && diff < minDiff) {
            minDiff = diff;
            nextPrayer = prayer;
            nextPrayerTime = prayerTime;
        }
    }

    // If no future prayer found, next prayer is Fajr tomorrow
    if (!nextPrayer) {
        nextPrayer = 'fajr';
        nextPrayerTime = timeStringToDate(prayerTimes.fajr);
        nextPrayerTime.setDate(nextPrayerTime.getDate() + 1);
    }

    // Highlight the next prayer
    const prayerCard = document.getElementById(nextPrayer);
    if (prayerCard) {
        prayerCard.classList.add('active-prayer');
    }

    return { name: nextPrayer, time: nextPrayerTime };
}

// Update next prayer display
function updateNextPrayer() {
    if (Object.keys(prayerTimes).length === 0) return;

    const { name, time } = getNextPrayer();
    const now = new Date();
    const diff = time - now;

    // Format remaining time
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    // Update display
    nextPrayerNameElement.textContent = name.charAt(0).toUpperCase() + name.slice(1);
    nextPrayerTimeElement.textContent = prayerTimes[name];
    timeRemainingElement.textContent = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

// Load prayer times for selected city
async function loadPrayerTimes(city) {
    const times = await fetchPrayerTimes(city);
    if (times) {
        prayerTimes = times;
        updatePrayerTimesDisplay();
        updateNextPrayer();
    }
}

// Event listeners
citySelect.addEventListener('change', (e) => {
    currentCity = e.target.value;
    loadPrayerTimes(currentCity);
});

// Initialize
(async function init() {
    // Update date and time every second
    setInterval(updateDateTime, 1000);

    // Load initial prayer times
    await loadPrayerTimes(currentCity);
})();