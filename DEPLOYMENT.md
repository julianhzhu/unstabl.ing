# Production Deployment Guide

## Prerequisites

1. **MongoDB Atlas Account** (recommended for production)
2. **Vercel Account** (or your preferred hosting platform)
3. **Domain name** (optional but recommended)

## Environment Setup

### 1. MongoDB Atlas Setup
1. Create a MongoDB Atlas account at [mongodb.com/atlas](https://mongodb.com/atlas)
2. Create a new cluster
3. Create a database user with read/write permissions
4. Whitelist your IP addresses (or use 0.0.0.0/0 for Vercel)
5. Get your connection string

### 2. Environment Variables
Create a `.env.local` file with the following variables:

```bash
# NextAuth Configuration
NEXTAUTH_URL=https://your-domain.com
NEXTAUTH_SECRET=your-super-secure-secret-here

# MongoDB
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/usduc-ideas?retryWrites=true&w=majority

# Production flags
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

## Deployment Options

### Option 1: Vercel (Recommended)

1. **Connect your repository to Vercel:**
   ```bash
   npm install -g vercel
   vercel login
   vercel
   ```

2. **Set environment variables in Vercel dashboard:**
   - Go to your project settings
   - Add all environment variables from `.env.local`

3. **Deploy:**
   ```bash
   vercel --prod
   ```

### Option 2: Docker

1. **Create Dockerfile:**
   ```dockerfile
   FROM node:18-alpine AS deps
   WORKDIR /app
   COPY package*.json ./
   RUN npm ci --only=production

   FROM node:18-alpine AS builder
   WORKDIR /app
   COPY . .
   COPY --from=deps /app/node_modules ./node_modules
   RUN npm run build

   FROM node:18-alpine AS runner
   WORKDIR /app
   ENV NODE_ENV production
   RUN addgroup --system --gid 1001 nodejs
   RUN adduser --system --uid 1001 nextjs
   COPY --from=builder /app/public ./public
   COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
   COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
   USER nextjs
   EXPOSE 3000
   ENV PORT 3000
   CMD ["node", "server.js"]
   ```

2. **Build and run:**
   ```bash
   docker build -t usduc-ideas .
   docker run -p 3000:3000 usduc-ideas
   ```

## Pre-deployment Checklist

- [ ] All environment variables configured
- [ ] MongoDB connection tested
- [ ] Build passes without errors: `npm run build`
- [ ] TypeScript checks pass: `npm run typecheck`
- [ ] Linting passes: `npm run lint`
- [ ] Test the app locally: `npm run preview`

## Post-deployment

1. **Test all functionality:**
   - User registration/login
   - Idea posting
   - Voting system
   - Reply system
   - Load more functionality

2. **Monitor performance:**
   - Check Vercel analytics
   - Monitor MongoDB Atlas metrics
   - Set up error tracking (Sentry recommended)

3. **SEO Setup:**
   - Update `robots.txt` with your domain
   - Update `next-sitemap.config.js` with your domain
   - Submit sitemap to Google Search Console

## Security Considerations

- [ ] Use strong, unique secrets for NEXTAUTH_SECRET
- [ ] Enable MongoDB Atlas IP whitelisting
- [ ] Use HTTPS in production
- [ ] Regularly update dependencies
- [ ] Monitor for security vulnerabilities

## Performance Optimization

- [ ] Enable Vercel Analytics
- [ ] Set up CDN for static assets
- [ ] Monitor Core Web Vitals
- [ ] Optimize images (if any are added)
- [ ] Consider implementing caching strategies

## Backup Strategy

- [ ] Set up MongoDB Atlas automated backups
- [ ] Export database regularly
- [ ] Keep code repository backed up
- [ ] Document deployment process

## Monitoring & Maintenance

- [ ] Set up uptime monitoring
- [ ] Configure error tracking
- [ ] Monitor database performance
- [ ] Regular dependency updates
- [ ] Performance monitoring