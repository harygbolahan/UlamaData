import api from "@/services/api";
import Constants from "expo-constants";
import * as SecureStore from "expo-secure-store";
import { createContext, useContext, useEffect, useRef, useState } from "react";

const DashboardContext = createContext(null);

const STORAGE_KEY = "user_dashboard_preference";
const THEME_STORAGE_KEY = "user_theme_data";

export const DASHBOARD_TYPES = {
  DEFAULT: "default",
  MODERN: "modern",
  CLASSIC: "classic",
  COMPACT: "compact",
  MINIMAL: "minimal",
};

export const DASHBOARD_INFO = {
  [DASHBOARD_TYPES.DEFAULT]: {
    name: "Default",
    description: "Balanced design with all features",
    icon: "grid-outline",
  },
  [DASHBOARD_TYPES.MODERN]: {
    name: "Modern",
    description: "Sleek and contemporary layout",
    icon: "sparkles-outline",
  },
  [DASHBOARD_TYPES.CLASSIC]: {
    name: "Classic",
    description: "Traditional and familiar design",
    icon: "albums-outline",
  },
  [DASHBOARD_TYPES.COMPACT]: {
    name: "Compact",
    description: "Space-efficient compact layout",
    icon: "phone-portrait-outline",
  },
  [DASHBOARD_TYPES.MINIMAL]: {
    name: "Minimal",
    description: "Clean and simple interface",
    icon: "remove-outline",
  },
};

/**
 * Compares two semantic version strings (e.g. "1.4.4" vs "3.1.2").
 * Returns:
 *  -1 if v1 < v2 (v1 is older than v2)
 *   0 if v1 === v2
 *   1 if v1 > v2 (v1 is newer than v2)
 */
function compareVersions(v1, v2) {
  if (!v1 && !v2) return 0;
  if (!v1) return -1;
  if (!v2) return 1;

  const parts1 = String(v1).split('.').map((p) => parseInt(p, 10) || 0);
  const parts2 = String(v2).split('.').map((p) => parseInt(p, 10) || 0);
  const maxLen = Math.max(parts1.length, parts2.length);

  for (let i = 0; i < maxLen; i++) {
    const num1 = parts1[i] || 0;
    const num2 = parts2[i] || 0;
    if (num1 < num2) return -1;
    if (num1 > num2) return 1;
  }
  return 0;
}

// /get-notification returns the whole notification history, not just what is switched on,
// so the popup has to be chosen deliberately: the newest popup that is not marked off.
const OFF_VALUES = ["off", "inactive", "disabled", "0", "false"];

const isMarkedOff = (item) => {
  for (const key of ["status", "active", "is_active", "enabled"]) {
    if (item?.[key] !== undefined && item?.[key] !== null) {
      return OFF_VALUES.includes(String(item[key]).toLowerCase());
    }
  }
  return false;
};

const pickLatestActivePopup = (items) => {
  const popups = items.filter((item) => item?.msgfor === "popup" && !isMarkedOff(item));
  if (popups.length === 0) return null;
  const time = (item) => {
    const t = new Date(String(item?.updated_at || "").replace(" ", "T")).getTime();
    return isNaN(t) ? 0 : t;
  };
  return popups.reduce((latest, item) => (time(item) > time(latest) ? item : latest));
};

export function DashboardProvider({ children }) {
  const [selectedDashboard, setSelectedDashboard] = useState(
    DASHBOARD_TYPES.DEFAULT,
  );
  const [themeData, setThemeData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [scrollText, setScrollText] = useState("");
  const [popupNotification, setPopupNotification] = useState(null);
  const dismissedPopupIdsRef = useRef(new Set());
  const [needsUpdate, setNeedsUpdate] = useState(false);
  const [updateInfo, setUpdateInfo] = useState({
    needsUpdate: false,
    forceUpdate: false,
    appVersion: null,
    androidAppUrl: null,
    iosAppUrl: null,
    currentVersion: Constants?.expoConfig?.version || '1.0.0',
    isDismissed: false,
  });

  useEffect(() => {
    loadDashboard();
    fetchTheme();
    fetchNotifications();
  }, []);

  const dismissPopupNotification = (popupToDismiss = popupNotification) => {
    const target = popupToDismiss || popupNotification;
    if (target) {
      const notifId = target.id
        ? String(target.id)
        : (target.subject || target.msg || target.message || target.content || "popup");

      dismissedPopupIdsRef.current.add(String(notifId));
    }
    setPopupNotification(null);
  };

  const isPopupValid = (item) => {
    if (!item || typeof item !== "object") return false;
    const hasImage = typeof item.image === "string" && item.image.trim().length > 0;
    const hasText = !!(item.msg || item.message || item.content || item.subject || item.title);
    return hasImage || hasText;
  };

  const fetchNotifications = async (force = false) => {
    try {
      const response = await api.get("/get-notification");
      console.log("Notification Response:", response);
      if (response) {
        const rawData = response?.data || response?.notifications || response;
        let popupItem = null;
        let scrollItem = null;

        if (Array.isArray(rawData)) {
          popupItem = pickLatestActivePopup(rawData);
          scrollItem = rawData.find(
            (item) => item?.msgfor === "scroll" || item?.msgfor === "scrolll",
          );
        } else if (rawData && typeof rawData === "object") {
          if (rawData.msgfor === "popup") {
            popupItem = rawData;
          } else if (
            rawData.msgfor === "scroll" ||
            rawData.msgfor === "scrolll"
          ) {
            scrollItem = rawData;
          }
        }

        if (scrollItem) {
          setScrollText(scrollItem.msg || scrollItem.message || scrollItem.content || "");
        }

        if (popupItem && isPopupValid(popupItem)) {
          const notifId = popupItem.id
            ? String(popupItem.id)
            : (popupItem.subject || popupItem.msg || popupItem.message || popupItem.content || "popup");

          if (force || !dismissedPopupIdsRef.current.has(String(notifId))) {
            setPopupNotification(popupItem);
          }
        } else {
          setPopupNotification(null);
        }
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
    }
  };

  const loadDashboard = async () => {
    try {
      const saved = await SecureStore.getItemAsync(STORAGE_KEY);
      if (saved && Object.values(DASHBOARD_TYPES).includes(saved)) {
        setSelectedDashboard(saved);
      }
    } catch (error) {
      console.error("Error loading dashboard preference:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTheme = async () => {
    try {
      // Try to load cached theme first
      const cachedTheme = await SecureStore.getItemAsync(THEME_STORAGE_KEY);
      if (cachedTheme) {
        setThemeData(JSON.parse(cachedTheme));
      }

      // Fetch fresh theme from API
      const response = await api.getTheme();

      if (response) {
        const data = response.data || response;

        const theme = {
          style: data.style || "default",
          bgColor: data.bg_color || "#002db3",
          textColor: data.text_color || "#ffffff",
          buttonColor: data.button_color || "#002db3",
        };

        setThemeData(theme);

        // Process auto-update check details
        const serverVersion = data.app_version || data.appVersion;
        const isForce = data.force_update === true || data.force_update === 'true' || data.force_update === 1;
        const androidUrl = data.android_app_url || data.androidAppUrl || "https://play.google.com/store/apps/details?id=com.ulamadatanigeria.ulamadata";
        const iosUrl = data.ios_app_url || data.iosAppUrl || "https://apps.apple.com/app/ulamadata/id6760598685";

        const installedVersion = Constants?.expoConfig?.version || '1.0.0';
        const isOlder = serverVersion ? compareVersions(installedVersion, serverVersion) < 0 : false;

        console.log("📱 Auto Update Check:", {
          installedVersion,
          serverVersion,
          isOlder,
          forceUpdate: isForce,
          androidUrl,
          iosUrl,
        });

        setUpdateInfo((prev) => ({
          ...prev,
          needsUpdate: isOlder,
          forceUpdate: isOlder ? isForce : false,
          appVersion: serverVersion || installedVersion,
          androidAppUrl: androidUrl,
          iosAppUrl: iosUrl,
          currentVersion: installedVersion,
        }));
        setNeedsUpdate(isOlder);

        // Update dashboard type if style is different
        if (
          theme.style &&
          Object.values(DASHBOARD_TYPES).includes(theme.style)
        ) {
          setSelectedDashboard(theme.style);
          await SecureStore.setItemAsync(STORAGE_KEY, theme.style);
        }

        // Cache theme data
        await SecureStore.setItemAsync(
          THEME_STORAGE_KEY,
          JSON.stringify(theme),
        );
      }
    } catch (error) {
      console.error("Error fetching theme:", error);
      // Continue with cached or default theme
    }
  };

  const dismissUpdateModal = () => {
    setUpdateInfo((prev) => ({
      ...prev,
      isDismissed: true,
    }));
  };

  const changeDashboard = async (dashboardType) => {
    if (!Object.values(DASHBOARD_TYPES).includes(dashboardType)) {
      console.error("Invalid dashboard type:", dashboardType);
      return;
    }

    setSelectedDashboard(dashboardType);
    try {
      await SecureStore.setItemAsync(STORAGE_KEY, dashboardType);
    } catch (error) {
      console.error("Error saving dashboard preference:", error);
    }
  };

  const refreshTheme = async () => {
    await fetchTheme();
  };

  return (
    <DashboardContext.Provider
      value={{
        selectedDashboard,
        changeDashboard,
        themeData,
        refreshTheme,
        isLoading,
        dashboardInfo: DASHBOARD_INFO,
        scrollText,
        popupNotification,
        setPopupNotification,
        dismissPopupNotification,
        fetchNotifications,
        needsUpdate,
        updateInfo,
        dismissUpdateModal,
      }}
    >
      {children}
    </DashboardContext.Provider>
  );
}

export function useDashboard() {
  const context = useContext(DashboardContext);
  if (!context) {
    throw new Error("useDashboard must be used within DashboardProvider");
  }
  return context;
}
