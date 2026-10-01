import { useCallback, useEffect, useState } from 'react';
import { getDemoPlaces } from '../data/demoPlaces.js';
import { fetchPlaces } from '../services/places.js';

export function usePlaces(area, category) {
  const [places, setPlaces] = useState([]);
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState('');
  const [isDemo, setIsDemo] = useState(false);
  const [requestVersion, setRequestVersion] = useState(0);

  const refresh = useCallback(() => {
    setRequestVersion((current) => current + 1);
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    async function load() {
      setStatus('loading');
      setError('');
      setIsDemo(false);
      try {
        const nextPlaces = await fetchPlaces(category, area, controller.signal);
        if (controller.signal.aborted) return;

        if (nextPlaces.length) {
          setPlaces(nextPlaces);
          setStatus('success');
          return;
        }

        setPlaces([]);
        setStatus('empty');
      } catch (requestError) {
        if (requestError.name === 'AbortError') return;
        setPlaces(getDemoPlaces(category, area));
        setStatus('fallback');
        setIsDemo(true);
        setError('Live place data is temporarily unavailable. Showing a small demo set near New Delhi.');
      }
    }

    load();
    return () => controller.abort();
  }, [area, category, requestVersion]);

  return { places, status, error, isDemo, refresh };
}
