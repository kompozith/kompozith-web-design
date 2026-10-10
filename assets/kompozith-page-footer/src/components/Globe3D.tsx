import React, { useState, useEffect, useRef, useMemo } from "react";
import { Globe, MapPin, Compass, RotateCcw, Info } from "lucide-react";

interface Point3D {
  lat: number;
  lon: number;
  isLand: boolean;
}

interface LocationMarker {
  id: string;
  name: string;
  country: string;
  role: string;
  lat: number;
  lon: number;
  timezone: string; // e.g. "America/New_York", "Europe/London"
  offset: number; // UTC offset in hours
  color: string;
  fact: string;
}

const KEY_LOCATIONS: LocationMarker[] = [
  {
    id: "london",
    name: "London",
    country: "United Kingdom",
    role: "Creative HQ & Design Lab",
    lat: 51.5074,
    lon: -0.1278,
    timezone: "Europe/London",
    offset: 1, // British Summer Time
    color: "#ff4e17",
    fact: "Where contemporary layout meets digital architecture.",
  },
  {
    id: "newyork",
    name: "New York",
    country: "United States",
    role: "Strategic Branding Hub",
    lat: 40.7128,
    lon: -74.006,
    timezone: "America/New_York",
    offset: -4, // EDT
    color: "#ff4e17",
    fact: "Connecting high-growth enterprise with visceral brand design.",
  },
  {
    id: "tokyo",
    name: "Tokyo",
    country: "Japan",
    role: "Immersive Tech Studio",
    lat: 35.6762,
    lon: 139.6503,
    timezone: "Asia/Tokyo",
    offset: 9, // JST
    color: "#ff4e17",
    fact: "Pioneering minimalist typography and interactive motion.",
  },
  {
    id: "paris",
    name: "Paris",
    country: "France",
    role: "Luxury Experience Lead",
    lat: 48.8566,
    lon: 2.3522,
    timezone: "Europe/Paris",
    offset: 2, // CEST
    color: "#ff4e17",
    fact: "Refining editorial sophistication and aesthetic integrity.",
  },
  {
    id: "sydney",
    name: "Sydney",
    country: "Australia",
    role: "Pacific Growth Office",
    lat: -33.8688,
    lon: 151.2093,
    timezone: "Australia/Sydney",
    offset: 10, // AEST
    color: "#ff4e17",
    fact: "Bridging human connection with fast client response loops.",
  },
];

// High-fidelity procedural continent land checker
function checkIsLand(lat: number, lon: number): boolean {
  // North America
  if (lat > 12 && lat < 75 && lon > -168 && lon < -52) {
    if (lat < 28 && lon > -100 && lon < -80) return false; // Gulf of Mexico
    if (lat > 50 && lon > -95 && lon < -75) return false; // Hudson Bay
    return true;
  }
  // South America
  if (lat > -55 && lat < 12 && lon > -82 && lon < -34) {
    if (lat > 5 && lon > -50 && lon < -34) return true;
    return true;
  }
  // Africa
  if (lat > -35 && lat < 36 && lon > -17 && lon < 51) {
    if (lat > 15 && lon > 33) return false; // Red Sea / Arabia exclusion
    return true;
  }
  // Eurasia (Europe & Asia)
  if (lat > 5 && lat < 78 && lon > -10 && lon < 180) {
    if (lat < 12 && lon < 95) return false; // Indian Ocean exclusion
    return true;
  }
  // Arabia
  if (lat > 12 && lat < 32 && lon > 34 && lon < 60) {
    return true;
  }
  // Greenland
  if (lat > 60 && lat < 84 && lon > -73 && lon < -12) {
    return true;
  }
  // Australia
  if (lat > -42 && lat < -10 && lon > 113 && lon < 154) {
    return true;
  }
  // New Zealand
  if (lat > -47 && lat < -34 && lon > 166 && lon < 179) {
    return true;
  }
  // Madagascar
  if (lat > -25 && lat < -12 && lon > 43 && lon < 51) {
    return true;
  }
  // Japan
  if (lat > 30 && lat < 46 && lon > 129 && lon < 146) {
    return true;
  }
  // UK & Ireland
  if (lat > 50 && lat < 61 && lon > -11 && lon < 2) {
    return true;
  }
  // Iceland
  if (lat > 63 && lat < 67 && lon > -25 && lon < -13) {
    return true;
  }
  // Indonesia / Philippines
  if (lat > -10 && lat < 20 && lon > 95 && lon < 142) {
    return true;
  }
  return false;
}

export default function Globe3D() {
  const [rotation, setRotation] = useState<number>(0);
  const [isAutoSpin, setIsAutoSpin] = useState<boolean>(true);
  const [hoveredLocation, setHoveredLocation] = useState<LocationMarker | null>(null);
  const [localTimes, setLocalTimes] = useState<Record<string, string>>({});
  
  const containerRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef<boolean>(false);
  const startMouseXRef = useRef<number>(0);
  const startRotationRef = useRef<number>(0);

  const radius = 110; // Globe radius
  const width = 280;
  const height = 280;
  const cx = width / 2;
  const cy = height / 2;

  // Generate a Fibonacci Sphere pattern of land/water points once
  const globePoints = useMemo(() => {
    const points: Point3D[] = [];
    const count = 1000; // High quality density
    for (let i = 0; i < count; i++) {
      const y = 1 - (i / (count - 1)) * 2;
      const rAtY = Math.sqrt(1 - y * y);
      const theta = 2.3999632 * i; // Golden angle
      const x = Math.cos(theta) * rAtY;
      const z = Math.sin(theta) * rAtY;

      // Convert to Lat/Lon
      const lat = Math.asin(y) * (180 / Math.PI);
      const lon = Math.atan2(z, x) * (180 / Math.PI);

      points.push({
        lat,
        lon,
        isLand: checkIsLand(lat, lon),
      });
    }
    return points;
  }, []);

  // Update dynamic timezone clocks for the tooltips
  useEffect(() => {
    const updateTimes = () => {
      const times: Record<string, string> = {};
      const now = new Date();
      KEY_LOCATIONS.forEach((loc) => {
        // Calculate standard UTC offset time
        const utc = now.getTime() + now.getTimezoneOffset() * 60000;
        const localDate = new Date(utc + 3600000 * loc.offset);
        let hours = localDate.getHours();
        const minutes = localDate.getMinutes().toString().padStart(2, "0");
        const seconds = localDate.getSeconds().toString().padStart(2, "0");
        const ampm = hours >= 12 ? "PM" : "AM";
        hours = hours % 12 || 12;
        times[loc.id] = `${hours}:${minutes}:${seconds} ${ampm}`;
      });
      setLocalTimes(times);
    };

    updateTimes();
    const interval = setInterval(updateTimes, 1000);
    return () => clearInterval(interval);
  }, []);

  // Auto-rotation animation loop
  useEffect(() => {
    if (!isAutoSpin) return;

    let frameId: number;
    const animate = () => {
      setRotation((prev) => (prev + 0.003) % (Math.PI * 2));
      frameId = requestAnimationFrame(animate);
    };

    frameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameId);
  }, [isAutoSpin]);

  // Touch & Mouse drag spin handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    isDraggingRef.current = true;
    startMouseXRef.current = e.clientX;
    startRotationRef.current = rotation;
    setIsAutoSpin(false);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingRef.current) return;
    const deltaX = e.clientX - startMouseXRef.current;
    // Map movement distance to longitude change
    const speed = 0.007;
    setRotation(startRotationRef.current + deltaX * speed);
  };

  const handleMouseUpOrLeave = () => {
    if (isDraggingRef.current) {
      isDraggingRef.current = false;
      // Resume auto spin after brief delay
      setTimeout(() => {
        setIsAutoSpin(true);
      }, 2500);
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      isDraggingRef.current = true;
      startMouseXRef.current = e.touches[0].clientX;
      startRotationRef.current = rotation;
      setIsAutoSpin(false);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDraggingRef.current || e.touches.length !== 1) return;
    const deltaX = e.touches[0].clientX - startMouseXRef.current;
    const speed = 0.009;
    setRotation(startRotationRef.current + deltaX * speed);
  };

  // Projected 3D elements for SVG rendering
  const { visiblePoints, hiddenPoints, locationsOnSphere } = useMemo(() => {
    const visible: any[] = [];
    const hidden: any[] = [];
    
    // 1. Project the continental grid dots
    globePoints.forEach((pt, index) => {
      // Radian conversion
      const phi = pt.lat * (Math.PI / 180);
      const lambda = pt.lon * (Math.PI / 180);

      // Rotate around the Y-axis (longitude offset)
      const rotatedLambda = lambda + rotation;

      // Calculate 3D sphere coordinates
      const x = Math.cos(phi) * Math.sin(rotatedLambda);
      const y = -Math.sin(phi);
      const z = Math.cos(phi) * Math.cos(rotatedLambda);

      // Map to 2D SVG canvas
      const sx = cx + radius * x;
      const sy = cy + radius * y;

      const dotColor = pt.isLand ? "#6b7280" : "#1f2937";
      const dotRadius = pt.isLand ? 1.2 : 0.8;

      if (z >= 0) {
        // Front side - bright
        visible.push({
          key: `pt-v-${index}`,
          x: sx,
          y: sy,
          r: dotRadius,
          color: pt.isLand ? "rgba(255, 255, 255, 0.4)" : "rgba(255, 255, 255, 0.08)",
          opacity: pt.isLand ? 0.8 : 0.4,
        });
      } else {
        // Back side - faint
        hidden.push({
          key: `pt-h-${index}`,
          x: sx,
          y: sy,
          r: dotRadius * 0.8,
          color: pt.isLand ? "rgba(255, 255, 255, 0.07)" : "rgba(255, 255, 255, 0.02)",
          opacity: 0.2,
        });
      }
    });

    // 2. Project the interactive custom location markers
    const locs = KEY_LOCATIONS.map((loc) => {
      const phi = loc.lat * (Math.PI / 180);
      const lambda = loc.lon * (Math.PI / 180);
      const rotatedLambda = lambda + rotation;

      const x = Math.cos(phi) * Math.sin(rotatedLambda);
      const y = -Math.sin(phi);
      const z = Math.cos(phi) * Math.cos(rotatedLambda);

      const sx = cx + radius * x;
      const sy = cy + radius * y;
      const isFront = z >= 0;

      return {
        ...loc,
        x: sx,
        y: sy,
        isFront,
        depth: z,
      };
    });

    return {
      visiblePoints: visible,
      hiddenPoints: hidden,
      locationsOnSphere: locs,
    };
  }, [globePoints, rotation, cx, cy, radius]);

  return (
    <div
      ref={containerRef}
      className="relative flex flex-col items-center justify-center select-none group"
      id="globe-3d-wrapper"
    >
      {/* Active Location Tooltip overlay */}
      <div
        className={`absolute bottom-[105%] left-1/2 -translate-x-1/2 w-72 bg-neutral-950/95 border border-white/10 rounded-2xl p-4 shadow-2xl backdrop-blur-xl z-50 transition-all duration-300 pointer-events-none ${
          hoveredLocation ? "opacity-100 translate-y-0 scale-100" : "opacity-0 translate-y-4 scale-95"
        }`}
      >
        {hoveredLocation && (
          <div className="space-y-2">
            <div className="flex items-start justify-between">
              <div>
                <h4 className="font-display font-semibold text-white text-base">
                  {hoveredLocation.name}
                </h4>
                <p className="text-xs text-neutral-400 font-medium">{hoveredLocation.country}</p>
              </div>
              <span className="text-[10px] bg-[#ff4e17]/10 text-[#ff4e17] px-2 py-0.5 rounded-full font-mono font-semibold uppercase tracking-wider">
                {hoveredLocation.id}
              </span>
            </div>
            
            <div className="border-t border-white/5 pt-2">
              <p className="text-xs text-[#ff4e17] font-semibold flex items-center gap-1.5">
                <Compass className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: "6s" }} />
                {hoveredLocation.role}
              </p>
              <p className="text-[11px] text-neutral-300 italic mt-1 font-sans leading-relaxed">
                "{hoveredLocation.fact}"
              </p>
            </div>

            <div className="flex justify-between items-center bg-white/5 px-2.5 py-1.5 rounded-lg text-[10px] font-mono text-neutral-400 mt-1">
              <span className="flex items-center gap-1">
                <MapPin className="w-3 h-3 text-neutral-500" />
                {hoveredLocation.lat.toFixed(2)}°, {hoveredLocation.lon.toFixed(2)}°
              </span>
              <span className="text-white font-semibold">
                {localTimes[hoveredLocation.id] || "Loading..."}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* SVG Canvas Container */}
      <div
        className="cursor-grab active:cursor-grabbing relative"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUpOrLeave}
        onMouseLeave={handleMouseUpOrLeave}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleMouseUpOrLeave}
      >
        {/* Sphere Backlight Glow */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-[#ff4e17]/5 via-transparent to-white/5 blur-xl pointer-events-none" />

        <svg
          width={width}
          height={height}
          viewBox={`0 0 ${width} ${height}`}
          className="relative drop-shadow-[0_0_20px_rgba(0,0,0,0.8)]"
        >
          {/* Sphere clip definitions */}
          <defs>
            <radialGradient id="sphere-gradient" cx="50%" cy="40%" r="50%" fx="30%" fy="30%">
              <stop offset="0%" stopColor="#262626" />
              <stop offset="70%" stopColor="#0a0a0a" />
              <stop offset="100%" stopColor="#020202" />
            </radialGradient>
            
            <radialGradient id="ring-gradient" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="rgba(255,255,255,0.15)" />
              <stop offset="100%" stopColor="rgba(255,255,255,0.01)" />
            </radialGradient>

            <filter id="glow-filter" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* 1. Orbit Ring Background segment (behind the globe) */}
          {/* Angle is inclined to give realistic 3D slant */}
          <path
            d={`M ${cx - radius * 1.3} ${cy} A ${radius * 1.3} ${radius * 0.22} 15 0 1 ${cx + radius * 1.3} ${cy}`}
            fill="none"
            stroke="rgba(255, 255, 255, 0.05)"
            strokeWidth="1"
            strokeDasharray="4 4"
          />

          {/* 2. Solid sphere background base with premium shadowing */}
          <circle cx={cx} cy={cy} r={radius} fill="url(#sphere-gradient)" stroke="rgba(255, 255, 255, 0.08)" strokeWidth="1" />

          {/* 3. Render back-side (hidden) continent dots */}
          {hiddenPoints.map((pt) => (
            <circle
              key={pt.key}
              cx={pt.x}
              cy={pt.y}
              r={pt.r}
              fill={pt.color}
              opacity={pt.opacity}
            />
          ))}

          {/* 4. Render front-side (visible) continent dots */}
          {visiblePoints.map((pt) => (
            <circle
              key={pt.key}
              cx={pt.x}
              cy={pt.y}
              r={pt.r}
              fill={pt.color}
              opacity={pt.opacity}
            />
          ))}

          {/* 5. Render key locations */}
          {locationsOnSphere.map((loc) => {
            if (!loc.isFront) return null;

            const isHovered = hoveredLocation?.id === loc.id;

            return (
              <g
                key={loc.id}
                className="cursor-pointer"
                onMouseEnter={() => setHoveredLocation(loc)}
                onMouseLeave={() => setHoveredLocation(null)}
              >
                {/* Outer pulsing ring */}
                <circle
                  cx={loc.x}
                  cy={loc.y}
                  r={isHovered ? 12 : 7}
                  fill="none"
                  stroke={loc.color}
                  strokeWidth="1"
                  opacity={isHovered ? 0.8 : 0.4}
                  className="animate-ping"
                  style={{ transformOrigin: `${loc.x}px ${loc.y}px`, animationDuration: "2s" }}
                />

                {/* Secondary larger background pulse glow on hover */}
                {isHovered && (
                  <circle
                    cx={loc.x}
                    cy={loc.y}
                    r="18"
                    fill={loc.color}
                    opacity="0.15"
                    className="transition-all duration-300"
                  />
                )}

                {/* Core bright colored marker point */}
                <circle
                  cx={loc.x}
                  cy={loc.y}
                  r={isHovered ? 4.5 : 3}
                  fill={isHovered ? "#ffffff" : loc.color}
                  stroke={isHovered ? loc.color : "rgba(0,0,0,0.5)"}
                  strokeWidth={isHovered ? 2 : 1}
                  filter="url(#glow-filter)"
                  className="transition-all duration-200"
                />
              </g>
            );
          })}

          {/* 6. Orbit Ring Foreground segment (in front of the globe) */}
          <path
            d={`M ${cx + radius * 1.3} ${cy} A ${radius * 1.3} ${radius * 0.22} 15 0 1 ${cx - radius * 1.3} ${cy}`}
            fill="none"
            stroke="rgba(255, 78, 23, 0.18)"
            strokeWidth="1.2"
          />

          {/* Subtle orbiting satellite node */}
          <circle
            cx={cx + radius * 1.3 * Math.cos(rotation * 1.5)}
            cy={cy + radius * 0.22 * Math.sin(rotation * 1.5)}
            r="2"
            fill="#ff4e17"
            opacity="0.8"
            filter="url(#glow-filter)"
          />
        </svg>

        {/* Drag hints and status */}
        <div className="absolute bottom-1 right-2 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
          <span className="text-[10px] font-mono text-neutral-400 bg-neutral-900/80 border border-white/5 px-2 py-0.5 rounded-full backdrop-blur-md flex items-center gap-1">
            <RotateCcw className="w-3 h-3 text-[#ff4e17] animate-spin" style={{ animationDuration: "8s" }} />
            Drag to Spin
          </span>
        </div>
      </div>
    </div>
  );
}
