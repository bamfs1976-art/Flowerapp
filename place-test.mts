import { resolvePlace } from "/workspace/weather/src/lib/xweather";

let bad = 0;
const check = (c: boolean, m: string) => { if (!c) bad++; console.log(c ? "ok  " : "FAIL", m); };

for (const q of ["51.6656,-3.9333", "Swansea", "swansea", "  Swansea  ", "Swansea,UK"]) {
  const s = await resolvePlace(q);
  check(s.ok, `${JSON.stringify(q).padEnd(20)} -> ${s.ok ? `${s.data!.displayName} (${s.data!.lat}, ${s.data!.lon})` : `FAILED: ${s.code} ${s.error}`}`);
}
const miss = await resolvePlace("Nowhereville");
check(!miss.ok && miss.code === "invalid_location",
  `a genuine miss still fails cleanly (${miss.code})`);
console.log(bad ? `\n${bad} FAILED` : "\nall passed");
process.exit(bad ? 1 : 0);
