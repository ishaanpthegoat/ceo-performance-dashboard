/**
 * The component library, in the 21st.dev idiom: each file is self-contained,
 * typed, styled with Tailwind against the theme's CSS variables, and animated
 * with Framer Motion. Copy any one of them into another project and it works.
 *
 *  01  AuroraBackground   drifting colour field behind the hero
 *  02  SpotlightCard      pointer-tracking border + surface highlight
 *  03  BentoGrid          asymmetric dashboard grid (+ BentoCard)
 *  04  NumberTicker       spring-counted figures on scroll-in
 *  05  Marquee            seamless infinite scroller
 *  06  BorderBeam         light travelling a rounded border
 *  07  MagneticButton     leans toward the cursor
 *  08  AnimatedTabs       layoutId sliding selection pill
 *  09  Timeline           scroll-filled vertical spine
 *  10  TextShimmer        highlight sweep across glyphs
 *  11  Dock               macOS-style magnifying dock (+ DockItem)
 *  12  AnimatedTooltip    spring tooltip that tilts toward the pointer
 *  13  CommandPalette     ⌘K combobox search
 *  14  ScrollProgress     hairline reading-progress bar
 *  15  Meteors            falling streak field
 *  16  TiltCard           3D perspective tilt with specular glare
 *  17  AnimatedList       staggered reveal (+ AnimatedListItem)
 *  18  DotPattern         masked tiling dot grid
 */

export { AuroraBackground } from "./aurora-background";
export { SpotlightCard } from "./spotlight-card";
export { BentoGrid, BentoCard } from "./bento-grid";
export { NumberTicker } from "./number-ticker";
export { Marquee } from "./marquee";
export { BorderBeam } from "./border-beam";
export { MagneticButton } from "./magnetic-button";
export { AnimatedTabs, type TabItem } from "./animated-tabs";
export { Timeline, type TimelineEntry } from "./timeline";
export { TextShimmer } from "./text-shimmer";
export { Dock, DockItem } from "./dock";
export { AnimatedTooltip } from "./animated-tooltip";
export { CommandPalette, type CommandItem } from "./command-palette";
export { ScrollProgress } from "./scroll-progress";
export { Meteors } from "./meteors";
export { TiltCard } from "./tilt-card";
export { AnimatedList, AnimatedListItem } from "./animated-list";
export { DotPattern } from "./dot-pattern";
