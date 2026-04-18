# Bursa Intelligence

A comprehensive stock market intelligence dashboard for analyzing investor data from the Indonesia Stock Exchange (IDX).

## Features

- **Dashboard Overview** - Key metrics including AUM, data integrity, and investor statistics
- **Company Analysis** - Detailed shareholder composition and ownership breakdown
- **Investor Tracking** - Investor profiles with holdings and transaction history
- **Search** - Quick search across companies and investors
- **Visualizations** - Interactive charts and network graphs for ownership analysis

## Tech Stack

- **Framework**: Next.js 16
- **Language**: TypeScript
- **Database**: Supabase
- **Charts**: Chart.js, React Force Graph
- **Styling**: Tailwind CSS
- **State**: TanStack Query

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
```bash
cp .env.example .env.local
```

Add your Supabase credentials to `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

3. Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
src/
├── app/              # Next.js App Router pages
│   ├── api/          # API routes
│   ├── company/      # Company analysis pages
│   ├── investor/    # Investor detail pages
│   ├── data/        # Data management
│   ├── visualize/   # Visualization tools
│   └── page.tsx     # Main dashboard
├── components/       # React components
│   ├── charts/      # Chart components
│   ├── data-table/  # Table components
│   └── network-graph/ # Graph components
├── lib/            # Utilities and configs
│   ├── queries/    # Data fetching queries
│   ├── supabase/   # Supabase client
│   └── utils.ts   # Helper functions
└── workers/       # Web workers
```

## License

MIT