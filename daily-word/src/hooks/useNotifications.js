import { useCallback } from 'react';
import useAppStore from '../store/appStore';
import { supabase } from '../lib/supabase';

export function useNotifications() {
  const { setNotificationPermission } = useAppStore();

  const checkPermission = useCallback(() => {
    if (!('Notification' in window)) return 'unsupported';
    setNotificationPermission(Notification.permission);
    return Notification.permission;
  }, [setNotificationPermission]);

  const requestPermission = useCallback(async () => {
    if (!('Notification' in window)) return 'unsupported';
    const result = await Notification.requestPermission();
    setNotificationPermission(result);
    return result;
  }, [setNotificationPermission]);

  const registerServiceWorker = useCallback(async () => {
    if (!('serviceWorker' in navigator)) return null;
    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      return registration;
    } catch (error) {
      console.error('SW registration failed:', error);
      return null;
    }
  }, []);

  const subscribeToPush = useCallback(async () => {
    const registration = await registerServiceWorker();
    if (!registration) return null;

    const vapidKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
    if (!vapidKey) {
      console.warn('VAPID key not configured');
      return null;
    }

    try {
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey),
      });

      // Save subscription to Supabase
      const { user } = useAppStore.getState();
      if (user) {
        await supabase.from('profiles').update({
          push_subscription: JSON.stringify(subscription),
        }).eq('id', user.id);
      }

      return subscription;
    } catch (error) {
      console.error('Push subscription failed:', error);
      return null;
    }
  }, [registerServiceWorker]);

  const scheduleReminder = useCallback(async (time) => {
    const { user } = useAppStore.getState();
    if (!user) return;
    await supabase.from('profiles').update({ reminder_time: time }).eq('id', user.id);
  }, []);

  return { checkPermission, requestPermission, registerServiceWorker, subscribeToPush, scheduleReminder };
}

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
