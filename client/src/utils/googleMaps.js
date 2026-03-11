/**
 * Google Maps lazy loader
 * Loads the Maps JavaScript API only when needed (no cost until user interacts)
 */

let loadPromise = null;

export function loadGoogleMaps() {
  if (loadPromise) return loadPromise;

  loadPromise = new Promise((resolve, reject) => {
    if (window.google?.maps) {
      resolve(window.google.maps);
      return;
    }

    const apiKey = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      reject(new Error('REACT_APP_GOOGLE_MAPS_API_KEY not set'));
      return;
    }

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&language=ar&region=IQ`;
    script.async = true;
    script.onload = () => resolve(window.google.maps);
    script.onerror = () => reject(new Error('Failed to load Google Maps'));
    document.head.appendChild(script);
  });

  return loadPromise;
}

/**
 * Iraqi city center coordinates for quick map centering
 * (avoids Geocoding API calls for basic city selection)
 */
export const IRAQ_CITY_COORDS = {
  بغداد: { lat: 33.3152, lng: 44.3661 },
  البصرة: { lat: 30.5085, lng: 47.7804 },
  النجف: { lat: 32.0, lng: 44.3354 },
  كربلاء: { lat: 32.616, lng: 44.0249 },
  أربيل: { lat: 36.1912, lng: 44.0091 },
  الموصل: { lat: 36.336, lng: 43.1189 },
  السليمانية: { lat: 35.5574, lng: 45.4354 },
  كركوك: { lat: 35.4681, lng: 44.3922 },
  الناصرية: { lat: 31.044, lng: 46.2574 },
  'ذي قار': { lat: 31.044, lng: 46.2574 },
  العمارة: { lat: 31.8369, lng: 47.1459 },
  ميسان: { lat: 31.8369, lng: 47.1459 },
  الديوانية: { lat: 31.9928, lng: 44.9256 },
  القادسية: { lat: 31.9928, lng: 44.9256 },
  الكوت: { lat: 32.4959, lng: 45.8315 },
  واسط: { lat: 32.4959, lng: 45.8315 },
  بعقوبة: { lat: 33.7487, lng: 44.653 },
  ديالى: { lat: 33.7487, lng: 44.653 },
  الرمادي: { lat: 33.422, lng: 43.299 },
  الأنبار: { lat: 33.422, lng: 43.299 },
  تكريت: { lat: 34.6137, lng: 43.6773 },
  'صلاح الدين': { lat: 34.6137, lng: 43.6773 },
  الحلة: { lat: 32.482, lng: 44.4218 },
  بابل: { lat: 32.482, lng: 44.4218 },
  السماوة: { lat: 31.319, lng: 45.2806 },
  المثنى: { lat: 31.319, lng: 45.2806 },
  دهوك: { lat: 36.867, lng: 43.0013 },
  الكوفة: { lat: 32.0299, lng: 44.4022 },
  سامراء: { lat: 34.1979, lng: 43.8751 },
};

// Default center: Iraq center
export const IRAQ_CENTER = { lat: 33.2232, lng: 43.6793 };
export const IRAQ_DEFAULT_ZOOM = 6;
