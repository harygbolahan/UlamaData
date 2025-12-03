import { AutoLockWarningModal } from '@/components/auto-lock-warning-modal';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter, useSegments } from 'expo-router';
import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';

const AutoLockContext = createContext();

export function AutoLockProvider({ children }) {
    const router = useRouter();
    const segments = useSegments();
    const [isLocked, setIsLocked] = useState(false);
    const [lockReason, setLockReason] = useState(null); // 'inactivity' or 'background'
    const [showWarning, setShowWarning] = useState(false);
    const [warningCountdown, setWarningCountdown] = useState(10);
    const inactivityTimer = useRef(null);
    const warningTimer = useRef(null);
    const countdownInterval = useRef(null);
    const backgroundTime = useRef(null);
    const appState = useRef(AppState.currentState);
    const INACTIVITY_TIMEOUT = 30000; // 30 seconds
    const WARNING_TIME = 10000; // Show warning 10 seconds before lock
    const BACKGROUND_TIMEOUT = 30000; // 30 seconds

    // Check if user should be locked based on auth settings
    const shouldLock = async () => {
        try {
            const hasSeenOnboarding = await AsyncStorage.getItem('hasSeenOnboarding');
            console.log('Auto-lock: hasSeenOnboarding:', hasSeenOnboarding);
            if (hasSeenOnboarding !== 'true') {
                console.log('Auto-lock: User has not seen onboarding, not locking');
                return false;
            }

            const storedEmail = await AsyncStorage.getItem('user_email');
            console.log('Auto-lock: storedEmail:', storedEmail);
            if (!storedEmail) {
                console.log('Auto-lock: No stored email, not locking');
                return false;
            }

            // Always lock if user has completed onboarding and has logged in before
            // They will be prompted for PIN, biometric, or password based on their settings
            console.log('Auto-lock: Final shouldLock result: true (user has logged in before)');
            return true;
        } catch (error) {
            console.error('Auto-lock: Error checking lock settings:', error);
            return false;
        }
    };

    // Clear all timers
    const clearAllTimers = () => {
        if (inactivityTimer.current) {
            clearTimeout(inactivityTimer.current);
            inactivityTimer.current = null;
        }
        if (warningTimer.current) {
            clearTimeout(warningTimer.current);
            warningTimer.current = null;
        }
        if (countdownInterval.current) {
            clearInterval(countdownInterval.current);
            countdownInterval.current = null;
        }
    };

    // Show warning modal
    const showWarningModal = async () => {
        const shouldLockApp = await shouldLock();
        if (!shouldLockApp) {
            console.log('Auto-lock: Not showing warning - conditions not met');
            return;
        }

        console.log('Auto-lock: Showing warning modal');
        setShowWarning(true);
        setWarningCountdown(10);

        // Start countdown
        let countdown = 10;
        countdownInterval.current = setInterval(() => {
            countdown -= 1;
            setWarningCountdown(countdown);
            
            if (countdown <= 0) {
                clearInterval(countdownInterval.current);
                countdownInterval.current = null;
                handleWarningTimeout();
            }
        }, 1000);
    };

    // Handle warning timeout (lock the app)
    const handleWarningTimeout = async () => {
        console.log('Auto-lock: Warning timeout - locking app');
        setShowWarning(false);
        const shouldLockApp = await shouldLock();
        if (shouldLockApp) {
            setLockReason('inactivity');
            setIsLocked(true);
        }
    };

    // Handle user staying active
    const handleStayActive = () => {
        console.log('Auto-lock: User chose to stay active');
        setShowWarning(false);
        clearAllTimers();
        resetInactivityTimer();
    };

    // Handle user choosing to lock now
    const handleLockNow = () => {
        console.log('Auto-lock: User chose to lock now');
        setShowWarning(false);
        clearAllTimers();
        setLockReason('manual');
        setIsLocked(true);
    };

    // Reset inactivity timer
    const resetInactivityTimer = React.useCallback(() => {
        clearAllTimers();
        setShowWarning(false);

        // Don't start timer if already locked or on auth/splash screens
        const currentPath = segments.join('/');
        const isAuthScreen = currentPath.includes('auth') || 
                           currentPath.includes('splash') || 
                           currentPath.includes('onboarding');
        
        console.log('Auto-lock: Reset timer called. Path:', currentPath, 'isLocked:', isLocked, 'isAuthScreen:', isAuthScreen);
        
        if (isLocked || isAuthScreen) {
            console.log('Auto-lock: Not starting timer (locked or auth screen)');
            return;
        }

        // Start warning timer (shows warning before lock)
        const timeUntilWarning = INACTIVITY_TIMEOUT - WARNING_TIME;
        console.log('Auto-lock: Starting warning timer for', timeUntilWarning, 'ms');
        
        warningTimer.current = setTimeout(() => {
            console.log('Auto-lock: Warning time reached');
            showWarningModal();
        }, timeUntilWarning);
    }, [isLocked, segments]);

    // Handle app state changes (background/foreground)
    useEffect(() => {
        const subscription = AppState.addEventListener('change', async (nextAppState) => {
            if (appState.current.match(/active/) && nextAppState.match(/inactive|background/)) {
                // App is going to background
                console.log('Auto-lock: App going to background');
                backgroundTime.current = Date.now();
                
                // Clear all timers and hide warning when app goes to background
                clearAllTimers();
                setShowWarning(false);
            }

            if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
                // App is coming to foreground
                console.log('Auto-lock: App coming to foreground');
                
                if (backgroundTime.current) {
                    const timeInBackground = Date.now() - backgroundTime.current;
                    console.log('Auto-lock: Time in background:', timeInBackground, 'ms');
                    
                    if (timeInBackground >= BACKGROUND_TIMEOUT) {
                        console.log('Auto-lock: Background timeout exceeded, checking if should lock...');
                        const shouldLockApp = await shouldLock();
                        console.log('Auto-lock: Should lock after background?', shouldLockApp);
                        if (shouldLockApp) {
                            console.log('Auto-lock: Locking due to background timeout');
                            setLockReason('background');
                            setIsLocked(true);
                        } else {
                            console.log('Auto-lock: Not locking - conditions not met');
                        }
                    } else {
                        console.log('Auto-lock: Background time not exceeded yet');
                    }
                    
                    backgroundTime.current = null;
                }
                
                // Reset inactivity timer when app comes back
                resetInactivityTimer();
            }

            appState.current = nextAppState;
        });

        return () => {
            subscription.remove();
        };
    }, [isLocked, segments, resetInactivityTimer]);

    // Handle lock state changes
    useEffect(() => {
        if (isLocked) {
            // Clear all timers when locked
            clearAllTimers();
            setShowWarning(false);

            // Navigate to appropriate lock screen
            const currentPath = segments.join('/');
            const isAlreadyOnAuthScreen = currentPath.includes('auth') || 
                                         currentPath.includes('splash');
            
            if (!isAlreadyOnAuthScreen) {
                console.log('Auto-lock: Navigating to splash screen');
                router.replace('/splash');
            }
        } else {
            // Start inactivity timer when unlocked
            resetInactivityTimer();
        }
    }, [isLocked, resetInactivityTimer]);

    // Start inactivity timer on mount and when segments change
    useEffect(() => {
        console.log('Auto-lock: Segments changed:', segments.join('/'));
        resetInactivityTimer();

        return () => {
            clearAllTimers();
        };
    }, [segments, resetInactivityTimer]);

    const unlock = React.useCallback(() => {
        console.log('Auto-lock: Unlocking app');
        setIsLocked(false);
        setLockReason(null);
        resetInactivityTimer();
    }, [resetInactivityTimer]);

    const lock = React.useCallback((reason = 'manual') => {
        console.log('Auto-lock: Manually locking app');
        setLockReason(reason);
        setIsLocked(true);
    }, []);

    return (
        <AutoLockContext.Provider
            value={{
                isLocked,
                lockReason,
                unlock,
                lock,
                resetInactivityTimer,
            }}
        >
            {children}
            <AutoLockWarningModal
                visible={showWarning}
                secondsRemaining={warningCountdown}
                onStayActive={handleStayActive}
                onLockNow={handleLockNow}
            />
        </AutoLockContext.Provider>
    );
}

export function useAutoLock() {
    const context = useContext(AutoLockContext);
    if (!context) {
        throw new Error('useAutoLock must be used within AutoLockProvider');
    }
    return context;
}
