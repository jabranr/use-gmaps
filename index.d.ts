import { LoaderOptions } from '@googlemaps/js-api-loader';
import { MutableRefObject } from 'react';

export default function useGoogleMaps({
  apiKey,
  mapOptions,
  ...options
}: {
  apiKey: string;
  mapOptions?: google.maps.MapOptions;
  options?: LoaderOptions;
}): {
  mapRef: MutableRefObject<HTMLDivElement>;
  map: google.maps.Map;
  isMapLoaded: boolean;
  errors: any;
  currentCenter: google.maps.LatLngLiteral;
};
