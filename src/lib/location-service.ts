// src/lib/location-service.ts

type SuccessCallback = (position: GeolocationPosition) => void;
type ErrorCallback = (error: GeolocationPositionError) => void;

export const AppLocationService = {
    _callback: null as SuccessCallback | null,
    _realWatchId: null as number | null,
    isSimulating: false,

    /**
     * The rest of the app will call this INSTEAD of
     * navigator.geolocation.watchPosition
     */
    watch: function(successCallback: SuccessCallback, errorCallback: ErrorCallback) {
        this._callback = successCallback;

        // If NOT simulating, use the real browser GPS
        if (!this.isSimulating) {
            console.log("Using REAL GPS.");
            if (navigator.geolocation) {
                this._realWatchId = navigator.geolocation.watchPosition(
                    (position) => {
                        if (this._callback) this._callback(position);
                    },
                    errorCallback,
                    { enableHighAccuracy: true }
                );
            } else {
                console.error("Geolocation is not supported by this browser.");
                errorCallback(new GeolocationPositionError());
            }
        } else {
            // If simulating, just wait for admin to click buttons.
            console.log("Using SIMULATED GPS. Ready for admin input.");
        }
    },

    /**
     * Call this when an admin is detected.
     * This switches to "simulation mode."
     */
    startSimulation: function() {
        this.isSimulating = true;
        // If the real GPS is already running, stop it.
        if (this._realWatchId) {
            navigator.geolocation.clearWatch(this._realWatchId);
            this._realWatchId = null;
        }
        console.log("Simulation Mode ENABLED.");
    },

    /**
     * The admin panel buttons will call this function to
     * "fake" a new location update.
     */
    simulateNewLocation: function(latitude: number, longitude: number) {
        if (!this.isSimulating) {
            console.warn("Cannot simulate location when not in simulation mode.");
            return;
        }
        if (!this._callback) {
            console.warn("No app function is listening to the location service.");
            return;
        }

        console.log(`Simulating move to: ${latitude}, ${longitude}`);

        // 1. Create a FAKE "position" object that looks
        //    just like the real one from the browser API.
        const mockPosition: GeolocationPosition = {
            coords: {
                latitude: latitude,
                longitude: longitude,
                accuracy: 10,
                altitude: null,
                altitudeAccuracy: null,
                heading: null,
                speed: null
            },
            timestamp: Date.now()
        };

        // 2. Send the FAKE position to the app.
        // The app's `handlePositionUpdate` function will
        // receive this and won't know the difference.
        this._callback(mockPosition);
    }
};

// Define GeolocationPositionError since it might not be available in all environments
class GeolocationPositionError extends Error {
    readonly code: number = 0;
    readonly PERMISSION_DENIED = 1;
    readonly POSITION_UNAVAILABLE = 2;
    readonly TIMEOUT = 3;
    constructor() {
        super("Geolocation error");
        Object.setPrototypeOf(this, GeolocationPositionError.prototype);
    }
}
