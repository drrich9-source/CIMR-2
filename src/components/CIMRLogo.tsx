import React from "react";

interface CIMRLogoProps {
  className?: string;
  height?: number | string;
  showText?: boolean;
  darkTheme?: boolean;
}

export const CIMRLogo: React.FC<CIMRLogoProps> = ({
  className = "",
  height,
  showText = true,
  darkTheme = false,
}) => {
  // Determine text color based on theme
  const textColor = darkTheme ? "#FFFFFF" : "#6F6F6F";
  const sunColor = "#E7A11A";
  const leafColor = "#5D9B2F";

  // Symmetrical angles for the 10 petals (in degrees)
  const petalAngles = [-81, -63, -45, -27, -9, 9, 27, 45, 63, 81];

  // Subtle drop shadow or white outer glow for dark theme visibility
  const filterStyle = darkTheme
    ? { filter: "drop-shadow(0px 1px 4px rgba(255, 255, 255, 0.15)) drop-shadow(0px 0px 1px rgba(255, 255, 255, 0.4))" }
    : undefined;

  // ViewBox adapts based on whether we display text or just the icon
  const viewBox = showText ? "0 0 500 370" : "80 15 340 155";

  return (
    <div 
      className={`inline-block select-none ${className}`}
      style={{ 
        height: height, 
        aspectRatio: showText ? "500/370" : "340/155",
        ...filterStyle 
      }}
    >
      <svg
        viewBox={viewBox}
        className="w-full h-full"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* --- 1. GREEN PETALS (10 radiating capsules) --- */}
        <g fill={leafColor}>
          {petalAngles.map((angle) => (
            <rect
              key={angle}
              x="238"
              y="22"
              width="24"
              height="100"
              rx="12"
              transform={`rotate(${angle}, 250, 154)`}
            />
          ))}
        </g>

        {/* --- 2. GREEN BASE (Nestles the sun, connects petals) --- */}
        <path
          d="M 100,154 L 218,154 A 32,32 0 0,1 282,154 L 400,154 C 400,140 390,132 375,132 L 125,132 C 110,132 100,140 100,154 Z"
          fill={leafColor}
        />

        {/* --- 3. YELLOW SUN (Semicircle nestled perfectly in the center cutout) --- */}
        <path
          d="M 218,154 A 32,32 0 0,1 282,154 Z"
          fill={sunColor}
        />

        {/* --- 4. CORPORATE TYPOGRAPHY (Only shown when showText is true) --- */}
        {showText && (
          <g textAnchor="middle" className="font-sans">
            {/* CIMR Main Bold Initials */}
            <text
              x="250"
              y="252"
              fill={textColor}
              fontSize="96"
              fontWeight="900"
              style={{ letterSpacing: "1px" }}
            >
              CIMR
            </text>

            {/* Subtitle French Translation */}
            <text
              x="250"
              y="302"
              fill={textColor}
              fontSize="20"
              fontWeight="700"
              style={{ letterSpacing: "4px", fontFamily: "system-ui, sans-serif" }}
            >
              LA RETRAITE DU SECTEUR PRIVÉ
            </text>

            {/* Arabic Text Translation */}
            <text
              x="250"
              y="352"
              fill={textColor}
              fontSize="34"
              fontWeight="bold"
              style={{ fontFamily: '"Noto Sans Arabic", "Cairo", "Amiri", "Scheherazade New", sans-serif' }}
            >
              تقاعد القطاع الخاص
            </text>
          </g>
        )}
      </svg>
    </div>
  );
};
