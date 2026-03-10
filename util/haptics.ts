/**
 * Provides a unified haptic feedback mechanism for both native and web browsers.
 * Native webviews might not trap this well, but standard Chrome Android and iOS PWAs
 * will fire a small vibration motor tick on `impact(Light)` for a tactile software experience.
 */

export const triggerHaptic = (duration: number = 10) => {
    // Only attempt if the 'vibrate' API exists securely on the navigator
    if (typeof window !== "undefined" && window.navigator && window.navigator.vibrate) {
        try {
            window.navigator.vibrate(duration);
        } catch (e) {
            console.log("Haptics failed to fire", e);
        }
    }
};
