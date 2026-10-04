import { useCallback, useEffect, useRef, useState, type SetStateAction } from 'react';
import {
  emptyProfile, loadProfile, PROFILE_STORAGE_KEY, serializeProfile,
  type SavedProfile, type StorageStatus,
} from '../lib/profileStorage';

function readInitialProfile() {
  try {
    return loadProfile(window.localStorage);
  } catch {
    return {
      profile: emptyProfile(),
      status: { kind: 'error' as const, message: 'Browser storage is unavailable. Changes cannot be saved. Enable site storage and reload before entering your profile.' },
      blocked: true,
    };
  }
}

export function useSavedProfile() {
  const [initial] = useState(readInitialProfile);
  const [profile, setProfile] = useState(initial.profile);
  const [storageStatus, setStorageStatus] = useState<StorageStatus>(initial.status);
  const lastSaved = useRef(serializeProfile(initial.profile));
  const lastSavedStatus = useRef(initial.status);

  const saveCurrentProfile = useCallback((force = false) => {
    if (initial.blocked) return;
    try {
      const serialized = serializeProfile(profile);
      // Don't overwrite storage on mount or immediately after restoring.
      if (!force && serialized === lastSaved.current) {
        setStorageStatus(lastSavedStatus.current);
        return;
      }
      window.localStorage.setItem(PROFILE_STORAGE_KEY, serialized);
      lastSaved.current = serialized;
      lastSavedStatus.current = { kind: 'saved', message: 'Profile saved on this device.' };
      setStorageStatus(lastSavedStatus.current);
    } catch {
      setStorageStatus({
        kind: 'error',
        message: 'These changes could not be saved. Browser storage may be blocked or full. Your current details are still on this page; do not refresh until saving works.',
      });
    }
  }, [profile, initial.blocked]);

  useEffect(() => { saveCurrentProfile(); }, [saveCurrentProfile]);

  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key === PROFILE_STORAGE_KEY && event.newValue === null) {
        // Respect a confirmed clear in another tab without saving old data back.
        window.location.reload();
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const updateField = <K extends keyof SavedProfile>(field: K, value: SetStateAction<SavedProfile[K]>) => {
    setProfile((current) => ({
      ...current,
      [field]: typeof value === 'function'
        ? (value as (prior: SavedProfile[K]) => SavedProfile[K])(current[field])
        : value,
    }));
  };

  const clearSavedProfile = () => {
    try {
      window.localStorage.removeItem(PROFILE_STORAGE_KEY);
      return true;
    } catch {
      setStorageStatus({ kind: 'error', message: 'The saved profile could not be cleared. Browser storage is unavailable; no profile details have been reset.' });
      return false;
    }
  };

  const retrySaving = () => {
    if (initial.blocked) window.location.reload();
    else saveCurrentProfile(true);
  };

  return { profile, storageStatus, storageBlocked: initial.blocked, updateField, clearSavedProfile, retrySaving };
}