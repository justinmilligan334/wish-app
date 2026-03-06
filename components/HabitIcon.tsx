'use client';

interface HabitIconProps {
  name: string;
  color: string;
  size?: number;
}

export default function HabitIcon({ name, color, size = 28 }: HabitIconProps) {
  const letter = name.charAt(0).toUpperCase();
  return (
    <div
      className="flex items-center justify-center rounded-lg font-heading font-semibold"
      style={{
        width: size,
        height: size,
        backgroundColor: `${color}15`,
        color: color,
        fontSize: size * 0.42,
      }}
    >
      {letter}
    </div>
  );
}
