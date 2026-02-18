# Performance Audit

## Bundle Analysis

### Setup
```bash
ANALYZE=true pnpm --filter web build
```

This opens a bundle analysis report in the browser showing package sizes.

### Optimizations Applied

1. **`optimizePackageImports`** for `lucide-react` and `recharts` - Enables tree-shaking for barrel exports, reducing bundle size significantly

2. **Dynamic imports for Recharts** - Chart components are loaded lazily since they're below the fold on dashboard pages

3. **Next.js font optimization** - `next/font/google` handles Inter font with automatic self-hosting and zero layout shift

### Core Web Vitals Baseline

Target metrics:
- **LCP** (Largest Contentful Paint): < 2.5s
- **FID** (First Input Delay): < 100ms
- **CLS** (Cumulative Layout Shift): < 0.1
- **INP** (Interaction to Next Paint): < 200ms

### Key Bundle Components

| Package | Purpose | Optimization |
|---------|---------|-------------|
| `recharts` | Dashboard charts | Dynamic import, optimizePackageImports |
| `lucide-react` | Icons | optimizePackageImports (tree-shaking) |
| `@tanstack/react-table` | Data tables | Used on multiple pages |
| `react-hook-form` | Form handling | Used on multiple pages |
| `@clerk/nextjs` | Authentication | Required at runtime |
| `drizzle-orm` | Database ORM | Server-only |

### Recommendations

1. Monitor bundle size with each release using `ANALYZE=true pnpm build`
2. Keep `recharts` dynamically imported on dashboard pages
3. Consider code-splitting large page components if they exceed 100KB
4. Use `next/image` for any user-uploaded images in the future
5. Enable HTTP/2 push for critical CSS/JS bundles via Cloudflare
