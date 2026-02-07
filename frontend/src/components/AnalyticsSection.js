import { useRef, useEffect } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Analytics from "./Analytics";

gsap.registerPlugin(ScrollTrigger);

export default function AnalyticsSection({ sessionId }) {
    const sectionRef = useRef(null);
    const headerRef = useRef(null);
    const line1Ref = useRef(null);
    const line2Ref = useRef(null);
    const orb1Ref = useRef(null);
    const orb2Ref = useRef(null);

    useEffect(() => {
        const section = sectionRef.current;
        const line1 = line1Ref.current;
        const line2 = line2Ref.current;
        const orb1 = orb1Ref.current;
        const orb2 = orb2Ref.current;

        if (!section || !line1 || !line2) return;

        // Header text reveal with subtle blur
        gsap.set([line1, line2], {
            opacity: 0,
            y: 30,
            filter: "blur(8px)"
        });

        gsap.to(line1, {
            opacity: 1,
            y: 0,
            filter: "blur(0px)",
            duration: 0.8,
            ease: "power2.out",
            scrollTrigger: {
                trigger: headerRef.current,
                start: "top 85%",
                toggleActions: "play none none reverse"
            }
        });

        gsap.to(line2, {
            opacity: 1,
            y: 0,
            filter: "blur(0px)",
            duration: 0.8,
            delay: 0.15,
            ease: "power2.out",
            scrollTrigger: {
                trigger: headerRef.current,
                start: "top 85%",
                toggleActions: "play none none reverse"
            }
        });

        // Parallax orbs
        if (orb1 && orb2) {
            gsap.to(orb1, {
                y: -80,
                ease: "none",
                scrollTrigger: {
                    trigger: section,
                    start: "top bottom",
                    end: "bottom top",
                    scrub: 1
                }
            });

            gsap.to(orb2, {
                y: -120,
                ease: "none",
                scrollTrigger: {
                    trigger: section,
                    start: "top bottom",
                    end: "bottom top",
                    scrub: 1.5
                }
            });
        }

        return () => {
            ScrollTrigger.getAll().forEach(t => t.kill());
        };
    }, []);

    return (
        <section ref={sectionRef} className="relative min-h-screen bg-[var(--bg-primary)]">
            {/* Parallax ambient orbs */}
            <div
                ref={orb1Ref}
                className="absolute top-20 left-10 w-72 h-72 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none"
            />
            <div
                ref={orb2Ref}
                className="absolute top-40 right-20 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl pointer-events-none"
            />

            <div className="relative z-10 max-w-7xl mx-auto px-5 md:px-8 pt-20 pb-12">
                {/* Animated Section Header */}
                <div ref={headerRef} className="text-center mb-12">
                    <h2 className="text-3xl md:text-4xl font-bold mb-4">
                        <span
                            ref={line1Ref}
                            className="inline-block text-transparent bg-clip-text bg-gradient-to-r from-white via-cyan-200 to-white"
                        >
                            Your Performance
                        </span>
                        <br />
                        <span
                            ref={line2Ref}
                            className="inline-block text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400"
                        >
                            At a Glance
                        </span>
                    </h2>
                </div>

                {/* Analytics Content */}
                <Analytics sessionId={sessionId} isScrollSection={true} />
            </div>
        </section>
    );
}
