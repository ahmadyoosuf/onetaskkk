i have a reference design system from another project (secdash) that i want to adapt. the key things:

- fonts: Space Grotesk for body/headings, IBM Plex Mono for code/data
- colors: indigo-blue primary around hsl(240 60% 55%), warm off-white backgrounds not pure white
- borders should be subtle, like border-border/30 not solid borders everywhere
- cards have that slightly elevated look with soft shadows
- theres a glass header effect with backdrop blur
- animations: fadeInUp for cards entering, a breathing pulse for active indicators

update globals.css with proper design tokens. also update layout.tsx to use the fonts via next/font/google

dont go crazy with it, keep it clean. i want it to feel premium but not overdone
