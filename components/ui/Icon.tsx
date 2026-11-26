import type { SVGProps } from "react";

const paths = {
  arrow: <path d="M5 12h14m-6-6 6 6-6 6" />,
  check: <path d="m5 12.5 4.5 4.5L19 7.5" />,
  calendar: (
    <>
      <rect x="3.5" y="5" width="17" height="15.5" rx="2.5" />
      <path d="M3.5 10h17M8 3v4M16 3v4" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 2" />
    </>
  ),
  pin: (
    <>
      <path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11Z" />
      <circle cx="12" cy="10" r="2.3" />
    </>
  ),
  sparkle: <path d="M12 3.5c.6 3.9 2.6 5.9 6.5 6.5-3.9.6-5.9 2.6-6.5 6.5-.6-3.9-2.6-5.9-6.5-6.5 3.9-.6 5.9-2.6 6.5-6.5ZM18.5 15.5c.25 1.6 1 2.35 2.5 2.5-1.5.25-2.25 1-2.5 2.5-.25-1.5-1-2.25-2.5-2.5 1.5-.15 2.25-.9 2.5-2.5Z" />,
  shield: (
    <>
      <path d="M12 3.5 5 6v5.5c0 4.4 3 7.6 7 9 4-1.4 7-4.6 7-9V6l-7-2.5Z" />
      <path d="m9 12 2 2 4-4" />
    </>
  ),
  leaf: <path d="M5 19c0-8 5.5-13 15-14-1 9.5-6 15-14 15m0-1 7-7" />,
  heart: <path d="M12 19.5s-7.5-4.6-7.5-10A4.2 4.2 0 0 1 12 7a4.2 4.2 0 0 1 7.5 2.5c0 5.4-7.5 10-7.5 10Z" />,
  user: (
    <>
      <circle cx="12" cy="8.5" r="3.8" />
      <path d="M4.5 20c1.2-3.6 4-5.3 7.5-5.3s6.3 1.7 7.5 5.3" />
    </>
  ),
  phone: <path d="M6.5 3.5h3l1.5 4-2 1.3a10.5 10.5 0 0 0 6.2 6.2l1.3-2 4 1.5v3a2 2 0 0 1-2.2 2A16.5 16.5 0 0 1 4.5 5.7a2 2 0 0 1 2-2.2Z" />,
  mail: (
    <>
      <rect x="3.5" y="5.5" width="17" height="13" rx="2.5" />
      <path d="m4 7 8 6 8-6" />
    </>
  ),
  menu: <path d="M4 7h16M4 12h16M4 17h10" />,
  close: <path d="M6 6l12 12M18 6 6 18" />,
  chevron: <path d="m8 10 4 4 4-4" />,
  chevronRight: <path d="m10 8 4 4-4 4" />,
  chevronLeft: <path d="m14 8-4 4 4 4" />,
  plus: <path d="M12 5v14M5 12h14" />,
  trash: <path d="M5 7h14M10 7V5h4v2m-7 0 1 12h8l1-12" />,
  edit: <path d="m14.5 5.5 4 4L9 19H5v-4l9.5-9.5Z" />,
  search: (
    <>
      <circle cx="11" cy="11" r="6.5" />
      <path d="m16 16 4 4" />
    </>
  ),
  info: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 11v5M12 8h.01" />
    </>
  ),
  eye: (
    <>
      <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" />
      <circle cx="12" cy="12" r="2.8" />
    </>
  ),
  logout: <path d="M14 4h4.5A1.5 1.5 0 0 1 20 5.5v13a1.5 1.5 0 0 1-1.5 1.5H14M10 16l-4-4 4-4M6 12h10" />,
  refresh: <path d="M19.5 12A7.5 7.5 0 1 1 17 6.4M19.5 4v4.5H15" />,
  route: (
    <>
      <circle cx="6" cy="18" r="2" />
      <circle cx="18" cy="6" r="2" />
      <path d="M8 18h7.5a3 3 0 0 0 0-6h-7a3 3 0 0 1 0-6H16" />
    </>
  ),
  settings: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 3.5v2.2M12 18.3v2.2M20.5 12h-2.2M5.7 12H3.5M18 6l-1.6 1.6M7.6 16.4 6 18M18 18l-1.6-1.6M7.6 7.6 6 6" />
    </>
  ),
  tag: (
    <>
      <path d="M3.5 12.2V4.5a1 1 0 0 1 1-1h7.7l8.3 8.3-8.7 8.7-8.3-8.3Z" />
      <circle cx="8" cy="8" r="1.4" />
    </>
  ),
  list: <path d="M9 6.5h11M9 12h11M9 17.5h11M4.5 6.5h.01M4.5 12h.01M4.5 17.5h.01" />,
  instagram: (
    <>
      <rect x="3.5" y="3.5" width="17" height="17" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <path d="M17.3 6.7h.01" />
    </>
  ),
  facebook: <path d="M14 8.5h2.5V5H14a3.5 3.5 0 0 0-3.5 3.5V11H8v3.5h2.5V21H14v-6.5h2.5L17 11h-3V9a.5.5 0 0 1 .5-.5Z" />,
  youtube: (
    <>
      <rect x="2.5" y="5.5" width="19" height="13" rx="4" />
      <path d="m10 9.5 5 2.5-5 2.5v-5Z" />
    </>
  ),
  tiktok: <path d="M14 3.5v11.25a3.25 3.25 0 1 1-3.25-3.25M14 3.5c.4 2.5 2 4 4.5 4.3" />,
  upload: <path d="M12 16V4m-5 5 5-5 5 5M4.5 16.5v2a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2v-2" />,
  image: (
    <>
      <rect x="3.5" y="4.5" width="17" height="15" rx="2.5" />
      <circle cx="9" cy="10" r="1.8" />
      <path d="m20.5 16-5-5-9.5 8.5" />
    </>
  ),
  doc: <path d="M7 3.5h7l4 4v13H7a1.5 1.5 0 0 1-1.5-1.5V5A1.5 1.5 0 0 1 7 3.5Zm6.5 0V8H18M9 12.5h6M9 16h6" />,
  palette: (
    <>
      <path d="M12 3.5a8.5 8.5 0 1 0 0 17c1 0 1.5-.7 1.5-1.5 0-1.2-1-1.5-1-2.5s.8-1.5 1.8-1.5H16a4.5 4.5 0 0 0 4.5-4.5c0-4-3.8-7-8.5-7Z" />
      <circle cx="8" cy="11" r="1" />
      <circle cx="11" cy="7.5" r="1" />
      <circle cx="15.5" cy="8" r="1" />
    </>
  ),
  layout: (
    <>
      <rect x="3.5" y="4" width="17" height="16" rx="2" />
      <path d="M3.5 9h17M9.5 9v11" />
    </>
  ),
  heartPulse: <path d="M3.5 12h4l2-4 3 8 2-4h6" />,
  grip: <path d="M9 6h.01M15 6h.01M9 12h.01M15 12h.01M9 18h.01M15 18h.01" />,
  arrowUp: <path d="M12 19V5m-6 6 6-6 6 6" />,
  arrowDown: <path d="M12 5v14m6-6-6 6-6-6" />,
  star: <path d="m12 3.8 2.45 5 5.5.8-3.98 3.88.94 5.47L12 16.37l-4.91 2.58.94-5.47L4.05 9.6l5.5-.8L12 3.8Z" />,
  accessible: (
    <>
      <circle cx="12.5" cy="4.5" r="1.5" />
      <path d="M12 7.5v6h5l2 5.5M12 10.5h4.5" />
      <path d="M9.2 10.3a5.5 5.5 0 1 0 6.9 7.2" />
    </>
  ),
  directions: <path d="m12 2.8 9.2 9.2-9.2 9.2L2.8 12 12 2.8ZM9.5 14v-2.5a1 1 0 0 1 1-1h4M13 8.5l2 2-2 2" />,
  quote: <path d="M10 7.5C7 8.3 5.5 10.6 5.5 14v3h4.5v-4.5H7.6c.2-2 1.1-3.2 2.9-3.9L10 7.5Zm8 0c-3 .8-4.5 3.1-4.5 6.5v3H18v-4.5h-2.4c.2-2 1.1-3.2 2.9-3.9L18 7.5Z" />,
  copy: <path d="M9 9h10.5v10.5H9V9Zm-4.5 6V4.5H15" />,
  eyeOff: <path d="M3.5 3.5 20.5 20.5M10.6 6.1A9.8 9.8 0 0 1 12 6c5 0 8.5 4.5 9.5 6-.5.8-1.6 2.2-3.1 3.5M6.6 7.7C4.6 9 3.1 10.9 2.5 12c1 1.5 4.5 6 9.5 6 1.5 0 2.9-.4 4.1-1M9.9 9.9a3 3 0 0 0 4.2 4.2" />,
  globe: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M3.5 12h17M12 3.5c2.3 2.4 3.5 5.2 3.5 8.5s-1.2 6.1-3.5 8.5c-2.3-2.4-3.5-5.2-3.5-8.5S9.7 5.9 12 3.5Z" />
    </>
  ),
  yelp: <path d="M12.5 3.5v8L7 6.5M13.5 13.5l6 1.5-3 4.5M11 14l-4.5 4M10.5 12 4.5 11l1-4" />,
  whatsapp: (
    <path
      fill="currentColor"
      stroke="none"
      d="M12.04 2.5a9.43 9.43 0 0 0-8.1 14.26L2.5 21.5l4.86-1.4A9.43 9.43 0 1 0 12.04 2.5Zm0 17.2a7.78 7.78 0 0 1-3.97-1.09l-.28-.17-2.88.83.84-2.8-.18-.29a7.78 7.78 0 1 1 6.47 3.52Zm4.27-5.83c-.23-.12-1.38-.68-1.6-.76-.21-.08-.37-.12-.53.12-.15.23-.6.76-.74.91-.14.16-.27.18-.5.06a6.4 6.4 0 0 1-3.18-2.78c-.24-.41.24-.38.69-1.27.08-.16.04-.29-.02-.41-.06-.12-.53-1.27-.72-1.74-.19-.46-.38-.39-.53-.4h-.45a.87.87 0 0 0-.63.29 2.63 2.63 0 0 0-.82 1.96 4.57 4.57 0 0 0 .96 2.43c.12.16 1.66 2.54 4.03 3.56 1.5.65 2.08.7 2.83.59.46-.07 1.38-.56 1.58-1.11.2-.55.2-1.02.14-1.11-.06-.1-.21-.16-.45-.28Z"
    />
  ),
} as const;

export type IconName = keyof typeof paths;

export function Icon({ name, size = 20, className, ...rest }: { name: IconName; size?: number } & SVGProps<SVGSVGElement>) {
  return (
    <svg
      className={name === "arrow" ? `icon-arrow ${className ?? ""}` : className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.4}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...rest}
    >
      {paths[name]}
    </svg>
  );
}
