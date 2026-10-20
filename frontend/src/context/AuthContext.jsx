
import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

const AuthContext = createContext(null);

const API_BASE_URL = "http://localhost:5000/api/auth";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem("zovia-customer");
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState(
    () => localStorage.getItem("zovia-customer-token") || ""
  );

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!token || !user) {
      localStorage.removeItem("zovia-customer");
      localStorage.removeItem("zovia-customer-token");
    }
  }, [token, user]);

  const saveSession = (data) => {
    if (!data?.token || !data?.user) {
      throw new Error("Invalid authentication response from server");
    }


    localStorage.setItem("zovia-customer-token", data.token);
    localStorage.setItem("zovia-customer", JSON.stringify(data.user));

    setToken(data.token);
    setUser(data.user);
  };

  const request = async (endpoint, details) => {
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(details),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.message || "Authentication failed");
      }

      return data;
    } finally {
      setLoading(false);
    }
  };

  const register = async ({ name, email, password }) => {
    const data = await request("/customer/register", {
      name,
      email,
      password,
    });

    saveSession(data);
    return data;
  };

  const login = async ({ email, password }) => {
    const data = await request("/customer/login", {
      email,
      password,
    });

    saveSession(data);
    return data;
  };

  const logout = () => {
    localStorage.removeItem("zovia-customer-token");
    localStorage.removeItem("zovia-customer");
    setToken("");
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAuthenticated: Boolean(user && token),
        register,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
}
