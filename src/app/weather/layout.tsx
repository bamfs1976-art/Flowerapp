import type { Metadata } from "next";
import "./weather.css";

export const metadata: Metadata = {
  title: "Weather — powered by Vaisala Xweather",
  description:
    "Personal weather dashboard: current conditions, minute-by-minute nowcast, 48-hour and 10-day forecasts, the last 24 hours, historical archives, air quality and radar maps.",
};

/* Applies a stored dark-mode choice before paint so there is no flash. */
const THEME_SCRIPT = `try{var t=localStorage.getItem("wx:theme");if(t==="dark")document.documentElement.dataset.theme="dark";}catch(e){}`;

export default function WeatherLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
      <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      <div className="wx">{children}</div>
    </>
  );
}
