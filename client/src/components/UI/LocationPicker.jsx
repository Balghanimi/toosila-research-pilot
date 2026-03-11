import React, { useState, useRef, useCallback, useEffect } from 'react';
import SearchableCitySelect from './SearchableCitySelect';
import { loadGoogleMaps, IRAQ_CITY_COORDS, IRAQ_CENTER } from '../../utils/googleMaps';

/**
 * LocationPicker - City dropdown + optional precise GPS pin on a map
 *
 * @param {Object} props
 * @param {string} props.city - Currently selected city
 * @param {function} props.onCityChange - Callback for city change
 * @param {number|null} props.lat - Latitude (optional)
 * @param {number|null} props.lng - Longitude (optional)
 * @param {string|null} props.address - Precise address (optional)
 * @param {function} props.onLocationChange - Callback: ({ lat, lng, address }) => void
 * @param {Array<string>} props.cities - List of available cities
 * @param {string} props.placeholder - Placeholder text
 * @param {string} props.id - DOM id
 * @param {string} props.markerColor - 'green' | 'red' (for from/to distinction)
 */
const LocationPicker = ({
  city,
  onCityChange,
  lat,
  lng,
  address,
  onLocationChange,
  cities = [],
  placeholder,
  id,
  markerColor: _markerColor = 'green',
}) => {
  const [showMap, setShowMap] = useState(false);
  const [mapLoading, setMapLoading] = useState(false);
  const [mapError, setMapError] = useState(null);
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);
  const geocoderRef = useRef(null);

  // Initialize map when showMap is toggled on
  const initMap = useCallback(async () => {
    if (mapInstanceRef.current) return;

    setMapLoading(true);
    setMapError(null);

    try {
      const maps = await loadGoogleMaps();

      // Determine initial center
      let center = IRAQ_CENTER;
      let zoom = 6;

      if (lat && lng) {
        center = { lat, lng };
        zoom = 14;
      } else if (city && IRAQ_CITY_COORDS[city]) {
        center = IRAQ_CITY_COORDS[city];
        zoom = 12;
      }

      const map = new maps.Map(mapRef.current, {
        center,
        zoom,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
        zoomControl: true,
        gestureHandling: 'greedy',
        language: 'ar',
      });

      const marker = new maps.Marker({
        position: lat && lng ? { lat, lng } : null,
        map: lat && lng ? map : null,
        draggable: true,
        animation: maps.Animation.DROP,
      });

      geocoderRef.current = new maps.Geocoder();

      // Click on map to place/move marker
      map.addListener('click', (e) => {
        const pos = { lat: e.latLng.lat(), lng: e.latLng.lng() };
        marker.setPosition(pos);
        marker.setMap(map);
        reverseGeocode(pos);
      });

      // Drag marker
      marker.addListener('dragend', () => {
        const pos = {
          lat: marker.getPosition().lat(),
          lng: marker.getPosition().lng(),
        };
        reverseGeocode(pos);
      });

      mapInstanceRef.current = map;
      markerRef.current = marker;
      setMapLoading(false);
    } catch (err) {
      console.error('[LocationPicker] Map init failed:', err);
      setMapError('تعذر تحميل الخريطة');
      setMapLoading(false);
    }
  }, [lat, lng, city]);

  // Reverse geocode to get address from coordinates
  const reverseGeocode = useCallback(
    (pos) => {
      if (!geocoderRef.current) {
        onLocationChange({ lat: pos.lat, lng: pos.lng, address: null });
        return;
      }

      geocoderRef.current.geocode({ location: pos }, (results, status) => {
        let addr = null;
        if (status === 'OK' && results[0]) {
          addr = results[0].formatted_address;
        }
        onLocationChange({ lat: pos.lat, lng: pos.lng, address: addr });
      });
    },
    [onLocationChange]
  );

  // Re-center map when city changes
  useEffect(() => {
    if (!mapInstanceRef.current || !city) return;

    const coords = IRAQ_CITY_COORDS[city];
    if (coords) {
      mapInstanceRef.current.setCenter(coords);
      mapInstanceRef.current.setZoom(12);
    }
  }, [city]);

  // Init map when expanded
  useEffect(() => {
    if (showMap) {
      initMap();
    }
  }, [showMap, initMap]);

  const handleToggleMap = () => {
    setShowMap((prev) => !prev);
  };

  const handleClearLocation = () => {
    if (markerRef.current) {
      markerRef.current.setMap(null);
    }
    onLocationChange({ lat: null, lng: null, address: null });
  };

  const hasApiKey = !!process.env.REACT_APP_GOOGLE_MAPS_API_KEY;

  return (
    <div>
      {/* City Dropdown (always shown) */}
      <SearchableCitySelect
        value={city}
        onChange={onCityChange}
        cities={cities}
        placeholder={placeholder}
        showAllOption={false}
        id={id}
      />

      {/* Pin Location Toggle (only if API key is set) */}
      {hasApiKey && city && (
        <button
          type="button"
          onClick={handleToggleMap}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            marginTop: '8px',
            padding: '6px 12px',
            background: 'none',
            border: '1px dashed #9ca3af',
            borderRadius: '8px',
            color: showMap ? '#16a34a' : '#6b7280',
            fontSize: '13px',
            fontFamily: '"Cairo", sans-serif',
            cursor: 'pointer',
            direction: 'rtl',
            transition: 'all 0.2s ease',
          }}
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
            <circle cx="12" cy="10" r="3" />
          </svg>
          {showMap ? 'إخفاء الخريطة' : 'تحديد الموقع بدقة'}
        </button>
      )}

      {/* Map Container */}
      {showMap && (
        <div
          style={{
            marginTop: '8px',
            borderRadius: '12px',
            overflow: 'hidden',
            border: '2px solid #e5e7eb',
          }}
        >
          {mapLoading && (
            <div
              style={{
                padding: '40px',
                textAlign: 'center',
                color: '#6b7280',
                fontFamily: '"Cairo", sans-serif',
                fontSize: '14px',
              }}
            >
              جاري تحميل الخريطة...
            </div>
          )}

          {mapError && (
            <div
              style={{
                padding: '20px',
                textAlign: 'center',
                color: '#ef4444',
                fontFamily: '"Cairo", sans-serif',
                fontSize: '14px',
              }}
            >
              {mapError}
            </div>
          )}

          <div
            ref={mapRef}
            style={{
              width: '100%',
              height: '250px',
              display: mapLoading || mapError ? 'none' : 'block',
            }}
          />

          {/* Address display */}
          {address && (
            <div
              style={{
                padding: '8px 12px',
                background: '#f0fdf4',
                borderTop: '1px solid #e5e7eb',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                direction: 'rtl',
                gap: '8px',
              }}
            >
              <span
                style={{
                  fontSize: '12px',
                  color: '#374151',
                  fontFamily: '"Cairo", sans-serif',
                  flex: 1,
                }}
              >
                {address}
              </span>
              <button
                type="button"
                onClick={handleClearLocation}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#ef4444',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontFamily: '"Cairo", sans-serif',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  flexShrink: 0,
                }}
              >
                مسح
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default LocationPicker;
