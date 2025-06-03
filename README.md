# Twitter Username History Checker

A sleek Next.js application to check Twitter/X users' historical usernames and current profile data.

## Features

- 🔍 **Real-time user lookup** - Get current Twitter profile data including followers, bio, verification status
- 📊 **Historical username tracking** - View past usernames (when available)
- ⚡ **Fast autocomplete** - Smart suggestions as you type
- 🎨 **Clean UI** - Modern, responsive design
- 🔒 **Server-side API keys** - Secure environment variable handling

## Tech Stack

- **Next.js 15** - React framework with App Router
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **TwitterAPI.io** - Real-time Twitter data
- **Memory.lol** - Historical username data

## Setup

1. Clone the repository:
```bash
git clone git@github.com:oxnr/twitter-checker.git
cd twitter-checker
```

2. Install dependencies:
```bash
yarn install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```

4. Get your TwitterAPI.io API key:
   - Sign up at [twitterapi.io](https://twitterapi.io)
   - Get $1 free credit
   - Add your API key to `.env.local`:
```bash
TWITTER_API_IO_KEY=your_api_key_here
```

5. Run the development server:
```bash
yarn dev
```

Visit [http://localhost:3000](http://localhost:3000) to use the app.

## API Endpoints

- `GET /api/search?username=USERNAME` - Search for user with historical data
- `GET /api/twitter-user?username=USERNAME` - Get current user profile
- `GET /api/autocomplete?q=QUERY` - Get username suggestions

## Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Connect repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

Environment variables needed for production:
- `TWITTER_API_IO_KEY` - Your TwitterAPI.io API key

## Cost

- TwitterAPI.io: $0.15 per 1k requests (very affordable)
- Vercel: Free tier available

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT License