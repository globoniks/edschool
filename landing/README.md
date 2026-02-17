# School OS Landing Page

A modern, high-conversion landing page for the School OS platform built with Next.js 14, TypeScript, Tailwind CSS, and Framer Motion.

## Features

- ✅ Next.js 14 with App Router
- ✅ TypeScript for type safety
- ✅ Tailwind CSS for styling
- ✅ Framer Motion for subtle animations
- ✅ Fully responsive (mobile-first design)
- ✅ Accessible and semantic HTML
- ✅ Premium, minimal design
- ✅ No backend dependencies

## Getting Started

### Install Dependencies

```bash
npm install
```

### Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build for Production

```bash
npm run build
npm start
```

## Project Structure

```
landing/
├── app/
│   ├── layout.tsx          # Root layout
│   ├── page.tsx            # Main landing page
│   └── globals.css         # Global styles
├── components/
│   ├── sections/           # Page sections
│   │   ├── HeroSection.tsx
│   │   ├── ProblemSection.tsx
│   │   ├── SolutionSection.tsx
│   │   ├── FeaturesSection.tsx
│   │   ├── RoleDemoSection.tsx
│   │   ├── WhyChooseUsSection.tsx
│   │   ├── HowItWorksSection.tsx
│   │   ├── PricingSection.tsx
│   │   ├── TrustSection.tsx
│   │   ├── FinalCTASection.tsx
│   │   └── Footer.tsx
│   └── ui/                 # Reusable UI components
│       ├── button.tsx
│       ├── card.tsx
│       ├── tabs.tsx
│       └── badge.tsx
└── lib/
    └── utils.ts            # Utility functions
```

## Design Principles

- **Premium & Minimal**: Clean design without loud colors or gimmicks
- **School-Friendly**: Professional, trustworthy appearance
- **Mobile-First**: Responsive design that works on all devices
- **Performance**: Optimized for low-end devices and slow internet
- **Accessibility**: Semantic HTML and proper color contrast

## Sections

The landing page includes 11 sections in this exact order:

1. Hero Section
2. Problem Section
3. Solution Section
4. Features Section
5. Role-Based Demo Section
6. Why Schools Choose Us
7. How It Works
8. Pricing Teaser
9. Trust & Credibility
10. Final CTA
11. Footer

## Customization

All sections are modular and can be easily customized. Update the content in each section component file to match your needs.

## License

Private - All rights reserved

