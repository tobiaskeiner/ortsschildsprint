interface MapMarkerIconProps {
  className?: string;
  style?: React.CSSProperties;
}

const MapMarkerIcon: React.FC<MapMarkerIconProps> = ({ className, style }) => {
  return (
    <svg
      aria-hidden="true"
      className={className}
      focusable="false"
      height="40"
      viewBox="0 0 24 24"
      width="40"
      style={style}
    >
      <path
        d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"
        fill="currentColor"
      />
      <circle cx="12" cy="9" r="2.5" fill="#fff" />
    </svg>
  );
};

export default MapMarkerIcon;
