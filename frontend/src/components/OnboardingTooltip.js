import { useEffect, useState } from "react";
import { X } from "lucide-react";

const ONBOARDING_STEPS = [
    {
        target: "tasks-tab",
        title: "📝 Step 1: Add Your Tasks",
        description: "Click the Tasks tab and add a few tasks with priorities (urgent/high/medium/low)",
        position: "bottom"
    },
    {
        target: "plan-day-btn",
        title: "🧠 Step 2: Let Chief Plan",
        description: "Click this button and watch Chief automatically schedule your tasks",
        position: "bottom"
    },
    {
        target: "calendar-panel",
        title: "📅 Step 3: Your Optimized Schedule",
        description: "Chief created an optimized schedule! You can drag events to adjust anytime.",
        position: "left"
    }
];

export default function OnboardingTooltip({ step, onNext, onSkip }) {
    const [targetRect, setTargetRect] = useState(null);

    useEffect(() => {
        if (step === null) return;

        const currentStep = ONBOARDING_STEPS[step];
        const element = document.querySelector(`[data-testid="${currentStep.target}"]`);

        if (element) {
            const rect = element.getBoundingClientRect();
            setTargetRect(rect);
        }
    }, [step]);

    if (step === null || !targetRect) return null;

    const currentStep = ONBOARDING_STEPS[step];
    const isLastStep = step === ONBOARDING_STEPS.length - 1;

    // Calculate tooltip position
    const getTooltipStyle = () => {
        const padding = 20;
        let top, left;

        switch (currentStep.position) {
            case "bottom":
                top = targetRect.bottom + padding;
                left = targetRect.left + targetRect.width / 2;
                return { top: `${top}px`, left: `${left}px`, transform: "translateX(-50%)" };

            case "left":
                top = targetRect.top + targetRect.height / 2;
                left = targetRect.left - padding;
                return { top: `${top}px`, left: `${left}px`, transform: "translate(-100%, -50%)" };

            default:
                return {};
        }
    };

    return (
        <>
            {/* Dark overlay */}
            <div
                className="fixed inset-0 bg-black/70 z-40 animate-fade-in"
                onClick={onSkip}
            />

            {/* Spotlight ring */}
            <div
                className="fixed z-50 pointer-events-none animate-fade-in"
                style={{
                    top: targetRect.top - 8,
                    left: targetRect.left - 8,
                    width: targetRect.width + 16,
                    height: targetRect.height + 16,
                    boxShadow: "0 0 0 4px rgba(59, 130, 246, 0.5), 0 0 0 9999px rgba(0, 0, 0, 0.7)",
                    borderRadius: "12px",
                    transition: "all 300ms ease-out"
                }}
            />

            {/* Tooltip card */}
            <div
                className="fixed z-50 glass-2 glass-highlight rounded-xl p-5 max-w-sm animate-slide-in"
                style={getTooltipStyle()}
            >
                <button
                    onClick={onSkip}
                    className="absolute top-3 right-3 p-1 rounded-md text-[var(--text-muted)] hover:text-white hover:bg-white/10 transition-colors"
                >
                    <X className="w-4 h-4" />
                </button>

                <h3 className="text-lg font-semibold text-white mb-2 pr-6">
                    {currentStep.title}
                </h3>
                <p className="text-sm text-[var(--text-secondary)] mb-4">
                    {currentStep.description}
                </p>

                <div className="flex items-center justify-between">
                    <div className="flex gap-1">
                        {ONBOARDING_STEPS.map((_, i) => (
                            <div
                                key={i}
                                className={`h-1.5 rounded-full transition-all ${i === step
                                        ? "w-6 bg-blue-400"
                                        : i < step
                                            ? "w-1.5 bg-blue-400/50"
                                            : "w-1.5 bg-white/20"
                                    }`}
                            />
                        ))}
                    </div>

                    <div className="flex gap-2">
                        <button
                            onClick={onSkip}
                            className="px-3 py-1.5 text-xs text-[var(--text-muted)] hover:text-white transition-colors"
                        >
                            Skip
                        </button>
                        <button
                            onClick={onNext}
                            className="px-4 py-1.5 text-xs bg-blue-500 hover:bg-blue-600 text-white rounded-md font-medium transition-colors"
                        >
                            {isLastStep ? "Got it!" : "Next"}
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
}
