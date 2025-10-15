import React, { createContext, useContext, useState } from "react";

type Theme = "light" | "dark";

interface ThemesContextProps {
  theme: Theme;
  setTheme: React.Dispatch<React.SetStateAction<Theme>>;
  toggleTheme: () => void;
}

const ThemesContext = createContext<ThemesContextProps | undefined>(undefined);

export const ThemesProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [theme, setTheme] = useState<Theme>("dark");

  // const getTheme = async () => {
  //   try {
  //     const response = await fetch(`${apiUrl}/settings`);
  //     const data = await response.json();
  //     if (data) {
  //       setTheme("dark");
  //     } else {
  //       setTheme("dark");
  //     }
  //   } catch (error) {
  //     console.error("Error fetching theme:", error);
  //     setTheme("dark");
  //   }
  // };

  // useEffect(() => {
  //   getTheme();
  // }, []);

  const toggleTheme = () => {
    setTheme((prevTheme) => {
      switch (prevTheme) {
        case "dark":
          return "light";
        case "light":
          return "dark";
        default:
          return "dark";
      }
    });
  };

  return (
    <ThemesContext.Provider
      value={{
        theme,
        setTheme,
        toggleTheme,
      }}
    >
      {children}
    </ThemesContext.Provider>
  );
};

export const useThemesContext = () => {
  const context = useContext(ThemesContext);
  if (!context) {
    throw new Error("useThemesContext must be used within a ThemesProvider");
  }
  return context;
};
