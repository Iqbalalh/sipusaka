"use client";

import type React from "react";
import { createContext, useState, useContext, useEffect } from "react";
import { ConfigProvider, theme as antdTheme } from "antd";

type Theme = "light" | "dark";

type ThemeContextType = {
  theme: Theme;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [theme, setTheme] = useState<Theme>("light");
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") as Theme | null;
    const initialTheme = savedTheme || "light";

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTheme(initialTheme);
    setIsInitialized(true);
  }, []);

  useEffect(() => {
    if (!isInitialized) return;

    localStorage.setItem("theme", theme);

    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme, isInitialized]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      <ConfigProvider
        theme={{
          algorithm:
            theme === "dark"
              ? antdTheme.darkAlgorithm
              : antdTheme.defaultAlgorithm,

          token: {
            // 🎨 Brand Color
            colorPrimary: "#1677FF",          // brand-400
            colorPrimaryHover: "#4096FF",     // brand-300
            colorPrimaryActive: "#0958D9",    // brand-500
            colorPrimaryBg: "#BAE0FF",        // brand-50
            colorPrimaryBgHover: "#E6F4FF",   // brand-25
            colorPrimaryBorder: "#003EB3",    // brand-600
            colorPrimaryBorderHover: "#002C8C", // brand-700

            // 🧩 UI Consistency
            borderRadius: 8,
            fontFamily: "var(--font-outfit)",
          },

          components: {
            Button: {
              borderRadius: 8,
              fontWeight: 500,
            },
            Input: {
              borderRadius: 8,
            },
            Table: {
              headerBg: theme === "dark" ? "#001D66" : "#E6F4FF",
              headerColor: theme === "dark" ? "#E6F4FF" : "#002C8C",
            },
          },
        }}
      >
        {children}
      </ConfigProvider>
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};
