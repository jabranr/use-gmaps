import { useEffect, useReducer, useRef } from 'react';
import { Loader } from '@googlemaps/js-api-loader';

export default function useGoogleMaps({ apiKey, mapOptions, ...options }) {
  const mapRef = useRef(null);
  const [state, dispatch] = useReducer(
    function (state, update) {
      return { ...state, ...update };
    },
    {
      gmap: {},
      isLoaded: false,
      currentLocation: { lat: 35.82, lng: 76.5 }
    }
  );

  const setupGoogleMaps = () => {
    const gmap = new window.google.maps.Map(mapRef.current, {
      center: state.currentLocation,
      zoom: 10,
      styles: [
        {
          featureType: 'poi',
          stylers: [{ visibility: 'off' }]
        },
        {
          featureType: 'transit.station',
          stylers: [{ visibility: 'off' }]
        }
      ],
      streetViewControl: false,
      ...mapOptions
    });

    if (typeof window !== 'undefined') {
      window.google.maps.event.addListenerOnce(gmap, 'tilesloaded', () => {
        dispatch({ gmap, isLoaded: true });
      });

      window.google.maps.event.addListener(gmap, 'center_changed', (ev) => {
        dispatch({
          gmap,
          isLoaded: true,
          currentLocation: gmap.getCenter().toJSON()
        });
      });
    }
  };

  useEffect(() => {
    if (state.isLoaded) {
      return;
    }

    const loader = new Loader({
      apiKey,
      version: 'weekly',
      ...options
    });

    loader
      .load()
      .then(() => {
        setupGoogleMaps();
      })
      .catch((err) => {
        dispatch({ errors: err });
      });
  }, [apiKey, options, state.isLoaded]);

  return {
    mapRef,
    map: state.gmap,
    isMapLoaded: state.isLoaded,
    errors: state.errors,
    currentLocation: state.currentLocation
  };
}
