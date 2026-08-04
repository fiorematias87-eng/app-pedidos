import { useEffect, useState } from 'react';

const useGeolocation = () => {
    const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!navigator.geolocation) {
            setError('Geolocation is not supported by this browser.');
            return;
        }

        const successCallback = (position: GeolocationPosition) => {
            const { latitude, longitude } = position.coords;
            setLocation({ latitude, longitude });
        };

        const errorCallback = (err: GeolocationPositionError) => {
            setError(err.message);
        };

        navigator.geolocation.getCurrentPosition(successCallback, errorCallback);

        const watchId = navigator.geolocation.watchPosition(successCallback, errorCallback);

        return () => {
            navigator.geolocation.clearWatch(watchId);
        };
    }, []);

    return { location, error };
};

export default useGeolocation;