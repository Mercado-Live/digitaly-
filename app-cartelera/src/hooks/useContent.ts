import { useState, useEffect, useCallback, useRef } from 'react';
import { fetchDeviceContent, doesDeviceExist } from '../services/content.service';
import {
  cacheAnnouncement,
  getCachedAnnouncement,
} from '../services/cache.service';
import { clearStoredDeviceId } from '../services/device.service';
import type { Announcement } from '../types';

interface UseContentResult {
  announcement: Announcement | null;
  slides: Announcement[];
  slideIndex: number;
  isLoading: boolean;
  error: string | null;
  isFromCache: boolean;
  deviceDeleted: boolean;
  refresh: () => Promise<void>;
  unpair: () => Promise<void>;
}

export function useContent(deviceId: string | null): UseContentResult {
  const [announcement, setAnnouncement] = useState<Announcement | null>(null);
  const [slides, setSlides] = useState<Announcement[]>([]);
  const [slideIndex, setSlideIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFromCache, setIsFromCache] = useState(false);
  const [deviceDeleted, setDeviceDeleted] = useState(false);
  const mountedRef = useRef(true);
  const slideTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Auto-advance slides
  useEffect(() => {
    if (slides.length <= 1) return;

    const currentSlide = slides[slideIndex];
    // Usar la duracion mas larga entre todos los contenidos, o 15s default
    let maxDuration = 15000;
    if (currentSlide?.content) {
      const durations: number[] = [];
      for (const items of Object.values(currentSlide.content)) {
        if (Array.isArray(items)) {
          for (const item of items) {
            if (item?.durationMs) durations.push(item.durationMs);
          }
        }
      }
      if (durations.length > 0) maxDuration = Math.max(...durations);
    }

    slideTimerRef.current = setInterval(() => {
      if (!mountedRef.current) return;
      setSlideIndex(prev => (prev + 1) % slides.length);
    }, maxDuration);

    return () => {
      if (slideTimerRef.current) clearInterval(slideTimerRef.current);
    };
  }, [slides, slideIndex]);

  // Update current announcement when slideIndex or slides change
  useEffect(() => {
    if (slides.length > 0 && slideIndex < slides.length) {
      setAnnouncement(slides[slideIndex]);
    }
  }, [slides, slideIndex]);

  const loadContent = useCallback(async () => {
    if (!deviceId) {
      setIsLoading(false);
      setError('Dispositivo no vinculado');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const content = await fetchDeviceContent(deviceId);

      if (!mountedRef.current) return;

      if (content && content.length > 0) {
        setSlides(content);
        setSlideIndex(0);
        setAnnouncement(content[0]);
        setIsFromCache(false);
        setError(null);
        setDeviceDeleted(false);
        cacheAnnouncement(content[0]);
      } else {
        // Verificar si el dispositivo fue eliminado
        const exists = await doesDeviceExist(deviceId);
        if (!mountedRef.current) return;

        if (!exists) {
          setDeviceDeleted(true);
          setError('Dispositivo eliminado del panel');
          setIsLoading(false);
          return;
        }

        const cached = await getCachedAnnouncement();
        if (!mountedRef.current) return;

        if (cached) {
          setSlides([cached]);
          setSlideIndex(0);
          setAnnouncement(cached);
          setIsFromCache(true);
          setError(null);
        } else {
          setSlides([]);
          setAnnouncement(null);
          setError(null);
        }
      }
    } catch (err) {
      if (!mountedRef.current) return;

      const cached = await getCachedAnnouncement();
      if (!mountedRef.current) return;

      if (cached) {
        setSlides([cached]);
        setSlideIndex(0);
        setAnnouncement(cached);
        setIsFromCache(true);
        setError(null);
      } else {
        const message =
          err instanceof Error ? err.message : 'Error desconocido';
        setError(message);
      }
    } finally {
      if (mountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [deviceId]);

  useEffect(() => {
    mountedRef.current = true;
    loadContent();
    return () => {
      mountedRef.current = false;
      if (slideTimerRef.current) clearInterval(slideTimerRef.current);
    };
  }, [loadContent]);

  return {
    announcement,
    slides,
    slideIndex,
    isLoading,
    error,
    isFromCache,
    deviceDeleted,
    refresh: loadContent,
    unpair: async () => {
      await clearStoredDeviceId();
      setDeviceDeleted(true);
    },
  };
}
