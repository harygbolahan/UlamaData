    import { useAutoLock } from '@/contexts/auto-lock-context';
import { Pressable } from 'react-native';

export function ActivityTracker({ children }) {
    const { resetInactivityTimer } = useAutoLock();

    const handleInteraction = () => {
        console.log('Activity detected - resetting timer');
        resetInactivityTimer();
    };

    return (
        <Pressable 
            style={{ flex: 1 }} 
            onStartShouldSetResponder={() => true}
            onResponderGrant={handleInteraction}
            onResponderMove={handleInteraction}
            onTouchStart={handleInteraction}
        >
            {children}
        </Pressable>
    );
}
