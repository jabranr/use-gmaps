import type { Reducer, RefObject } from "react";
import { useCallback, useEffect, useReducer, useRef } from "react";
import type { LoaderOptions } from "@googlemaps/js-api-loader";
import { Loader } from "@googlemaps/js-api-loader";

type UseGoogleMaps = LoaderOptions & {
  /**
   * Set default options for the map.
   * This is the same as the `MapOptions` in the Google Maps JavaScript API.
   * You can set options like `zoom`, `center`, `mapTypeId`, etc
   * @see https://developers.google.com/maps/documentation/javascript/reference/map#MapOptions
   */
  mapOptions?: google.maps.MapOptions;
};

type GoogleMaps = {
  mapRef: RefObject<HTMLDivElement | null>;
  map: google.maps.Map;
  isMapLoaded: boolean;
  errors: unknown | null;
  currentCenter: google.maps.LatLngLiteral;
};

type GoogleMapsState = {
  gmap: google.maps.Map;
  isLoaded: boolean;
  currentCenter: google.maps.LatLngLiteral;
  errors: unknown | null;
};

function reducer(
  state: GoogleMapsState,
  update: Partial<GoogleMapsState>
): GoogleMapsState {
  return { ...state, ...update };
}

const initialState: GoogleMapsState = {
  gmap: {} as google.maps.Map,
  isLoaded: false,
  currentCenter: { lat: 35.82, lng: 76.5 },
  errors: null,
};

export default function useGoogleMaps({
  apiKey,
  mapOptions,
  ...options
}: UseGoogleMaps): GoogleMaps {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const [state, dispatch] = useReducer(
    reducer as Reducer<GoogleMapsState, Partial<GoogleMapsState>>,
    initialState
  );

  const setupGoogleMaps = useCallback(function setupGoogleMaps() {
    if (typeof window !== "undefined" && mapRef.current) {
      const gmap = new window.google.maps.Map(mapRef.current, {
        center: state.currentCenter,
        zoom: 10,
        ...mapOptions,
      });

      window.google.maps.event.addListenerOnce(gmap, "tilesloaded", () => {
        dispatch({ gmap, isLoaded: true });
      });

      window.google.maps.event.addListener(gmap, "center_changed", () => {
        dispatch({
          gmap,
          isLoaded: true,
          currentCenter: gmap.getCenter()?.toJSON(),
        });
      });
    }
  }, []);

  useEffect(() => {
    if (state.isLoaded) {
      return;
    }

    const loader = new Loader({
      apiKey,
      version: "weekly",
      ...options,
    });

    loader
      .importLibrary("maps")
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
    currentCenter: state.currentCenter,
  };
}
