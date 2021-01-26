# use-gmaps

React hook to use Google Maps in your React apps

## Install

Install with `npm`

```
npm install use-gmaps
```

Install with `yarn`

```
yarn add use-gmaps
```

This custom hook uses `@googlemaps/js-api-loader` to setup the map. More info at https://github.com/googlemaps/js-api-loader

## Usage

> Get Google Maps API key - More info https://developers.google.com/maps/documentation/javascript/get-api-key

Use the custom hook in your React app:

```js
import React from 'react';
import useGoogleMaps from 'use-gmaps';

export default function App() {
  const { mapRef } = useGoogleMaps({ apiKey: 'ABC-XYZ' });

  return <div ref={mapRef} style={{ width: '100vw', height: '100vh' }} />;
}
```

> If you are using Create React App (CRA) then you can also pass the key from environment variables (e.g. process.env.REACT_APP_GMAPS_API_KEY)

Another example to add a marker:

```js
import React from 'react';
import useGoogleMaps from 'use-gmaps';

const { mapRef, map, isMapLoaded, currentCenter } = useGoogleMaps({
  apiKey: 'ABC-XYZ'
});

export default function App() {
  React.useEffect(() => {
    if (isMapLoaded) {
      // Just use native Google Maps API methods
      new window.google.maps.Marker({
        map,
        position: currentCenter,
        title: 'I am a marker'
      });
    }
  }, [isMapLoaded, map]);

  return <div ref={mapRef} style={{ width: '100vw', height: '100vh' }} />;
}
```

## API

Here are other options that can be passed to the custom hook:

### `libraries`

Load additional libraries by specifying a `libraries` option.

```js
...
const { map } = useGoogleMaps({
  libraries: ['places']
});
```

More information at https://developers.google.com/maps/documentation/javascript/libraries

### `version`

Set a version for Google Maps API. Default to `weekly`

```js
...
const { map } = useGoogleMaps({
  version: 'weekly'
});
```

More information at https://developers.google.com/maps/documentation/javascript/versions

### `mapOptions`

Set and override default options for the Map

```js
...
const { map } = useGoogleMaps({
  mapOptions: {
    center: { lat:123,lng:456 },
    zoom: 18,
    styles: [{ ... }]
    ...
  }
});
```

More information at https://developers.google.com/maps/documentation/javascript/reference/map#MapOptions

---

This custom hook API provides access to followings:

### `mapRef`

The [React ref reference](https://reactjs.org/docs/hooks-reference.html#useref) that can be attached to any HTML element in the React app.

### `map`

The native [Google Maps Map](https://developers.google.com/maps/documentation/javascript/reference/map) object for currently loaded map.

### `isMapLoaded`

`true` or `false` providing current state of loading map.

### `errors`

Any errors from `@googlemaps/js-api-loader` while loading the map.

### `currentCenter`

Current [location object](https://developers.google.com/maps/documentation/javascript/reference/coordinates#LatLng) e.g. `{ lat: 123, lng: 456 }`

The value will update with map drag.

## Development

Run following commands to setup and start the test project using Create React App.

```sh
npm install
npm run setup
npm start
```

## License

MIT License

&copy; 2020–present [Jabran Rafique](https://jabran.me)
