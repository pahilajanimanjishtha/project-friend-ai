import { useEffect, useState } from 'react';

interface Star {
  id: number;
  width: number;
  height: number;
  top: string;
  left: string;
  dur: string;
  del: string;
  minOp: number;
  maxOp: number;
}

export default function Starfield() {
  const [stars, setStars] = useState<Star[]>([]);

  useEffect(() => {
    const generatedStars: Star[] = Array.from({ length: 100 }).map((_, i) => {
      const size = Math.random() * 2.4 + 0.6;
      return {
        id: i,
        width: size,
        height: size,
        top: `${Math.random() * 100}%`,
        left: `${Math.random() * 100}%`,
        dur: `${(Math.random() * 4 + 2).toFixed(1)}s`,
        del: `${(Math.random() * 4).toFixed(1)}s`,
        minOp: parseFloat((Math.random() * 0.15 + 0.05).toFixed(2)),
        maxOp: parseFloat((Math.random() * 0.5 + 0.3).toFixed(2)),
      };
    });
    setStars(generatedStars);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden bg-brown-deep">
      {stars.map((star) => (
        <div
          key={star.id}
          className="absolute rounded-full bg-white animate-pulse"
          style={{
            width: `${star.width}px`,
            height: `${star.height}px`,
            top: star.top,
            left: star.left,
            animationDuration: star.dur,
            animationDelay: star.del,
            opacity: star.minOp,
            // Custom styles can be handled cleanly or using simple CSS
          }}
        />
      ))}
    </div>
  );
}
