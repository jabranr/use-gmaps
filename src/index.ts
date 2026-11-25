import type { RefCallback } from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { importLibrary, setOptions } from '@googlemaps/js-api-loader';

/**
 * Options for loading the Maps JavaScript API.
 * @see https://developers.google.com/maps/documentation/javascript/load-maps-js-api#required_parameters
 */
export type GoogleMapsLoaderOptions = {
  /** Your Google Maps API key. */
  apiKey: string;
  /** Maps JavaScript API version. Defaults to `weekly`. */
  version?: string;
  /** Extra libraries to load up front, e.g. `['places']`. */
  libraries?: string[];
  language?: string;
  region?: string;
  mapIds?: string[];
  authReferrerPolicy?: string;
  channel?: string;
  solutionChannel?: string;
};

export type UseGoogleMapsOptions = GoogleMapsLoaderOptions & {
  /**
   * Options for the map. Changes after the map is created are applied with
   * `map.setOptions()`.
   * @see https://developers.google.com/maps/documentation/javascript/reference/map#MapOptions
   */
  mapOptions?: google.maps.MapOptions;
};

export type UseGoogleMapsResult = {
  /** Attach to the element that should hold the map: `<div ref={mapRef} />`. */
  mapRef: RefCallback<HTMLDivElement>;
  /** The map instance, or `null` until it has been created. */
  map: google.maps.Map | null;
  /** `true` once the map's first tiles have loaded. */
  isMapLoaded: boolean;
  /** Any error raised while loading the API or creating the map. */
  errors: unknown | null;
  /** Map center, updated each time the map settles after a pan or zoom. */
  currentCenter: google.maps.LatLngLiteral;
};

export const DEFAULT_CENTER: google.maps.LatLngLiteral = {
  lat: 35.82,
  lng: 76.5
};
export const DEFAULT_ZOOM = 10;

let configuredOptions: string | null = null;

function configureLoader({
  apiKey,
  version = 'weekly',
  ...rest
}: GoogleMapsLoaderOptions) {
  const options = { key: apiKey, v: version, ...rest };
  const serialized = JSON.stringify(options);

  if (configuredOptions === null) {
    setOptions(options);
    configuredOptions = serialized;
  } else if (configuredOptions !== serialized) {
    console.warn(
      '[@jabraf/use-gmaps] The Maps JavaScript API can only be loaded once per page. ' +
        'Loader options differ from the first call and are ignored.'
    );
  }
}

/** @internal Test helper to reset the once-per-page loader configuration. */
export function __resetLoaderForTests() {
  configuredOptions = null;
}

function toLiteral(
  center: google.maps.LatLng | google.maps.LatLngLiteral | null | undefined
): google.maps.LatLngLiteral | null {
  if (!center) return null;
  if (typeof (center as google.maps.LatLng).toJSON === 'function') {
    return (center as google.maps.LatLng).toJSON();
  }
  return center as google.maps.LatLngLiteral;
}

function stableKey(value: unknown): string {
  try {
    return JSON.stringify(value) ?? '';
  } catch {
    return '';
  }
}

export default function useGoogleMaps({
  mapOptions,
  ...loaderOptions
}: UseGoogleMapsOptions): UseGoogleMapsResult {
  const [element, setElement] = useState<HTMLDivElement | null>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [isMapLoaded, setMapLoaded] = useState(false);
  const [errors, setErrors] = useState<unknown | null>(null);
  const [currentCenter, setCurrentCenter] = useState<google.maps.LatLngLiteral>(
    () => toLiteral(mapOptions?.center) ?? DEFAULT_CENTER
  );

  // Latest options, read when the map is created without re-running the effect.
  const latest = useRef({ mapOptions, loaderOptions });
  latest.current = { mapOptions, loaderOptions };

  const mapRef = useCallback<RefCallback<HTMLDivElement>>((node) => {
    setElement(node);
  }, []);

  useEffect(() => {
    if (!element) return;

    let cancelled = false;
    let instance: google.maps.Map | null = null;
    let events: typeof google.maps.event | null = null;

    try {
      configureLoader(latest.current.loaderOptions);
    } catch (err) {
      setErrors(err);
      return;
    }

    Promise.all([importLibrary('maps'), importLibrary('core')])
      .then(([{ Map }, { event }]) => {
        if (cancelled) return;

        events = event;
        const options = latest.current.mapOptions;
        instance = new Map(element, {
          center: DEFAULT_CENTER,
          zoom: DEFAULT_ZOOM,
          ...options
        });
        const created = instance;

        event.addListenerOnce(created, 'tilesloaded', () => {
          if (!cancelled) setMapLoaded(true);
        });
        event.addListener(created, 'idle', () => {
          const center = toLiteral(created.getCenter());
          if (!cancelled && center) setCurrentCenter(center);
        });

        setErrors(null);
        setMap(created);
      })
      .catch((err: unknown) => {
        if (!cancelled) setErrors(err);
      });

    return () => {
      cancelled = true;
      if (instance && events) {
        events.clearInstanceListeners(instance);
      }
      setMap(null);
      setMapLoaded(false);
    };
  }, [element]);

  // Apply mapOptions changes to an existing map. Compared by value so an
  // inline object literal does not reset the map on every render.
  const mapOptionsKey = stableKey(mapOptions);
  const appliedKey = useRef<string | null>(null);
  useEffect(() => {
    if (!map) {
      appliedKey.current = null;
      return;
    }
    if (appliedKey.current === null) {
      // Options were passed to the constructor.
      appliedKey.current = mapOptionsKey;
      return;
    }
    if (appliedKey.current !== mapOptionsKey && latest.current.mapOptions) {
      map.setOptions(latest.current.mapOptions);
      appliedKey.current = mapOptionsKey;
    }
  }, [map, mapOptionsKey]);

  return { mapRef, map, isMapLoaded, errors, currentCenter };
}
