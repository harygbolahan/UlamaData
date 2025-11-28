import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { Animated, Dimensions, Modal, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from './theme-context';
const { width } = Dimensions.get('window');
const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const showToast = (type = 'info', message, duration = 3500) => {
    const id = Date.now() + Math.random();
    const newToast = { id, type, message, duration };
    
    setToasts((prev) => [...prev, newToast]);

    setTimeout(() => {
      removeToast(id);
    }, duration);
  };

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <Modal
        visible={toasts.length > 0}
        transparent
        animationType="none"
        statusBarTranslucent
        pointerEvents="box-none"
      >
        <View style={styles.toastContainer} pointerEvents="box-none">
          {toasts.map((toast, index) => (
            <Toast
              key={toast.id}
              toast={toast}
              index={index}
              onDismiss={() => removeToast(toast.id)}
            />
          ))}
        </View>
      </Modal>
    </ToastContext.Provider>
  );
}

function Toast({ toast, index, onDismiss }) {
  const { fonts } = useTheme();
  const translateY = useRef(new Animated.Value(-100)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.85)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(translateY, {
        toValue: 0,
        tension: 80,
        friction: 10,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 350,
        useNativeDriver: true,
      }),
      Animated.spring(scale, {
        toValue: 1,
        tension: 80,
        friction: 10,
        useNativeDriver: true,
      }),
    ]).start();

    return () => {
      translateY.setValue(-100);
      opacity.setValue(0);
      scale.setValue(0.85);
    };
  }, []);

  const handleDismiss = () => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -100,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(scale, {
        toValue: 0.85,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => onDismiss());
  };

  const config = getToastConfig(toast.type);

  return (
    <Animated.View
      style={[
        styles.toast,
        {
          opacity,
          transform: [
            { translateY },
            { scale },
          ],
          top: 60 + index * 80,
        },
      ]}
    >
      <Pressable onPress={handleDismiss} style={styles.toastPressable}>
        <LinearGradient
          colors={config.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.toastGradient}
        >
          {/* Left accent bar */}
          <View style={[styles.accentBar, { backgroundColor: config.accentColor }]} />

          {/* Content */}
          <View style={styles.toastContent}>
            {/* Icon */}
            <View style={[styles.iconWrapper, { backgroundColor: config.iconBg }]}>
              <Ionicons name={config.icon} size={24} color={config.iconColor} />
            </View>

            {/* Message */}
            <View style={styles.messageContainer}>
              <Text style={[styles.toastTitle, { fontFamily: fonts.inter.bold }]}>
                {config.title}
              </Text>
              <Text style={[styles.toastMessage, { fontFamily: fonts.inter.regular }]} numberOfLines={2}>
                {toast.message}
              </Text>
            </View>

            {/* Close button */}
            <Pressable onPress={handleDismiss} style={styles.closeButton} hitSlop={8}>
              <Ionicons name="close" size={20} color="rgba(255, 255, 255, 0.8)" />
            </Pressable>
          </View>

          {/* Progress bar */}
          <ProgressBar duration={toast.duration} color={config.accentColor} />
        </LinearGradient>

        {/* Shadow overlay for depth */}
        <View style={styles.shadowOverlay} />
      </Pressable>
    </Animated.View>
  );
}

function ProgressBar({ duration, color }) {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(progress, {
      toValue: 1,
      duration: duration,
      useNativeDriver: false,
    }).start();
  }, [duration]);

  const width = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={styles.progressBarContainer}>
      <Animated.View
        style={[
          styles.progressBarFill,
          {
            width,
            backgroundColor: color,
          },
        ]}
      />
    </View>
  );
}

function getToastConfig(type) {
  const configs = {
    success: {
      title: 'Success',
      icon: 'checkmark-circle',
      iconColor: '#10B981',
      iconBg: 'rgba(16, 185, 129, 0.15)',
      accentColor: '#10B981',
      gradient: ['#1F2937', '#111827'],
    },
    error: {
      title: 'Error',
      icon: 'close-circle',
      iconColor: '#EF4444',
      iconBg: 'rgba(239, 68, 68, 0.15)',
      accentColor: '#EF4444',
      gradient: ['#1F2937', '#111827'],
    },
    warning: {
      title: 'Warning',
      icon: 'alert-circle',
      iconColor: '#F59E0B',
      iconBg: 'rgba(245, 158, 11, 0.15)',
      accentColor: '#F59E0B',
      gradient: ['#1F2937', '#111827'],
    },
    info: {
      title: 'Info',
      icon: 'information-circle',
      iconColor: '#3B82F6',
      iconBg: 'rgba(59, 130, 246, 0.15)',
      accentColor: '#3B82F6',
      gradient: ['#1F2937', '#111827'],
    },
  };

  return configs[type] || configs.info;
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
}

const styles = StyleSheet.create({
  toastContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 999999,
    elevation: 999999,
    pointerEvents: 'box-none',
  },
  toast: {
    position: 'absolute',
    left: 16,
    right: 16,
    maxWidth: width - 32,
    zIndex: 999999,
    elevation: 999999,
  },
  toastPressable: {
    borderRadius: 16,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.4,
        shadowRadius: 16,
      },
      android: {
        elevation: 12,
      },
    }),
  },
  toastGradient: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  accentBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
  },
  toastContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    paddingLeft: 20,
    gap: 12,
  },
  iconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  messageContainer: {
    flex: 1,
    gap: 2,
  },
  toastTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    letterSpacing: 0.3,
  },
  toastMessage: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 13,
    lineHeight: 18,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  progressBarContainer: {
    height: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  progressBarFill: {
    height: '100%',
  },
  shadowOverlay: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 16,
    backgroundColor: 'transparent',
  },
});
