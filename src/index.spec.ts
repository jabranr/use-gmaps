import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import useGoogleMaps from "./index.js";
import type { Libraries } from "@googlemaps/js-api-loader";

// Mock Google Maps API
const mockMap = {
  getCenter: vi.fn(() => ({
    toJSON: () => ({ lat: 40.7128, lng: -74.006 }),
  })),
};

const mockEvent = {
  addListenerOnce: vi.fn((map, event, callback) => {
    if (event === "tilesloaded") {
      setTimeout(callback, 0);
    }
  }),
  addListener: vi.fn(),
};

const mockLoader = {
  importLibrary: vi.fn(() => Promise.resolve()),
};

// Mock @googlemaps/js-api-loader
vi.mock("@googlemaps/js-api-loader", () => ({
  Loader: vi.fn(() => mockLoader),
}));

describe("useGoogleMaps", () => {
  beforeEach(() => {
    // Mock globalThis.google
    Object.defineProperty(globalThis, "google", {
      value: {
        maps: {
          Map: vi.fn(() => mockMap),
          event: mockEvent,
        },
      },
      writable: true,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("should initialize with default state", () => {
    const { result } = renderHook(() =>
      useGoogleMaps({ apiKey: "test-api-key" })
    );

    expect(result.current.map).toBeNull();
    expect(result.current.isMapLoaded).toBe(false);
    expect(result.current.errors).toBeNull();
    expect(result.current.currentCenter).toEqual({ lat: 35.82, lng: 76.5 });
    expect(result.current.mapRef.current).toBeNull();
  });

  it("should load Google Maps API with correct options", async () => {
    const apiKey = "test-api-key";

    renderHook(() => useGoogleMaps({ apiKey }));

    await waitFor(() => {
      expect(mockLoader.importLibrary).toHaveBeenCalledWith("maps");
    });
  });

  it("should handle API loading errors", async () => {
    const error = new Error("API Error");
    mockLoader.importLibrary.mockRejectedValueOnce(error);

    const { result } = renderHook(() =>
      useGoogleMaps({ apiKey: "test-api-key" })
    );

    await waitFor(() => {
      expect(result.current.errors).toBe(error);
    });
  });

  it("should create map when API is loaded and mapRef is set", async () => {
    const { result } = renderHook(() =>
      useGoogleMaps({
        apiKey: "test-api-key",
        mapOptions: { zoom: 15 },
      })
    );

    // Simulate setting mapRef
    const mockElement = document.createElement("div");
    result.current.mapRef.current = mockElement;

    await waitFor(() => {
      expect(mockLoader.importLibrary).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(window.google.maps.Map).toHaveBeenCalledWith(
        mockElement,
        expect.objectContaining({
          center: { lat: 35.82, lng: 76.5 },
          zoom: 15,
        })
      );
    });
  });

  it("should set up event listeners on map", async () => {
    const { result } = renderHook(() =>
      useGoogleMaps({ apiKey: "test-api-key" })
    );

    result.current.mapRef.current = document.createElement("div");

    await waitFor(() => {
      expect(mockEvent.addListenerOnce).toHaveBeenCalledWith(
        mockMap,
        "tilesloaded",
        expect.any(Function)
      );
      expect(mockEvent.addListener).toHaveBeenCalledWith(
        mockMap,
        "center_changed",
        expect.any(Function)
      );
    });
  });

  it("should update state when map is loaded", async () => {
    const { result } = renderHook(() =>
      useGoogleMaps({ apiKey: "test-api-key" })
    );

    result.current.mapRef.current = document.createElement("div");

    await waitFor(() => {
      expect(result.current.isMapLoaded).toBe(true);
      expect(result.current.map).toBe(mockMap);
    });
  });

  it("should not reload if already loaded", async () => {
    const { result, rerender } = renderHook(() =>
      useGoogleMaps({ apiKey: "test-api-key" })
    );

    result.current.mapRef.current = document.createElement("div");

    await waitFor(() => {
      expect(result.current.isMapLoaded).toBe(true);
    });

    const initialCallCount = mockLoader.importLibrary.mock.calls.length;

    rerender();

    expect(mockLoader.importLibrary.mock.calls.length).toBe(initialCallCount);
  });
});
