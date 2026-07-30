const iconTypeForName = (name = "") => {
  const value = name.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();
  if (value.includes("chuot")) return "mouse";
  if (value.includes("ban phim")) return "keyboard";
  if (value.includes("tai nghe")) return "headphones";
  if (value.includes("sac") || value.includes("cap")) return "cable";
  if (value.includes("pin")) return "battery";
  if (value.includes("webcam")) return "webcam";
  if (value.includes("loa")) return "speaker";
  if (value.includes("luu tru")) return "storage";
  if (value.includes("linh kien")) return "chip";
  if (value.includes("man hinh")) return "monitor";
  if (value.includes("laptop")) return "laptop";
  if (value.includes("camera")) return "camera";
  if (value.includes("mang")) return "wifi";
  if (value.includes("den") || value.includes("gia dung")) return "lamp";
  if (value.includes("ban ghe")) return "chair";
  return "box";
};

const paths = {
  mouse: <><rect x="7" y="2.5" width="10" height="19" rx="5" /><path d="M12 2.5v6M9.5 9h5" /></>,
  keyboard: <><rect x="2.5" y="5.5" width="19" height="13" rx="2.5" /><path d="M6 9h.01M9 9h.01M12 9h.01M15 9h.01M18 9h.01M6 12.5h.01M9 12.5h.01M12 12.5h.01M15 12.5h.01M18 12.5h.01M7 16h10" /></>,
  headphones: <><path d="M4 13v-1a8 8 0 0 1 16 0v1" /><path d="M4 13a2 2 0 0 1 2-2h1v8H6a2 2 0 0 1-2-2v-4ZM20 13a2 2 0 0 0-2-2h-1v8h1a2 2 0 0 0 2-2v-4Z" /></>,
  cable: <><path d="M8 7V3M5.5 3h5M16 17v4M13.5 21h5" /><path d="M8 7v3a4 4 0 0 0 4 4 4 4 0 0 1 4 4v-1" /><rect x="5.5" y="7" width="5" height="3" rx="1" /></>,
  battery: <><rect x="3" y="6" width="17" height="12" rx="2" /><path d="M20 10h1.5v4H20M12.5 8.5 9 13h3l-.5 3 3.5-4.5h-3l.5-3Z" /></>,
  webcam: <><rect x="4" y="5" width="16" height="12" rx="3" /><circle cx="12" cy="11" r="3" /><path d="M9 21h6M12 17v4" /></>,
  speaker: <><rect x="6" y="2.5" width="12" height="19" rx="2.5" /><circle cx="12" cy="14.5" r="4" /><circle cx="12" cy="6.5" r="1.2" /></>,
  storage: <><ellipse cx="12" cy="5.5" rx="7.5" ry="3" /><path d="M4.5 5.5v6c0 1.7 3.4 3 7.5 3s7.5-1.3 7.5-3v-6M4.5 11.5v6c0 1.7 3.4 3 7.5 3s7.5-1.3 7.5-3v-6" /></>,
  chip: <><rect x="6" y="6" width="12" height="12" rx="2" /><rect x="9" y="9" width="6" height="6" rx="1" /><path d="M9 2.5V6M15 2.5V6M9 18v3.5M15 18v3.5M2.5 9H6M2.5 15H6M18 9h3.5M18 15h3.5" /></>,
  monitor: <><rect x="2.5" y="3.5" width="19" height="14" rx="2" /><path d="M8 21h8M12 17.5V21" /></>,
  laptop: <><rect x="5" y="3" width="14" height="13" rx="2" /><path d="M3 19h18l-1 2H4l-1-2Z" /></>,
  camera: <><path d="M4 7h3l1.5-2h7L17 7h3a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2Z" /><circle cx="12" cy="13.5" r="4" /></>,
  wifi: <><path d="M3 9a14 14 0 0 1 18 0M6.5 12.5a9 9 0 0 1 11 0M10 16a4 4 0 0 1 4 0" /><circle cx="12" cy="19.5" r="1" fill="currentColor" stroke="none" /></>,
  lamp: <><path d="M8 14h8l-1-8H9l-1 8ZM12 14v6M8.5 21h7" /><path d="M7 3 5.5 1.5M17 3l1.5-1.5M12 2V.5" /></>,
  chair: <><path d="M7 12V5a3 3 0 0 1 3-3h4a3 3 0 0 1 3 3v7M5 12h14v5H5zM7 17v4M17 17v4" /></>,
  box: <><path d="m4 7 8-4 8 4-8 4-8-4Z" /><path d="m4 7 8 4 8-4v10l-8 4-8-4V7ZM12 11v10" /></>,
};

export default function CategoryIcon({ name, className = "h-7 w-7" }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      {paths[iconTypeForName(name)]}
    </svg>
  );
}
