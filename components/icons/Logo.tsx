export const Logo = () => (
  <svg
    width="180"
    height="40"
    viewBox="0 0 180 40"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <defs>
      <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#5DADE2" />
        <stop offset="100%" stopColor="#1ABC9C" />
      </linearGradient>
    </defs>
    <text
      x="10"
      y="28"
      fill="url(#gradient)"
      style={{
        fontSize: "28px",
        fontFamily: "Arial",
        fontWeight: "bold",
      }}
    >
      Social Flow
    </text>
  </svg>
);
