import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

interface CircularProgressProps {
  value: number;
  maxValue?: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  backgroundColor?: string;
  className?: string;
  showPercentage?: boolean;
  animate?: boolean;
  duration?: number;
}

const CircularProgress = ({
  value,
  maxValue = 100,
  size = 200,
  strokeWidth = 4,
  color = "#abec12",
  backgroundColor = "#e5e7eb",
  className,
  showPercentage = true,
  animate = true,
  duration = 1500,
}: CircularProgressProps) => {
  const [currentValue, setCurrentValue] = useState(0);

  // Normalize the value as a percentage
  const normalizedValue = Math.min(Math.max(0, value), maxValue);
  const percentage = (normalizedValue / maxValue) * 100;

  // Calculate dimensions
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const fillPercentage = (currentValue / 100) * circumference;
  const waveHeight = radius * 0.12; // Slightly reduced wave height for more natural flow

  // Animation
  useEffect(() => {
    if (!animate) {
      setCurrentValue(percentage);
      return;
    }

    let start = 0;
    const end = percentage;
    const incrementTime = duration / end;

    const timer = setInterval(() => {
      start += 1;
      setCurrentValue(start);

      if (start >= end) {
        clearInterval(timer);
      }
    }, incrementTime);

    return () => {
      clearInterval(timer);
    };
  }, [percentage, animate, duration]);

  // Calculate the y position for the fill based on the percentage
  const fillHeight = radius * 2 * (1 - currentValue / 100);

  // Create a lighter version of the color for the second wave
  const getLighterColor = (color: string) => {
    // For hex colors
    if (color.startsWith("#")) {
      const r = parseInt(color.slice(1, 3), 16);
      const g = parseInt(color.slice(3, 5), 16);
      const b = parseInt(color.slice(5, 7), 16);

      // Make it 30% lighter
      const lighterR = Math.min(255, r + 40);
      const lighterG = Math.min(255, g + 40);
      const lighterB = Math.min(255, b + 40);

      return `rgba(${lighterR}, ${lighterG}, ${lighterB}, 0.7)`;
    }

    // For other formats, default to a transparent version
    return `${color}80`;
  };

  const lighterColor = getLighterColor(color);

  return (
    <div
      className={cn(
        "relative inline-flex items-center justify-center",
        className
      )}
      style={{ width: size, height: size }}
    >
      {/* Circle border */}
      <svg width={size} height={size} className="absolute">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={backgroundColor}
          strokeWidth={strokeWidth}
        />
      </svg>

      {/* Clipping mask for the water effect */}
      <svg width={size} height={size} className="absolute overflow-visible">
        <defs>
          <clipPath id="circleClip">
            <circle cx={size / 2} cy={size / 2} r={radius} />
          </clipPath>
        </defs>

        {/* Water fill background */}
        <rect
          x={0}
          y={fillHeight}
          width={size}
          height={size - fillHeight}
          fill={color}
          clipPath="url(#circleClip)"
          className="transition-all duration-300 ease-out"
        />

        {/* First wave effect - faster and higher frequency */}
        <path
          d={`
            M 0 ${fillHeight + waveHeight}
            Q ${size / 6} ${fillHeight - waveHeight}, ${size / 3} ${
            fillHeight + waveHeight
          }
            Q ${size / 2} ${fillHeight + 2 * waveHeight}, ${(2 * size) / 3} ${
            fillHeight - waveHeight
          }
            Q ${(5 * size) / 6} ${fillHeight - 2 * waveHeight}, ${size} ${
            fillHeight + waveHeight
          }
            L ${size} ${size}
            L 0 ${size}
            Z
          `}
          fill={lighterColor}
          clipPath="url(#circleClip)"
          className="transition-all duration-300 ease-out"
        >
          <animate
            attributeName="d"
            dur="4s"
            repeatCount="indefinite"
            values={`
              M 0 ${fillHeight + waveHeight}
              Q ${size / 6} ${fillHeight - waveHeight}, ${size / 3} ${
              fillHeight + waveHeight
            }
              Q ${size / 2} ${fillHeight + 2 * waveHeight}, ${(2 * size) / 3} ${
              fillHeight - waveHeight
            }
              Q ${(5 * size) / 6} ${fillHeight - 2 * waveHeight}, ${size} ${
              fillHeight + waveHeight
            }
              L ${size} ${size}
              L 0 ${size}
              Z;

              M 0 ${fillHeight - waveHeight}
              Q ${size / 6} ${fillHeight + 2 * waveHeight}, ${size / 3} ${
              fillHeight - waveHeight
            }
              Q ${size / 2} ${fillHeight - 2 * waveHeight}, ${(2 * size) / 3} ${
              fillHeight + 2 * waveHeight
            }
              Q ${(5 * size) / 6} ${fillHeight + waveHeight}, ${size} ${
              fillHeight - waveHeight
            }
              L ${size} ${size}
              L 0 ${size}
              Z;

              M 0 ${fillHeight + waveHeight}
              Q ${size / 6} ${fillHeight - waveHeight}, ${size / 3} ${
              fillHeight + waveHeight
            }
              Q ${size / 2} ${fillHeight + 2 * waveHeight}, ${(2 * size) / 3} ${
              fillHeight - waveHeight
            }
              Q ${(5 * size) / 6} ${fillHeight - 2 * waveHeight}, ${size} ${
              fillHeight + waveHeight
            }
              L ${size} ${size}
              L 0 ${size}
              Z
            `}
          />
        </path>

        {/* Second wave effect - slower and different phase */}
        <path
          d={`
            M 0 ${fillHeight - waveHeight}
            Q ${size / 4} ${fillHeight + 1.5 * waveHeight}, ${size / 2} ${
            fillHeight - waveHeight
          }
            Q ${(3 * size) / 4} ${fillHeight - 2 * waveHeight}, ${size} ${
            fillHeight + waveHeight
          }
            L ${size} ${size}
            L 0 ${size}
            Z
          `}
          fill={color}
          fillOpacity="0.6"
          clipPath="url(#circleClip)"
          className="transition-all duration-300 ease-out"
        >
          <animate
            attributeName="d"
            dur="5s"
            repeatCount="indefinite"
            values={`
              M 0 ${fillHeight - waveHeight}
              Q ${size / 4} ${fillHeight + 1.5 * waveHeight}, ${size / 2} ${
              fillHeight - waveHeight
            }
              Q ${(3 * size) / 4} ${fillHeight - 2 * waveHeight}, ${size} ${
              fillHeight + waveHeight
            }
              L ${size} ${size}
              L 0 ${size}
              Z;

              M 0 ${fillHeight + 1.5 * waveHeight}
              Q ${size / 4} ${fillHeight - 2 * waveHeight}, ${size / 2} ${
              fillHeight + 1.5 * waveHeight
            }
              Q ${(3 * size) / 4} ${fillHeight + 2 * waveHeight}, ${size} ${
              fillHeight - waveHeight
            }
              L ${size} ${size}
              L 0 ${size}
              Z;

              M 0 ${fillHeight - waveHeight}
              Q ${size / 4} ${fillHeight + 1.5 * waveHeight}, ${size / 2} ${
              fillHeight - waveHeight
            }
              Q ${(3 * size) / 4} ${fillHeight - 2 * waveHeight}, ${size} ${
              fillHeight + waveHeight
            }
              L ${size} ${size}
              L 0 ${size}
              Z
            `}
          />
        </path>
      </svg>

      {/* Percentage text */}
      {showPercentage && (
        <div className="absolute text-center">
          <span
            className="text-3xl font-bold"
            style={{
              color: currentValue > 50 ? "white" : "currentColor",
              transition: "color 0.3s ease",
            }}
          >
            {Math.round(currentValue)}
          </span>
        </div>
      )}
    </div>
  );
};

export default CircularProgress;
