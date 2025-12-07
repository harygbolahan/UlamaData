import { useAutoLock } from '@/contexts/auto-lock-context';
import { useRef } from 'react';
import { View } from 'react-native';

export function ActivityTracker({ children }) {
    const { resetInactivityTimer } = useAutoLock();
    const lastActivityTime = useRef(Date.now());

    const handleInteraction = () => {
        const now = Date.now();
        // Throttle to avoid excessive calls (only reset if 1 second has passed)
        if (now - lastActivityTime.current > 1000) {
            lastActivityTime.current = now;
            resetInactivityTimer();
        }
    };

    return (
        <View 
            style={{ flex: 1 }}
            onStartShouldSetResponderCapture={() => {
                handleInteraction();
                return false; // Don't capture, let children handle
            }}
            onMoveShouldSetResponderCapture={() => {
                handleInteraction();
                return false; // Don't capture, let children handle
            }}
        >
            {children}
        </View>
    );
}
