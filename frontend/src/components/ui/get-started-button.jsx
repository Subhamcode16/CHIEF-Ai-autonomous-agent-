import { Button } from "@/components/ui/button";
import { ChevronRight } from "lucide-react";
import { ArrowRight } from "lucide-react"; // Import ArrowRight in case we want to swap, but user asked for ChevronRight in the code.
// Actually user code used `ChevronRight`.

import { cn } from "@/lib/utils";

export function GetStartedButton({ text, className, ...props }) {
    // Logic to handle loading state from default button usage in LandingPage
    // The LandingPage passes `loading` state.
    // We should interpret `text` and render accordingly.

    return (
        <Button className={cn("group relative overflow-hidden", className)} size="lg" {...props}>
            <span className="mr-8 transition-opacity duration-500 group-hover:opacity-0 relative z-10">
                {text || "Get Started"}
            </span>
            <i className="absolute right-1 top-1 bottom-1 rounded-sm z-10 grid w-1/4 place-items-center transition-all duration-500 bg-primary-foreground/15 group-hover:w-[calc(100%-0.5rem)] group-active:scale-95 text-black-500">
                <ChevronRight size={16} strokeWidth={2} aria-hidden="true" />
            </i>
        </Button>
    );
}
