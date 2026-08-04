Minimal Next.js Project (Flowy)

Quick Start:

1. Install dependencies:

```bash
pnpm install
```

2. Set up environment variables:

```bash
cp .env.example .env
```

Edit `.env` with your actual values (Supabase, Database URL, etc.)

3. Run in development:

```bash
pnpm dev
```

4. Open http://localhost:3000

## Deployment on Vercel

### Preparation

1. Make sure you've created the GitHub repository and pushed the code
2. Create a [Vercel](https://vercel.com) account if you don't have one
3. Install the Vercel integration on your GitHub repository

### Environment Variables Configuration

In Vercel, go to `Settings > Environment Variables` and add the following variables:

- `DATABASE_URL` - Your PostgreSQL database URL
- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` - Supabase publishable key (optional)
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key
- `CRON_SECRET` - A random string to protect your cron endpoints

### Deployment

1. In Vercel, click on "Add New Project"
2. Import your GitHub repository
3. Vercel will automatically detect it's a Next.js project
4. Configure the environment variables
5. Click on "Deploy"

The project will deploy automatically. Vercel will run:
- `pnpm install` to install dependencies
- `prisma generate` to generate the Prisma client
- `pnpm build` to build the application

### Database

This project uses Prisma with PostgreSQL. Make sure to:
1. Have a PostgreSQL database configured
2. Configure the `DATABASE_URL` correctly in Vercel

**Note:** If you encounter cross-schema reference errors during deployment (common with Supabase), the existing migrations will still work. The error only affects schema introspection operations like `db:push`, not the migration deployment process.

### Useful Commands

```bash
# Check types
pnpm typecheck

# Linting
pnpm lint

# Format code
pnpm format

# Generate Prisma client
pnpm db:generate

# Deploy migrations to production
pnpm prisma migrate deploy
```

Start editing `src/app/page.tsx` and `src/app/layout.tsx`.

This template is designed as a starting point: clean, with `pnpm` and TypeScript support.
