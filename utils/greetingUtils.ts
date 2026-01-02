
/**
 * Calculates the astronomical greeting based on the user's location and local time.
 * This accounts for seasonal changes (longer days in summer, shorter in winter)
 * by calculating the actual sunrise and sunset times.
 */

// Converts degrees to radians
const toRadians = (deg: number) => (deg * Math.PI) / 180;
// Converts radians to degrees
const toDegrees = (rad: number) => (rad * 180) / Math.PI;

/**
 * Calculates sunrise and sunset times for a given date and location.
 * Uses the general sunrise equation.
 */
function getSunTimes(date: Date, lat: number, lng: number) {
    const julianDate = (date.getTime() / 86400000) - (date.getTimezoneOffset() / 1440) + 2440587.5;
    const n = julianDate - 2451545.0 + 0.0008;
    const meanSolarNoon = n - lng / 360;
    
    const solarMeanAnomaly = (357.5291 + 0.98560028 * meanSolarNoon) % 360;
    const solarMeanAnomalyRad = toRadians(solarMeanAnomaly);
    
    const equationOfCenter = 1.9148 * Math.sin(solarMeanAnomalyRad) + 0.0200 * Math.sin(2 * solarMeanAnomalyRad) + 0.0003 * Math.sin(3 * solarMeanAnomalyRad);
    
    const eclipticLongitude = (solarMeanAnomaly + equationOfCenter + 102.9372 + 180) % 360;
    const eclipticLongitudeRad = toRadians(eclipticLongitude);
    
    const solarTransit = 2451545.0 + meanSolarNoon + 0.0053 * Math.sin(solarMeanAnomalyRad) - 0.0069 * Math.sin(2 * eclipticLongitudeRad);
    
    const declination = Math.asin(Math.sin(eclipticLongitudeRad) * Math.sin(toRadians(23.44)));
    
    const hourAngle = Math.acos((Math.sin(toRadians(-0.83)) - Math.sin(toRadians(lat)) * Math.sin(declination)) / (Math.cos(toRadians(lat)) * Math.cos(declination)));
    const hourAngleDeg = toDegrees(hourAngle);
    
    const jSunrise = solarTransit - (hourAngleDeg / 360);
    const jSunset = solarTransit + (hourAngleDeg / 360);
    
    // Convert Julian dates back to timestamps
    const timestampSunrise = (jSunrise - 2440587.5) * 86400000;
    const timestampSunset = (jSunset - 2440587.5) * 86400000;
    
    // Adjust for timezone offset to get local Date objects
    // Note: The raw timestamp is UTC-based, creating a new Date handles local conversion
    return {
        sunrise: new Date(timestampSunrise),
        sunset: new Date(timestampSunset)
    };
}

/**
 * Fallback greeting if location is denied or fails
 */
function getTimeBasedGreeting(hour: number): string {
    if (hour >= 5 && hour < 12) return "Good morning";
    if (hour >= 12 && hour < 17) return "Good afternoon";
    if (hour >= 17 && hour < 21) return "Good evening";
    return "Hello"; // Late night neutral greeting
}

export const getSmartGreeting = async (): Promise<string> => {
    return new Promise((resolve) => {
        if (!navigator.geolocation) {
            resolve(getTimeBasedGreeting(new Date().getHours()));
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                try {
                    const now = new Date();
                    const { latitude, longitude } = position.coords;
                    const { sunrise, sunset } = getSunTimes(now, latitude, longitude);

                    // Add buffers for "Civil Twilight" feel
                    // Morning starts at sunrise
                    // Afternoon starts at noon
                    // Evening starts at sunset (which varies by season)
                    
                    const currentMs = now.getTime();
                    const sunriseMs = sunrise.getTime();
                    const sunsetMs = sunset.getTime();
                    
                    // Define Noon for the specific day
                    const noon = new Date(now);
                    noon.setHours(12, 0, 0, 0);
                    const noonMs = noon.getTime();

                    if (currentMs < sunriseMs) {
                         // Pre-dawn
                         resolve("Good early morning");
                    } else if (currentMs >= sunriseMs && currentMs < noonMs) {
                        resolve("Good morning");
                    } else if (currentMs >= noonMs && currentMs < sunsetMs) {
                        resolve("Good afternoon");
                    } else {
                        // After sunset
                        resolve("Good evening");
                    }
                } catch (e) {
                    console.warn("Error calculating sun times", e);
                    resolve(getTimeBasedGreeting(new Date().getHours()));
                }
            },
            (error) => {
                console.log("Location access denied for greeting, using fallback.", error);
                resolve(getTimeBasedGreeting(new Date().getHours()));
            },
            { timeout: 5000, maximumAge: 600000 } // 5s timeout, cache for 10 mins
        );
    });
};
