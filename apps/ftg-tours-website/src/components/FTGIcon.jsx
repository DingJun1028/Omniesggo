import { useMemo } from "react";

const iconPaths = {
  leaf: <><path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.4 19 2c1 2 2 4.1 2 4.1S22 5.9 19 9c-3 5-1 7-1 7z" /><path d="M2 21c0-3 1.8-5.3 4-6.5" /></>,
  users: <><circle cx="9" cy="8" r="3" /><path d="M3 20a3 3 0 0 1 3-3h12a3 3 0 0 1 3 3" /><path d="M16 6a3 3 0 0 1 3 3" /><path d="M16 12a3 3 0 0 1 3 3" /></>,
  calendar: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M16 3v4M8 3v4M3 10h18" /></>,
  gift: <><rect x="3" y="8" width="18" height="4" rx="1" /><path d="M12 8v13" /><path d="M19 12c0-2-1.5-3-3-3H8l8-4-8-4z" /></>,
  link: <><path d="M10 13a2 2 0 0 0 2 2" /><path d="M14 13a2 2 0 0 0 2 2" /><path d="M9 12h6" /><path d="M12 3v2" /><path d="M12 19v2" /><path d="M5 12h14" /></>,
  compass: <><circle cx="12" cy="12" r="9" /><path d="M15.5 8.5l-2 5-5 2" /></>,
  mountain: <><path d="M3 20l6-10 4 6 2-3 8 7z" /></>,
  shield: <><path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6z" /><path d="M9 12l2 2 4-4" /></>,
  star: <><path d="M12 3l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.8 6.8 19.2l1-5.8-4.3-4.1 5.9-.9z" /></>,
  clipboard: <><rect x="4" y="4" width="16" height="16" rx="2" /><path d="M9 4l6 3-6 3V4z" /></>,
  map: <><path d="M12 21s-7-6.5-7-11a7 7 0 0 1 14 0c0 4.5-7 11-7 11z" /><circle cx="12" cy="10" r="2.5" /></>,
  navigation: <><polygon points="3 5 21 5 21 19 3 19" /><path d="M6 9h12M6 15h12" /></>,
  safety: <><path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6z" /><path d="M9 12l2 2 4-4" /></>,
  camera: <><path d="M3 9l9-6 9 6-9 6z" /><circle cx="12" cy="12" r="3" /><path d="M12 19v-5" /></>,
  smile: <><circle cx="12" cy="12" r="9" /><path d="M8 14s1.5 2 3 2 3-2 3-2" /><path d="M9 9h6" /></>,
  award: <><circle cx="12" cy="8" r="6" /><path d="M8.2 13.5l2.5 2.5L16 9.4" /></>,
  sustainable: <><path d="M12 3c2.5 2.5 2.5 14 0 17-2.5-3-2.5-14.5 0-17z" /><path d="M12 3c-2.5 2.5-2.5 14 0 17" /><path d="M12 20c2.5-1.5 2.5-5 0-7" /></>,
  cup: <><path d="M16 11.5a4 4 0 0 1-6-2.5V7h6v2.5a4 4 0 0 1-2 6.5z" /><path d="M12 15h6" /></>,
  heart: <><path d="M12 21c-4-3-6-6.5-6-10A6 6 0 0 1 12 3a6 6 0 0 1 6 10c0 3.5-2 7-6 10z" /></>,
  local: <><path d="M12 21s-7-5.5-7-11a7 7 0 0 1 14 0c0 5.5-7 11-7 11z" /><circle cx="12" cy="10" r="2.5" /></>,
  sun: <><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2" /></>,
};

export default function FTGIcon({ name, size = 24, className = "" }) {
  const paths = useMemo(() => iconPaths[name], [name]);
  if (!paths) return null;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {paths}
    </svg>
  );
}
