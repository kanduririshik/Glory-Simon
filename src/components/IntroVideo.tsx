import { useState, useEffect, useRef } from 'react';
import { Volume2, VolumeX } from 'lucide-react';

interface IntroVideoProps {
  onComplete: () => void;
}

export function IntroVideo({ onComplete }: IntroVideoProps) {
  const [isMuted, setIsMuted] = useState(true);
  const [isFading, setIsFading] = useState(false);
  const [showControls, setShowControls] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Random particles for luxury ambient glow
  const [particles] = useState(() =>
    Array.from({ length: 18 }).map((_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 80 + 10}%`,
      size: Math.random() * 3 + 2,
      duration: Math.random() * 20 + 15,
      delay: Math.random() * -20,
    }))
  );

  useEffect(() => {
    // Reveal controls (Mute, Skip) after 2 seconds
    const controlsTimeout = setTimeout(() => {
      setShowControls(true);
    }, 2000);

    // Escape key skips intro
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleSkip();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    // Fallback timer: in case video fails or gets blocked, ensure site is accessible
    // Let's set it to 12 seconds, which is a common luxury intro length
    const fallbackTimeout = setTimeout(() => {
      handleSkip();
    }, 15000);

    return () => {
      clearTimeout(controlsTimeout);
      clearTimeout(fallbackTimeout);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isFading]);

  const handleSkip = () => {
    if (isFading) return;
    setIsFading(true);
    sessionStorage.setItem('gsi_intro_seen', 'true');
    setTimeout(() => {
      onComplete();
    }, 1000); // Match the 1000ms transition
  };

  const toggleMute = () => {
    if (videoRef.current) {
      const newMuted = !videoRef.current.muted;
      videoRef.current.muted = newMuted;
      setIsMuted(newMuted);
    }
  };

  return (
    <div
      className={`fixed inset-0 w-screen h-screen bg-[#050505] overflow-hidden z-[9999] flex flex-col items-center justify-center transition-all duration-1000 ease-in-out ${
        isFading ? 'opacity-0 scale-[1.02] pointer-events-none' : 'opacity-100 scale-100'
      }`}
      aria-label="Introduction Video Overlay"
    >
      {/* Particle animation styles */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes drift {
          0% {
            transform: translate(0, 0) scale(1);
            opacity: 0;
          }
          10% {
            opacity: 0.4;
          }
          90% {
            opacity: 0.4;
          }
          100% {
            transform: translate(40px, -60px) scale(0.7);
            opacity: 0;
          }
        }
        .film-grain {
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E");
          opacity: 0.035;
        }
      `}} />

      {/* Fullscreen Video */}
      <video
        ref={videoRef}
        src={`${import.meta.env.BASE_URL}intro.mp4`}
        autoPlay
        muted={isMuted}
        playsInline
        preload="auto"
        onEnded={handleSkip}
        className={`absolute inset-0 w-full h-full object-cover object-center transition-opacity duration-1000 ${
          isFading ? 'opacity-0' : 'opacity-100'
        }`}
      />

      {/* Cinematic Vignette */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_30%,rgba(5,5,5,0.75)_100%)] z-10 pointer-events-none" />

      {/* Warm Golden Light Glow */}
      <div className="absolute top-[-20%] left-[-20%] w-[140%] h-[140%] bg-[radial-gradient(circle_at_50%_35%,rgba(212,166,90,0.06)_0%,transparent_60%)] z-10 pointer-events-none" />

      {/* Film Grain overlay */}
      <div className="absolute inset-0 film-grain z-10 pointer-events-none" />

      {/* Subtle darkening to keep UI/Text readable */}
      <div className="absolute inset-0 bg-black/15 z-10 pointer-events-none" />

      {/* Floating Particles Layer */}
      <div className="absolute inset-0 pointer-events-none z-15 overflow-hidden">
        {particles.map((p) => (
          <div
            key={p.id}
            className="absolute bg-[#E6C27A]/30 rounded-full blur-[0.5px]"
            style={{
              left: p.left,
              top: p.top,
              width: `${p.size}px`,
              height: `${p.size}px`,
              animation: `drift ${p.duration}s linear infinite`,
              animationDelay: `${p.delay}s`,
            }}
          />
        ))}
      </div>



      {/* Bottom Controls */}
      <div
        className={`absolute bottom-8 left-8 right-8 z-30 flex justify-between items-center pointer-events-none transition-all duration-700 ${
          showControls && !isFading ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
        }`}
      >
        {/* Mute Button (Bottom Left) */}
        <button
          onClick={toggleMute}
          className="pointer-events-auto flex items-center justify-center p-3 rounded-full border border-[#D4A65A]/20 bg-black/40 backdrop-blur-md text-[#CBBEAB] hover:text-[#E6C27A] hover:border-[#E6C27A]/50 hover:shadow-[0_0_15px_rgba(212,166,90,0.15)] hover:scale-105 transition-all duration-300 focus:outline-none focus:ring-1 focus:ring-[#D4A65A]/50 cursor-pointer"
          title={isMuted ? 'Unmute' : 'Mute'}
          aria-label={isMuted ? 'Unmute audio' : 'Mute audio'}
        >
          {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
        </button>

        {/* Skip Intro Button (Bottom Right) */}
        <button
          onClick={handleSkip}
          className="pointer-events-auto px-5 py-2.5 rounded-full border border-[#D4A65A]/20 bg-black/40 backdrop-blur-md text-[#CBBEAB] hover:text-[#E6C27A] hover:border-[#E6C27A]/50 hover:shadow-[0_0_15px_rgba(212,166,90,0.15)] hover:scale-105 transition-all duration-300 text-xs sm:text-sm font-medium tracking-[0.15em] uppercase focus:outline-none focus:ring-1 focus:ring-[#D4A65A]/50 cursor-pointer"
        >
          Skip Intro
        </button>
      </div>
    </div>
  );
}
