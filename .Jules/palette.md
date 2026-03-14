## 2024-05-18 - Visual Disabled States in Counters
**Learning:** Increment/decrement counters (like guest selectors) need clear visual disabled states when reaching minimum/maximum limits. Without this, users may repeatedly click a button expecting a change and think the interface is broken when it doesn't respond. Also, adding `aria-live="polite"` to the count helps screen readers announce changes dynamically.
**Action:** Always add `disabled` attribute along with visual cues (e.g., `disabled:opacity-40 disabled:cursor-not-allowed`) to counter buttons when they hit their limits. Ensure counter text has `aria-live` for screen reader users.
## 2024-05-18 - Glassmorphism UI Polish
**Learning:** Adding slight translucency (`bg-white/70`) paired with a light background blur (`backdrop-blur-md`) and an ultra-thin semi-transparent border (`border-white/50`) creates a subtle, appealing depth for central navigation components like search bars without overpowering the UI.
**Action:** When adding focus or depth to floating components, leverage backdrop-blur utility classes and very light semi-transparent borders to create a polished "liquid glass" effect.

## 2024-05-18 - Super Liquid Glass & Brand Alignment
**Learning:** Aligning interactive component accents (like primary buttons and active calendar states) with the core brand color (Emerald/Apple Green) significantly improves visual cohesion. Additionally, pushing glassmorphism to "Super Liquid Glass" by maximizing the blur (`backdrop-blur-2xl`) while dropping opacity (`bg-white/30`) and using wide, soft shadows (`shadow-[0_20px_50px_rgba(0,0,0,0.1)]`) creates a highly premium, floating aesthetic without adding custom CSS.
**Action:** Always verify if a primary action button conflicts with the logo's color palette. For premium UI feels, experiment with high blur/low opacity combinations and ambient shadows.
