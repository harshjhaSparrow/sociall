/// <reference types="vite/client" />
import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

const publicVapidKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;

function urlBase64ToUint8Array(base64String: string) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
        .replace(/\-/g, '+')
        .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

export function usePushNotifications() {
    const { user } = useAuth();
    const [isSupported, setIsSupported] = useState(false);
    const [isSubscribed, setIsSubscribed] = useState(false);

    useEffect(() => {
        if ('serviceWorker' in navigator && 'PushManager' in window) {
            setIsSupported(true);
        }
    }, []);

    const subscribe = async () => {
        if (!isSupported || !user) return false;

        try {
            // 1. Request Permission
            const permission = await Notification.requestPermission();
            if (permission !== 'granted') {
                throw new Error('Notification permission not granted');
            }

            // 2. Register Service Worker (Make sure your SW exists)
            const registration = await navigator.serviceWorker.ready;

            // 3. Subscribe to PushManager
            const existingSubscription = await registration.pushManager.getSubscription();
            if (existingSubscription) {
                setIsSubscribed(true);
                // It's safe to send it again to ensure backend has it.
                await api.push.subscribe(user.uid, existingSubscription);
                return true;
            }

            console.log("VAPID Key from env:", publicVapidKey);

            if (!publicVapidKey) {
                console.error("VAPID Public Key is missing from Vite Environment Variables!");
            }

            const applicationServerKey = urlBase64ToUint8Array(publicVapidKey);
            console.log("Generated Uint8Array length:", applicationServerKey.length);

            const subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: applicationServerKey
            });

            // 4. Send Subscription to Backend
            await api.push.subscribe(user.uid, subscription);
            setIsSubscribed(true);
            return true;

        } catch (error) {
            console.error('Failed to subscribe to push notifications:', error);
            return false;
        }
    };

    return { isSupported, isSubscribed, subscribe };
}
