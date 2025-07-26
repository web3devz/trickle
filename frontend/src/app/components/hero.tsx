'use client';

import { useEffect, useRef, useState } from 'react';
import { useGeolocation } from '@/hooks/use-geolocation';
import { MorphingText } from './magicui/morphing-text';
import { SignIn } from './auth/sign-in';
import Image from 'next/image';


const texts = [
  "GROW",
  "INVEST",
  "WIN",
];

export default function Hero() {
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollTextRef = useRef<HTMLParagraphElement>(null);
  const [skewValue, setSkewValue] = useState(0);
  const [translateXValue, setTranslateXValue] = useState(0);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [scrollDirection, setScrollDirection] = useState<'up' | 'down'>('down');
  const [scrollSpeed, setScrollSpeed] = useState(0);
  const [mounted, setMounted] = useState(false);
  const geolocation = useGeolocation();

  // Handle initial mount
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const handleScroll = () => {
      if (!containerRef.current || !scrollTextRef.current) return;

      const scrollY = window.scrollY;
      const direction = scrollY > lastScrollY ? 'down' : 'up';
      setScrollDirection(direction);

      const speed = Math.abs(scrollY - lastScrollY);
      setScrollSpeed(speed);
      setLastScrollY(scrollY);

      const containerHeight = containerRef.current.clientHeight;
      const scrollPercentage = Math.min(scrollY / containerHeight, 3.13);
      const directionModifier = direction === 'down' ? 1 : 0.5;
      const targetSkew = scrollPercentage * 18 * directionModifier;

      const targetTranslateX = scrollPercentage * -1500;
      const lerpFactor = Math.min(0.1 + (speed * 0.002), 0.3);

      // Smooth animation with lerp (linear interpolation)
      setSkewValue(prev => prev + (targetSkew - prev) * lerpFactor);
      setTranslateXValue(prev => prev + (targetTranslateX - prev) * lerpFactor);
    };

    // Add event listener for scroll
    window.addEventListener('scroll', handleScroll, { passive: true });

    // For initial animation and continuous updates
    let animationFrameId: number;
    const animate = () => {
      handleScroll(); // Make sure we call handleScroll here to ensure it runs continuously
      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('scroll', handleScroll);
      cancelAnimationFrame(animationFrameId);
    };
  }, [lastScrollY, mounted]);

  // Don't render until client side to avoid hydration issues
  if (!mounted) {
    return null;
  }

  // Calculate safe opacity value that avoids NaN
  const opacityValue = isNaN(translateXValue)
    ? 1
    : Math.max(1 - Math.abs(translateXValue / 1500), 0.5);

  return (
    <section className="h-[500vh] bg-neutral-50 text-neutral-950">
      <div ref={containerRef} className="sticky top-0 flex h-screen flex-col justify-between overflow-hidden">
        {/* Header */}
        <div className="relative mb-1 flex w-full items-center justify-between p-6">
          <p className="hidden text-xs text-neutral-400 md:block">
            {geolocation.loading ? (
              "Fetching location..."
            ) : geolocation.error ? (
              "Location unavailable"
            ) : (
              `${Math.abs(Number(geolocation.latitude))}° ${Math.abs(Number(geolocation.latitude)) === Number(geolocation.latitude) ? "N" : "S"}, ${Math.abs(Number(geolocation.longitude))}° ${Math.abs(Number(geolocation.longitude)) === Number(geolocation.longitude) ? "E" : "W"}`
            )}
          </p>
          <div className="flex items-center justify-between space-x-3">
            <Image
              src="/trickle_icon.png"
              alt="Trickle Logo"
              width={32}
              height={40}
              className="w-6 h-8 md:w-8 md:h-10 "
            />
            <h1 className='font-medium text-xl'>Trickle</h1>
          </div>
          <nav className="flex gap-3 text-sm items-center">
            {/* <a href="/app" className="hover:opacity-70 transition-opacity">Dashboard</a> */}
            <SignIn />
          </nav>
        </div>

        <div className="flex items-center justify-center px-4 space-x-5 relative">
          <div
            className="h-[180px] w-[70px] md:h-[200px] md:w-[80px] overflow-hidden rounded-none border border-neutral-200"
          >
            <div className="h-full w-full bg-gradient-to-br from-blue-500 via-purple-500 to-red-500 opacity-90"></div>
          </div>

          <h1 className="text-3xl font-bold text-neutral-400 sm:text-5xl md:text-7xl">
            Crypto investing <br />
            on autopilot. <br />
            Time to{' '}
            <span
              className="inline-block font-black text-neutral-950 transition-transform duration-300"
              style={{ transform: `skewX(-18deg)` }}
            >
              <MorphingText texts={texts} className='text-3xl sm:text-5xl md:text-7xl' />
            </span>
          </h1>
        </div>

        {/* Scrolling Text */}
        <p
          ref={scrollTextRef}
          className="origin-bottom-left whitespace-nowrap text-7xl font-black uppercase leading-[0.85] md:text-9xl md:leading-[0.85] min-w-max"
          style={{
            transform: `translateX(${translateXValue}px) skewX(${skewValue}deg) translateZ(0px)`,
            opacity: opacityValue
          }}
        >
          Automated investments in any purchase you make. Focus on what matters most to you.
        </p>

        {/* Scroll Indicators */}
        <div className="absolute right-4 top-1/2 hidden -translate-y-1/2 text-xs lg:block">
          <span style={{ writingMode: 'vertical-lr' }}>SCROLL</span>
        </div>
      </div>
    </section>
  );
}