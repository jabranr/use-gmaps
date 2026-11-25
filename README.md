# @jabraf/use-gmaps

React hook to use Google Maps in your React apps

## Install

Install with `npm`

```
npm install @jabraf/use-gmaps
```

Install with `yarn`

```
yarn add @jabraf/use-gmaps
```

This custom hook uses `@googlemaps/js-api-loader` to set up the map. More info at https://github.com/googlemaps/js-api-loader

## Usage

> Get a Google Maps API key: https://developers.google.com/maps/documentation/javascript/get-api-key

```tsx
import useGoogleMaps from '@jabraf/use-gmaps';

export default function App() {
  const { mapRef } = useGoogleMaps({ apiKey: 'ABC-XYZ' });

  return <div ref={mapRef} style={{ width: '100vw', height: '100vh' }} />;
}
```

> You can also pass the key from environment variables, e.g. `import.meta.env.VITE_GMAPS_API_KEY` with Vite.

Add a marker once the map exists:

```tsx
import { useEffect } from 'react';
import useGoogleMaps from '@jabraf/use-gmaps';

export default function App() {
  const { mapRef, map, currentCenter } = useGoogleMaps({
    apiKey: 'ABC-XYZ',
    mapOptions: { mapId: 'DEMO_MAP_ID' } // Advanced markers need a map ID
  });

  useEffect(() => {
    if (!map) return;

    let marker: google.maps.marker.AdvancedMarkerElement | undefined;
    google.maps.importLibrary('marker').then(({ AdvancedMarkerElement }) => {
      marker = new AdvancedMarkerElement({
        map,
        position: currentCenter,
        title: 'I am a marker'
      });
    });

    return () => {
      if (marker) marker.map = null;
    };
  }, [map]);

  return <div ref={mapRef} style={{ width: '100vw', height: '100vh' }} />;
}
```

The Maps JavaScript API can only be loaded once per page, so the loader options (everything except `mapOptions`) from the first hook call win. Later calls with different loader options log a warning and reuse the loaded API.

## Options

### `apiKey` (required)

Your Google Maps API key.

### `version`

Maps JavaScript API version. Defaults to `weekly`. See https://developers.google.com/maps/documentation/javascript/versions

### `libraries`

Extra libraries to load up front, e.g. `['places']`. You can also load them on demand with `google.maps.importLibrary()`. See https://developers.google.com/maps/documentation/javascript/libraries

### `language`, `region`, `mapIds`, `authReferrerPolicy`, `channel`, `solutionChannel`

Passed to the loader. See https://developers.google.com/maps/documentation/javascript/load-maps-js-api#required_parameters

### `mapOptions`

Options for the map, such as `center`, `zoom` and `mapId`. Defaults are `zoom: 10` and a center of `{ lat: 35.82, lng: 76.5 }`.

Changes after the map is created are applied with `map.setOptions()`. Options are compared by value, so passing a new inline object each render is fine.

See https://developers.google.com/maps/documentation/javascript/reference/map#MapOptions

## Return value

### `mapRef`

A [callback ref](https://react.dev/reference/react-dom/components/common#ref-callback) to attach to the element that should hold the map. The element can mount later (e.g. behind a condition); the map is created when it appears and torn down when it is removed.

### `map`

The native [`google.maps.Map`](https://developers.google.com/maps/documentation/javascript/reference/map) instance, or `null` until it is created.

### `isMapLoaded`

`true` once the map's first tiles have loaded.

### `errors`

Any error raised while loading the API or creating the map, otherwise `null`.

### `currentCenter`

The current center as `{ lat, lng }`. It starts at `mapOptions.center` (or the default) and updates each time the map settles after a pan or zoom.

## Migrating from v2

- `map` is `null` until the map is created (it used to be an empty object typed as a map). Check `if (map)` before using it.
- `mapRef` is a callback ref. `<div ref={mapRef} />` still works, but `mapRef.current` no longer exists.
- `currentCenter` updates when the map settles (`idle`) rather than on every frame of a drag.
- Loader options follow `@googlemaps/js-api-loader` v2. `id`, `nonce`, `retries`, `url` and `client` are no longer supported.
- `@types/google.maps` is now installed with the package, so the `google.maps` types are available without installing them yourself.

## Development

Run the following commands to set up and start the test project, a Vite + React app that installs the locally built package. Set `VITE_GMAPS_API_KEY` to see a real map.

```sh
npm install
npm run setup
npm start
```

Checks:

```sh
npm test            # unit tests
npm run typecheck
npm run format:check
npm run test:e2e    # builds the test app and runs Playwright against it
```

## Releasing

Merges to `main` are published to npm automatically with [trusted publishing](https://docs.npmjs.com/trusted-publishers). The version is bumped from [Conventional Commits](https://www.conventionalcommits.org/). To publish a pre-release from a pull request under the `rc` tag, include `[publish]` in the PR's latest commit message.

## Demo

Demo CodeSandbox - https://codesandbox.io/p/sandbox/dqlp2x

## License

MIT License

&copy; 2020–present [Jabran Rafique](https://jabran.me)
