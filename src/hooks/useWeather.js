import { useEffect, useState } from 'react';
import { fetchWeather } from '../services/weather.js';

export function useWeather(area) {
  const [weather, setWeather] = useState(null);
  const [status, setStatus] = useState('loading');

  useEffect(() => {
    const controller = new AbortController();

    async function load() {
      setStatus('loading');
      try {
        const nextWeather = await fetchWeather(area, controller.signal);
        if (controller.signal.aborted) return;
        setWeather(nextWeather);
        setStatus(nextWeather ? 'success' : 'unavailable');
      } catch (error) {
        if (error.name === 'AbortError') return;
        setWeather(null);
        setStatus('unavailable');
      }
    }

    load();
    return () => controller.abort();
  }, [area]);

  return { weather, status };
}
