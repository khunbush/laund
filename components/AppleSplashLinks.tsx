// iOS launch (startup) images. Each entry maps a device's CSS width/height +
// device-pixel-ratio to the matching physical PNG in /public/splash. iOS only
// applies an image when the media query matches exactly, so per-device entries
// are required. Rendering these <link> tags in the tree lets Next/React hoist
// them into <head>.

// [cssW, cssH, dpr] — physical file is cssW*dpr x cssH*dpr
const DEVICES: [number, number, number][] = [
  [320, 568, 2],
  [375, 667, 2],
  [414, 736, 3],
  [375, 812, 3],
  [390, 844, 3],
  [393, 852, 3],
  [414, 896, 2],
  [414, 896, 3],
  [428, 926, 3],
  [430, 932, 3],
  [402, 874, 3],
  [440, 956, 3],
];

export function AppleSplashLinks() {
  const seen = new Set<string>();
  return (
    <>
      {DEVICES.map(([cssW, cssH, dpr]) => {
        const w = cssW * dpr;
        const h = cssH * dpr;
        const key = `${w}x${h}`;
        if (seen.has(key)) return null;
        seen.add(key);
        const media =
          `(device-width: ${cssW}px) and (device-height: ${cssH}px) ` +
          `and (-webkit-device-pixel-ratio: ${dpr}) and (orientation: portrait)`;
        return (
          <link
            key={key}
            rel="apple-touch-startup-image"
            media={media}
            href={`/splash/apple-splash-${w}x${h}.png`}
          />
        );
      })}
    </>
  );
}
