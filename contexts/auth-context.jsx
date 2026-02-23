import api from "@/services/api";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, useContext, useEffect, useState } from "react";
import { useToast } from "./toast-context";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    loadStoredAuth();
  }, []);

  const loadStoredAuth = async () => {
    try {
      const [storedToken, storedUser] = await Promise.all([
        AsyncStorage.getItem("auth_token"),
        AsyncStorage.getItem("user_data"),
      ]);

      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
        setIsAuthenticated(true);
        await api.setToken(storedToken);
      }
    } catch (error) {
      console.error("Error loading auth data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData) => {
    try {
      const response = await api.register(userData);

      if (response.token && response.user) {
        await saveAuthData(response.token, response.user);
        showToast("success", "Registration successful!");
        return { success: true, data: response };
      }

      return { success: false, message: response.message };
    } catch (error) {
      showToast("error", error.message || "Registration failed");
      return { success: false, message: error.message };
    }
  };

  const login = async (credentials, skipToast = false) => {
    try {
      const response = await api.login(credentials);

      if (response.token && response.user) {
        await saveAuthData(response.token, response.user);
        if (!skipToast) {
          showToast("success", "Login successful!");
        }
        return { success: true, data: response };
      }

      return { success: false, message: response.message };
    } catch (error) {
      if (!skipToast) {
        showToast("error", error.message || "Login failed");
      }
      return { success: false, message: error.message };
    }
  };

  const logout = async () => {
    try {
      // Only clear auth token, keep user data for quick re-login
      await AsyncStorage.removeItem("auth_token");

      setToken(null);
      setUser(null);
      setIsAuthenticated(false);
      await api.setToken(null);

      showToast("success", "Logged out successfully");
    } catch (error) {
      console.error("Error during logout:", error);
      showToast("error", "Logout failed");
    }
  };

  const saveAuthData = async (authToken, userData) => {
    try {
      await Promise.all([
        AsyncStorage.setItem("auth_token", authToken),
        AsyncStorage.setItem("user_data", JSON.stringify(userData)),
        AsyncStorage.setItem("email", userData.email || ""),
        AsyncStorage.setItem("name", userData.name || userData.username || ""),
      ]);

      setToken(authToken);
      setUser(userData);
      setIsAuthenticated(true);
      await api.setToken(authToken);
    } catch (error) {
      console.error("Error saving auth data:", error);
      throw error;
    }
  };

  const updateUser = async (userData) => {
    try {
      await AsyncStorage.setItem("user_data", JSON.stringify(userData));
      setUser(userData);
    } catch (error) {
      console.error("Error updating user data:", error);
    }
  };

  const changePin = async (password, newPin) => {
    try {
      const response = await api.post("/change-pin", {
        password,
        newPin,
      });

      if (response.status === "success") {
        showToast("success", response.message || "PIN changed successfully");
        return { success: true, data: response };
      }

      return { success: false, message: response.message };
    } catch (error) {
      showToast("error", error.message || "Failed to change PIN");
      return { success: false, message: error.message };
    }
  };

  const submitKyc = async (kycData) => {
    try {
      // Create FormData for multipart/form-data
      const formData = new FormData();
      formData.append("dob", kycData.dob);
      formData.append("idType", kycData.idType);
      formData.append("idNumber", kycData.idNumber);
      formData.append("phone", kycData.phone);
      formData.append("email", kycData.email);
      formData.append("state", kycData.state);
      formData.append("city", kycData.city);
      formData.append("address", kycData.address);
      formData.append("surname", kycData.surname);

      // Append image file
      if (kycData.image) {
        const imageUri = kycData.image.uri;
        const filename = imageUri.split("/").pop();
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : "image/jpeg";

        formData.append("image", {
          uri: imageUri,
          name: filename,
          type: type,
        });
      }

      const response = await api.postFormData("/kyc/submit", formData);

      if (response.status === "success") {
        showToast("success", response.message || "KYC submitted successfully");
        // Update user data if returned
        if (response.user) {
          await updateUser(response.user);
        }
        return { success: true, data: response };
      }

      return { success: false, message: response.message };
    } catch (error) {
      showToast("error", error.message || "Failed to submit KYC");
      return { success: false, message: error.message };
    }
  };

  const getLevels = async () => {
    try {
      const response = await api.get("/get-levels");

      if (response.levels) {
        return { success: true, data: response };
      }

      return { success: false, message: response.message };
    } catch (error) {
      showToast("error", error.message || "Failed to fetch levels");
      return { success: false, message: error.message };
    }
  };

  const upgradeLevel = async (levelName) => {
    try {
      const response = await api.post("/upgrade-level", {
        level: levelName,
      });

      if (
        response.status === "success" ||
        response.message?.includes("successfully")
      ) {
        showToast(
          "success",
          response.message || "Account upgraded successfully",
        );
        // Update user data if returned
        if (response.user) {
          await updateUser(response.user);
        }
        return { success: true, data: response };
      }

      // Handle error messages
      const errorMessage = response.message || "Failed to upgrade account";
      showToast("error", errorMessage);
      return { success: false, message: errorMessage };
    } catch (error) {
      const errorMessage = error.message || "Failed to upgrade account";
      showToast("error", errorMessage);
      return { success: false, message: errorMessage };
    }
  };

  const getReferralData = async () => {
    try {
      const response = await api.get("/referral");

      if (response) {
        // Map API response to expected format
        const mappedData = {
          referralCode: response.refer_code?.toString() || "N/A",
          referralLink: response.referral_link || "",
          totalReferrals: response.total_referrals || response.count || 0,
          totalEarnings: response.earnings || "0",
          referrals: response.referrals || [],
        };
        console.log("Referral Data:", mappedData);
        return { success: true, data: mappedData };
      }

      return { success: false, message: response.message };
    } catch (error) {
      showToast("error", error.message || "Failed to fetch referral data");
      return { success: false, message: error.message };
    }
  };

  const refreshUser = async () => {
    try {
      const response = await api.get("/get-user");

      // The API returns user data directly, not nested in a user property
      if (response && response.id) {
        // Map wallet to balance and keep cashback
        const userData = {
          ...response,
          balance: response.wallet || "0",
          cashback: response.cashback || "0",
        };
        await updateUser(userData);
        return { success: true, data: userData };
      }

      return {
        success: false,
        message: response.message || "Failed to fetch user data",
      };
    } catch (error) {
      console.error("Error refreshing user data:", error);
      return { success: false, message: error.message };
    }
  };

  const getSupportData = async () => {
    try {
      const response = await api.get("/support");

      if (response && response.socialMedia) {
        return { success: true, data: response };
      }

      return {
        success: false,
        message: response.message || "Failed to fetch support data",
      };
    } catch (error) {
      console.error("Error fetching support data:", error);
      return { success: false, message: error.message };
    }
  };

  const withdrawCashback = async (amount, pin) => {
    try {
      const response = await api.post("/withdraw-cashback", {
        amount: amount.toString(),
        pin,
      });

      if (response.status === "success") {
        showToast(
          "success",
          response.message || "Cashback successfully transferred to wallet",
        );
        // Update user data with new balances
        if (response.cashback !== undefined && response.wallet !== undefined) {
          const updatedUser = {
            ...user,
            cashback: response.cashback.toString(),
            balance: response.wallet.toString(),
            wallet: response.wallet.toString(),
          };
          await updateUser(updatedUser);
        }
        return { success: true, data: response };
      }

      return { success: false, message: response.message };
    } catch (error) {
      showToast("error", error.message || "Failed to withdraw cashback");
      return { success: false, message: error.message };
    }
  };

  const deleteAccount = async (password) => {
    try {
      const response = await api.post("/user/delete", {
        password,
      });

      if (response.status === "success") {
        showToast(
          "success",
          response.message || "Account deactivated successfully",
        );
        return { success: true, data: response };
      }

      return { success: false, message: response.message };
    } catch (error) {
      showToast("error", error.message || "Failed to deactivate account");
      return { success: false, message: error.message };
    }
  };

  const value = {
    user,
    token,
    isLoading,
    isAuthenticated,
    register,
    login,
    logout,
    updateUser,
    changePin,
    submitKyc,
    getLevels,
    upgradeLevel,
    getReferralData,
    refreshUser,
    getSupportData,
    withdrawCashback,
    deleteAccount,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
