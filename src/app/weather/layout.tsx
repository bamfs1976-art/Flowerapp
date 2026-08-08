import type { Metadata } from "next";
import "./weather.css";

export const metadata: Metadata = {
  title: "Weather — powered by Vaisala Xweather",
  description:
    "Personal weather dashboard: current conditions, minute-by-minute nowcast, 48-hour and 10-day forecasts, the last 24 hours, historical archives, air quality and radar maps.",
};

export default function WeatherLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <div className="wx">{children}</div>;
}
