/** Resolve device coordinates to a human-readable location string */
export function getDeviceLocation(options = {}) {
  const { timeout = 15000, maximumAge = 60000 } = options;

  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocation is not supported on this device"));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        const coordsLabel = `${latitude.toFixed(5)}, ${longitude.toFixed(5)} (±${Math.round(accuracy)}m)`;

        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`,
            { headers: { Accept: "application/json" } }
          );
          if (res.ok) {
            const data = await res.json();
            const label =
              data.display_name ||
              [data.address?.city, data.address?.state, data.address?.country]
                .filter(Boolean)
                .join(", ");
            if (label) {
              resolve({ latitude, longitude, accuracy, label: `${label} (${coordsLabel})` });
              return;
            }
          }
        } catch {
          /* use coords only */
        }

        resolve({ latitude, longitude, accuracy, label: coordsLabel });
      },
      (err) => {
        const messages = {
          1: "Location permission denied. Allow location access in your browser.",
          2: "Location unavailable. Try again outdoors or check device settings.",
          3: "Location request timed out. Try again.",
        };
        reject(new Error(messages[err.code] || err.message || "Failed to get location"));
      },
      { enableHighAccuracy: true, timeout, maximumAge }
    );
  });
}
