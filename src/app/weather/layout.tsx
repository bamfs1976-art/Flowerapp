import type { Metadata } from "next";
import "./weather.css";

export const metadata: Metadata = {
  /*
   * Both names in the tab. A middle dot rather than a dash so the two read as
   * one bilingual title instead of a title and a subtitle.
   */
  title: "Swansea Weather · Tywydd Abertawe",
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
      {/*
        Inter for body, Inter Tight for headings and numerals. Loaded by link
        rather than next/font because next/font fetches at build time, which
        fails on a build host with no route to Google; the CSS stack in
        weather.css falls back to the system face if the request never lands.
      */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      {/* eslint-disable-next-line @next/next/no-page-custom-font -- App Router; the rule targets pages/_document. */}
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&family=Inter+Tight:wght@300;400;500;600;700&display=swap"
      />
      <div className="wx">{children}</div>
    </>
  );
}
