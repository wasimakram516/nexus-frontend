# Nexus Frontend

A modern React and Next.js 16+ frontend application for the Nexus platform. This project uses the App Router with TypeScript for a type-safe, scalable user interface.

## Project Structure

```
src/
├── app/                  # Next.js App Router
│   ├── layout.tsx        # Root layout component
│   ├── page.tsx          # Home page
│   ├── globals.css       # Global styles
│   └── page.module.css   # Page-specific styles
└── ...
```

## Prerequisites

- Node.js 18+ (includes npm)
- Git

## Installation & Setup

1. Clone the repository:
   ```bash
   git clone <repo-url>
   cd nexus-frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   - Copy `.env.example` to `.env.local` (if available)
   - Configure backend API endpoint and other required variables

## Development

Start the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

The page will auto-reload when you make changes to files in `src/app/`.

## Building for Production

Build the application:

```bash
npm run build
```

Start the production server:

```bash
npm start
```

## Linting

Run ESLint to check for code quality issues:

```bash
npm run lint
```

## Backend Integration

This frontend works in conjunction with the Nexus backend:

**Backend Repository:** `D:\Wisemen Soft\Nexus\nexus-backend`

Ensure the backend server is running before developing or testing the frontend. Refer to the backend README for setup and installation instructions.

## Technologies

- **Next.js 16** - React framework with App Router
- **React 19** - UI library
- **TypeScript** - Type safety
- **ESLint** - Code linting
- **Babel React Compiler** - Performance optimization

## Deployment

This application can be deployed on [Vercel](https://vercel.com), which is optimized for Next.js applications.

For production deployments:
1. Build the application: `npm run build`
2. Deploy to your hosting platform (Vercel, AWS, Docker, etc.)

## Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [React Documentation](https://react.dev)
- [TypeScript Documentation](https://www.typescriptlang.org/docs)
