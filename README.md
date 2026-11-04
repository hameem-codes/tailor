# Tailor — Cross-Brand Clothing Size Finder

**Tailor** is a client-side, cross-brand clothing size finder web application built with **React**, **Vite**, **TypeScript**, and **Tailwind CSS**. A user enters their body measurements once and immediately sees their recommended size across major clothing brands (since a "Medium" differs dramatically between labels).

Designed according to the dark frosted-glass visual specification with matching engine, multi-device responsiveness (320px–1440px+), and full WCAG AA accessibility.

---

## 🚀 Key Features

- **Dark Glass Design System**: Frosted glass cards (`rgba(32,32,35,0.82)`, `backdrop-blur 24px`, radius 28px) with custom radial gradient background (`#454b52` → `#141517` → `#0a0a0b`).
- **Barlow Condensed + Inter Typography**: Bold sizing numbers and headings in `Barlow Condensed` (weights 500, 600), UI and body typography in `Inter`.
- **Pure TypeScript Matching Engine**: Multi-dimensional distance scoring based on body measurements with garment ease allowances, fit preference leaning (Snug / Regular / Loose), and boundary tolerance.
- **Micro-Animations & Visual Range Ruler**: Thin track with brand size range bar and white indicator dot with "You: XX cm" label. Shimmering skeleton loading cards.
- **Interactive Brand Detail**: Real-time S / M / L size selector chips updating the dynamic headline verdict, size display, range ruler, body vs garment dimensions, stats row, and highlighted table rows.
- **Local Persistence**: Zero backend, zero account tracking. All preferences, last-entered measurements, feedback, and saved brands are stored locally on device via safe `localStorage` wrappers.
- **100% Responsive Layouts**:
  - **Mobile (320px–767px)**: 390px single-column layout with bottom-safe-area padding.
  - **Tablet (768px–1199px)**: Centered container up to 720px.
  - **Desktop (1200px+)**: Two-pane workspace featuring sticky left input panel, middle results list, and slide-in Brand Detail drawer.

---

## 📦 Tech Stack

- **Framework**: React 19 + TypeScript + Vite 6
- **Styling**: Tailwind CSS + Custom Design System tokens
- **Icons**: Inline SVGs & Lucide React (no emoji icons)
- **Unit Testing**: Vitest 3.x
- **Data Validation & Scraping**: Python 3.14 (Playwright + BeautifulSoup)

---

## 🛠️ Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Development Server
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

### 3. Production Build & Preview
```bash
npm run build
npm run preview
```

### 4. Run Unit Tests
```bash
npm run test
```
Or in watch mode:
```bash
npm run test:watch
```

---

## 📊 Data Schema (`public/data/sizes.json`)

All brand charts are stored in `public/data/sizes.json`. Each entry matches this schema:

```json
{
  "id": "hm",
  "brand": "H&M",
  "region": "global",
  "gender": "men",
  "category": "t-shirt",
  "fit": "regular",
  "chartType": "body",
  "unit": "cm",
  "source": "H&M Size Guide (Sample Data)",
  "sourceUrl": "https://www2.hm.com/en_us/customer-service/sizeguide.html",
  "updated": "Nov 2026",
  "brandUrl": "https://www2.hm.com",
  "sizes": [
    { "label": "S", "chest": [88, 95], "waist": [76, 81], "garmentChest": [96, 103] },
    { "label": "M", "chest": [96, 103], "waist": [82, 89], "garmentChest": [104, 111] },
    { "label": "L", "chest": [104, 111], "waist": [90, 97], "garmentChest": [112, 119] }
  ]
}
```

### Field Definitions:
- `id`: Unique identifier string (e.g. `brand_category`).
- `brand`: Brand display name.
- `region`: `"global"` | `"local"`.
- `gender`: `"men"` | `"women"` | `"unisex"`.
- `category`: `"t-shirt"` | `"shirt"` | `"pants"` | `"jacket"`.
- `fit`: `"regular"` | `"slim"` | `"relaxed"`.
- `chartType`: `"body"` (dimensions measure the human body) or `"garment"` (dimensions measure the clothes flat circumference).
- `sizes`: Array of sizes with min/max ranges in cm.

> **Note**: Clearly marked in the UI footer as sample illustrative data for portfolio demonstration purposes.

---

## 🐍 Python Scripts (`/scripts`)

### 1. Validate Size Data
Checks schema integrity, required fields, inverted ranges (`min > max`), and realistic human boundaries (e.g. chest 50–200 cm, waist 40–180 cm):
```bash
py scripts/validate_sizes.py
```
Or via npm:
```bash
npm run validate:data
```

### 2. Scraper Skeleton
Extracts size charts dynamically using Playwright and BeautifulSoup, parses ranges, normalizes inches to cm, and updates `sizes.json`:
```bash
py scripts/scraper_skeleton.py --brand "H&M" --category "t-shirt" --url "https://brand.example.com/size-guide"
```

### How to Add a New Brand:
1. Open `public/data/sizes.json`.
2. Add a new object to the `"brands"` array with the required fields: `id`, `brand`, `region`, `gender`, `category`, `fit`, `chartType`, `unit`, `source`, `updated`, `brandUrl`, and `sizes`.
3. Ensure measurements are standardized in centimeters (`[min, max]`).
4. Run `npm run validate:data` to verify the entry passes all validation checks.

---

## 🧮 Matching Engine Architecture

The matching engine in [`src/lib/matching/engine.ts`](file:///c:/Users/matee/OneDrive/Desktop/Resume Tools/Projects/Tailor/src/lib/matching/engine.ts) operates in 8 stages:

1. **Input Normalization**: Converts all heights, weights, and girth dimensions to metric centimeters/kilograms internally.
2. **Filtering**: Filters brand charts by selected clothing category and gender (with unisex interoperability).
3. **Missing Data Handling & Confidence**:
   - Both chest & waist present: **High confidence** (`"Based on chest and waist"`).
   - Only chest present: **Medium confidence** (`"Based on chest only"`).
   - Neither chest nor waist present: Estimates dimensions via BMI and anthropometric body proportion regressions, marked as **Low confidence** (`"Estimated from height and weight"`).
4. **Garment Ease Compensation**: Automatically deducts standard ease allowances (4–16 cm depending on fit and garment category) when comparing body measurements to garment-measured charts.
5. **Distance Computation**: Computes exact cm difference outside range:
   $$\text{dist} = \begin{cases} 0 & \text{if } \text{min} \le \text{user} \le \text{max} \\ \text{min} - \text{user} & \text{if } \text{user} < \text{min} \\ \text{user} - \text{max} & \text{if } \text{user} > \text{max} \end{cases}$$
6. **Weighted Scoring**:
   - Tops/Jackets: Chest weighted 0.7, Waist weighted 0.3.
   - Pants: Waist weighted 0.6, Hips weighted 0.4.
7. **Fit Preference Leaning**: If the user is within 2 cm of a size boundary, choosing `"snug"` leans to the smaller adjacent size, while `"loose"` leans to the larger size.
8. **Match Classification**:
   - **Great match** (Green checkmark): User falls inside range or score $\le 1.0\text{ cm}$.
   - **Between sizes** (Amber triangle): User falls in the transition gap between two sizes where both are within $\approx 2.5\text{ cm}$. Recommends primary and notes neighbor (e.g. `S/M`).
   - **Poor match** (Red X): Nearest size is $> 4.0\text{ cm}$ away.

---

## 🌐 Deployment

### Cloudflare Pages
1. Push this repository to GitHub / GitLab.
2. Connect repository in Cloudflare Pages dashboard.
3. Build configuration:
   - **Framework preset**: `Vite`
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
4. Deploy!

### Vercel
1. Run `npx vercel` or import repository on [vercel.com](https://vercel.com).
2. Vercel automatically detects Vite.
3. Build command: `npm run build`, output: `dist`.
4. Deploy!

---

## 🎨 Design Alignment & Decisions

1. **Visual Source of Truth**: The colors, glassmorphism backdrop blurs (`rgba(32,32,35,.82)`, blur 24px), border radiuses (`28px`), typography (`Barlow Condensed` + `Inter`), range ruler styling, and micro-animations were matched directly from the visual export (`Tailor Dark Glass UI (4 screens).html`).
2. **Behavioral Source of Truth**: Dynamic features (unit toggle converting both height/weight and girth inputs, hips toggle dynamically appearing for pants, dismissible tips with localStorage persistence, search & filter combinations, and responsive desktop two-pane drawers) were built according to the PRD.
3. **Accessibility**: Visible green focus rings (`#4ADE80`), full keyboard navigation, `aria-live="polite"` status announcements on loading screens, screen-reader labels on all circular icon buttons, and non-color-dependent status indicators (icons + text + colors).

