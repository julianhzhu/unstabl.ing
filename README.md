# $USDUC - UNSTABLE COIN IDEAS 🚀💥

A DEGEN community platform for posting and voting on ideas for the $USDUC unstable coin. Built with Next.js, NextAuth, MongoDB, and Tailwind CSS.

## Features

- 🔥 **DEGEN MODE** - Ultra-maniacal styling with gradients, animations, and chaos
- 🐦 **Twitter OAuth** - Login with your Twitter account
- 💡 **Idea Posting** - Share your unstable coin ideas
- 🚀💥 **STABLE/UNSTABLE Voting** - Vote ideas as STABLE or UNSTABLE
- 💬 **Threaded Comments** - Reddit-style threaded discussions
- 📱 **Responsive Design** - Works on all devices
- ⚡ **Real-time Updates** - Instant voting and posting

## Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript
- **Styling**: Tailwind CSS with custom DEGEN animations
- **Authentication**: NextAuth.js with Twitter OAuth
- **Database**: MongoDB with Mongoose
- **Deployment**: Vercel-ready

## Quick Start

### 1. Clone the repository

```bash
git clone <your-repo-url>
cd usduc-ideas
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

Copy the example environment file:

```bash
cp env.example .env.local
```

Fill in your environment variables:

```env
# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-nextauth-secret-here

# MongoDB
MONGODB_URI=mongodb://localhost:27017/usduc-ideas

# Twitter OAuth
TWITTER_CLIENT_ID=your-twitter-client-id
TWITTER_CLIENT_SECRET=your-twitter-client-secret
```

### 4. Set up Twitter OAuth

1. Go to [Twitter Developer Portal](https://developer.twitter.com/)
2. Create a new app
3. Set up OAuth 2.0
4. Add callback URL: `http://localhost:3000/api/auth/callback/twitter`
5. Copy your Client ID and Client Secret to `.env.local`

### 5. Set up MongoDB

You can use:

- **Local MongoDB**: Install and run locally
- **MongoDB Atlas**: Free cloud database
- **Vercel MongoDB**: Integrated with Vercel deployment

### 6. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the DEGEN platform!

## Deployment

### Deploy to Vercel

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy!

### Environment Variables for Production

Make sure to update these for production:

```env
NEXTAUTH_URL=https://your-domain.vercel.app
NEXTAUTH_SECRET=your-production-secret
MONGODB_URI=your-production-mongodb-uri
TWITTER_CLIENT_ID=your-twitter-client-id
TWITTER_CLIENT_SECRET=your-twitter-client-secret
```

## Project Structure

```
├── pages/
│   ├── api/
│   │   ├── auth/[...nextauth].ts    # NextAuth configuration
│   │   └── ideas/                   # API routes for ideas
│   ├── auth/                        # Authentication pages
│   ├── _app.tsx                     # App wrapper
│   └── index.tsx                    # Main page
├── models/
│   ├── User.ts                      # User model
│   └── Idea.ts                      # Idea model
├── lib/
│   ├── db.ts                        # Database connection
│   ├── mongodb.ts                   # MongoDB client
│   └── withAuth.ts                  # Auth middleware
├── styles/
│   └── globals.css                  # Global styles with Tailwind
└── public/                          # Static assets
```

## API Endpoints

### Ideas

- `GET /api/ideas` - Get ideas with pagination and sorting
- `POST /api/ideas` - Create a new idea
- `POST /api/ideas/[id]/vote` - Vote on an idea (STABLE/UNSTABLE)

### Authentication

- `GET /api/auth/signin` - Sign in page
- `GET /api/auth/signout` - Sign out
- `GET /api/auth/session` - Get current session

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your DEGEN changes
4. Submit a pull request

## License

This project is for DEGENS only. Use at your own risk. No financial advice. Pure chaos.

## Disclaimer

$USDUC is a highly volatile meme coin with no intrinsic value, no utility beyond entertainment, and no expectation of financial return. This platform is for satirical and entertainment purposes only.

---

**🚀 GET RICH OR DIE TRYING 💥**

