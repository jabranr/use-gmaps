import { StrictMode, useState } from 'react';
import {
  act,
  cleanup,
  render,
  renderHook,
  waitFor
} from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import useGoogleMaps, {
  DEFAULT_CENTER,
  __resetLoaderForTests,
  type UseGoogleMapsOptions,
  type UseGoogleMapsResult
} from './index';

type Listener = () => void;

const listeners = new Map<string, Listener[]>();
const mapInstances: MockMap[] = [];

class MockMap {
  center: google.maps.LatLngLiteral;
  setOptions = vi.fn();
  constructor(
    public element: HTMLElement,
    public options: google.maps.MapOptions
  ) {
    this.center = options.center as google.maps.LatLngLiteral;
    mapInstances.push(this);
  }
  getCenter() {
    return { toJSON: () => this.center };
  }
}

const event = {
  addListenerOnce: vi.fn((_m: unknown, name: string, cb: Listener) => {
    listeners.set(name, [...(listeners.get(name) ?? []), cb]);
  }),
  addListener: vi.fn((_m: unknown, name: string, cb: Listener) => {
    listeners.set(name, [...(listeners.get(name) ?? []), cb]);
  }),
  clearInstanceListeners: vi.fn()
};

function fire(name: string) {
  act(() => listeners.get(name)?.forEach((cb) => cb()));
}

const importLibrary = vi.fn(async (name: string) =>
  name === 'maps' ? { Map: MockMap } : { event }
);
const setOptions = vi.fn();

vi.mock('@googlemaps/js-api-loader', () => ({
  importLibrary: (name: string) => importLibrary(name),
  setOptions: (o: unknown) => setOptions(o)
}));

function Harness({
  options,
  onResult,
  showMap = true
}: {
  options: UseGoogleMapsOptions;
  onResult: (r: UseGoogleMapsResult) => void;
  showMap?: boolean;
}) {
  const result = useGoogleMaps(options);
  onResult(result);
  return showMap ? <div data-testid="map" ref={result.mapRef} /> : null;
}

describe('useGoogleMaps', () => {
  beforeEach(() => {
    __resetLoaderForTests();
    listeners.clear();
    mapInstances.length = 0;
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('returns a null map and default state before mounting', () => {
    const { result } = renderHook(() => useGoogleMaps({ apiKey: 'k' }));
    expect(result.current.map).toBeNull();
    expect(result.current.isMapLoaded).toBe(false);
    expect(result.current.errors).toBeNull();
    expect(result.current.currentCenter).toEqual(DEFAULT_CENTER);
    expect(importLibrary).not.toHaveBeenCalled();
  });

  it('configures the loader with the v2 option names', async () => {
    let last!: UseGoogleMapsResult;
    render(
      <Harness
        options={{ apiKey: 'k', libraries: ['places'] }}
        onResult={(r) => (last = r)}
      />
    );
    await waitFor(() => expect(last.map).not.toBeNull());
    expect(setOptions).toHaveBeenCalledWith({
      key: 'k',
      v: 'weekly',
      libraries: ['places']
    });
  });

  it('creates exactly one map with merged options', async () => {
    let last!: UseGoogleMapsResult;
    const { getByTestId } = render(
      <Harness
        options={{ apiKey: 'k', mapOptions: { zoom: 15 } }}
        onResult={(r) => (last = r)}
      />
    );
    await waitFor(() => expect(last.map).not.toBeNull());
    expect(mapInstances).toHaveLength(1);
    expect(mapInstances[0]!.element).toBe(getByTestId('map'));
    expect(mapInstances[0]!.options).toEqual({
      center: DEFAULT_CENTER,
      zoom: 15
    });
  });

  it('creates a single map under StrictMode', async () => {
    let last!: UseGoogleMapsResult;
    render(
      <StrictMode>
        <Harness options={{ apiKey: 'k' }} onResult={(r) => (last = r)} />
      </StrictMode>
    );
    await waitFor(() => expect(last.map).not.toBeNull());
    expect(mapInstances).toHaveLength(1);
  });

  it('does not create extra maps when the parent re-renders', async () => {
    let last!: UseGoogleMapsResult;
    const { rerender } = render(
      <Harness options={{ apiKey: 'k' }} onResult={(r) => (last = r)} />
    );
    rerender(
      <Harness options={{ apiKey: 'k' }} onResult={(r) => (last = r)} />
    );
    rerender(
      <Harness options={{ apiKey: 'k' }} onResult={(r) => (last = r)} />
    );
    await waitFor(() => expect(last.map).not.toBeNull());
    expect(mapInstances).toHaveLength(1);
  });

  it('creates the map when the element mounts later', async () => {
    let last!: UseGoogleMapsResult;
    function Late() {
      const [show, setShow] = useState(false);
      return (
        <>
          <button onClick={() => setShow(true)}>show</button>
          <Harness
            options={{ apiKey: 'k' }}
            onResult={(r) => (last = r)}
            showMap={show}
          />
        </>
      );
    }
    const { getByText } = render(<Late />);
    await new Promise((r) => setTimeout(r, 0));
    expect(mapInstances).toHaveLength(0);

    act(() => getByText('show').click());
    await waitFor(() => expect(last.map).not.toBeNull());
    expect(mapInstances).toHaveLength(1);
  });

  it('sets isMapLoaded on tilesloaded and updates center on idle', async () => {
    let last!: UseGoogleMapsResult;
    render(<Harness options={{ apiKey: 'k' }} onResult={(r) => (last = r)} />);
    await waitFor(() => expect(last.map).not.toBeNull());
    expect(last.isMapLoaded).toBe(false);

    fire('tilesloaded');
    expect(last.isMapLoaded).toBe(true);

    mapInstances[0]!.center = { lat: 1, lng: 2 };
    fire('idle');
    expect(last.currentCenter).toEqual({ lat: 1, lng: 2 });
  });

  it('initialises currentCenter from mapOptions.center', () => {
    const { result } = renderHook(() =>
      useGoogleMaps({ apiKey: 'k', mapOptions: { center: { lat: 5, lng: 6 } } })
    );
    expect(result.current.currentCenter).toEqual({ lat: 5, lng: 6 });
  });

  it('reports loader errors', async () => {
    const error = new Error('API Error');
    importLibrary.mockRejectedValueOnce(error);
    let last!: UseGoogleMapsResult;
    render(<Harness options={{ apiKey: 'k' }} onResult={(r) => (last = r)} />);
    await waitFor(() => expect(last.errors).toBe(error));
    expect(last.map).toBeNull();
  });

  it('clears listeners on unmount and ignores late loads', async () => {
    let last!: UseGoogleMapsResult;
    const { unmount } = render(
      <Harness options={{ apiKey: 'k' }} onResult={(r) => (last = r)} />
    );
    await waitFor(() => expect(last.map).not.toBeNull());
    unmount();
    expect(event.clearInstanceListeners).toHaveBeenCalledWith(mapInstances[0]);

    // Unmount before the library resolves: no map should be created.
    mapInstances.length = 0;
    const { unmount: unmountEarly } = render(
      <Harness options={{ apiKey: 'k' }} onResult={() => {}} />
    );
    unmountEarly();
    await new Promise((r) => setTimeout(r, 0));
    expect(mapInstances).toHaveLength(0);
  });

  it('applies changed mapOptions but ignores equal inline objects', async () => {
    let last!: UseGoogleMapsResult;
    const { rerender } = render(
      <Harness
        options={{ apiKey: 'k', mapOptions: { zoom: 3 } }}
        onResult={(r) => (last = r)}
      />
    );
    await waitFor(() => expect(last.map).not.toBeNull());

    rerender(
      <Harness
        options={{ apiKey: 'k', mapOptions: { zoom: 3 } }}
        onResult={(r) => (last = r)}
      />
    );
    expect(mapInstances[0]!.setOptions).not.toHaveBeenCalled();

    rerender(
      <Harness
        options={{ apiKey: 'k', mapOptions: { zoom: 7 } }}
        onResult={(r) => (last = r)}
      />
    );
    expect(mapInstances[0]!.setOptions).toHaveBeenCalledWith({ zoom: 7 });
  });

  it('configures the loader once and warns on conflicting options', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    let a!: UseGoogleMapsResult;
    let b!: UseGoogleMapsResult;
    render(
      <>
        <Harness options={{ apiKey: 'k' }} onResult={(r) => (a = r)} />
        <Harness options={{ apiKey: 'other' }} onResult={(r) => (b = r)} />
      </>
    );
    await waitFor(() => expect(a.map && b.map).toBeTruthy());
    expect(setOptions).toHaveBeenCalledTimes(1);
    expect(warn).toHaveBeenCalledTimes(1);
    warn.mockRestore();
  });
});
