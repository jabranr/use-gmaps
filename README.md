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

## Usage

This custom hook uses `@googlemaps/js-api-loader` to setup the map. More info at https://github.com/googlemaps/js-api-loader

> Get Google Maps API key - More info https://developers.google.com/maps/documentation/javascript/get-api-key

Use the custom hook in your React app:

```js
import React from 'react';
import useGoogleMaps from 'use-gmaps';

export default function App() {
  const { mapRef, map, errors, isLoaded } = useGoogleMaps({
    apiKey: 'ABC-XYZ',
    libraries: ['places'], // optional
    version: 'weekly', // optional
    mapOptions: { ... } // Map options as listed at https://developers.google.com/maps/documentation/javascript/reference/map#MapOptions
  });


  return <div ref={mapRef} style={{ width: '100vw', height: '100vh' }} />;
}

```

> If you are using Create React App (CRA) then you can also pass the key from environment variables (e.g. process.env.REACT_APP_GMAPS_API_KEY)

Another example to add a marker:

```js
import React from 'react';
import useGoogleMaps from 'use-gmaps';

const { mapRef, map, errors, isLoaded, currentLocation } = useGoogleMaps({
  apiKey: 'ABC-XYZ',
  mapOptions: { ... }
});

export default function App() {
  React.useEffect(() => {
    if (isMapLoaded) {
      new window.google.maps.Marker({
        map,
        position: currentLocation,
        title: "I am a marker",
      });
    }
  }, [isMapLoaded, map]);

  return <div ref={mapRef} style={{ width: '100vw', height: '100vh' }} />;
}

```

## API

This custom hook API provide access to followings:

### mapRef

The [React ref reference](https://reactjs.org/docs/hooks-reference.html#useref) that can be attached to any HTML element in the React app.

### map

The native [Google Maps Map](https://developers.google.com/maps/documentation/javascript/reference/map) object for currently loaded map.

### isMapLoaded

`true` or `false` providing current state of loading map.

### errors

Any errors from `@googlemaps/js-api-loader` while loading the map.

### currentLocation

Current [location object](https://developers.google.com/maps/documentation/javascript/reference/coordinates#LatLng) e.g. `{ lat: 123, lng: 456 }`

## License

MIT License

&copy; 2020–present [Jabran Rafique](https://jabran.me)
