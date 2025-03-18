# Beauty Clinic Appointment App

A modern Progressive Web App (PWA) for booking and managing beauty clinic appointments. This application allows clients to browse services, book appointments with preferred staff, and manage their profile and appointments.

## Features

- **Service Browsing**: View available beauty services with details and pricing
- **Appointment Booking**: Book appointments with preferred staff members
- **Profile Management**: Manage personal information and preferences
- **Appointment Management**: View, reschedule, and cancel appointments
- **Progressive Web App**: Install on mobile devices for offline access
- **Responsive Design**: Works on desktop, tablet, and mobile devices

## Technologies Used

- **Next.js**: React framework for server-side rendering and static site generation
- **Prisma**: Database ORM for type-safe database access
- **Tailwind CSS**: Utility-first CSS framework for styling
- **IndexedDB**: Browser database for offline data storage
- **Service Workers**: For offline functionality and PWA features

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Database Setup

This application uses Prisma with a database. To set up your database:

1. Create a `.env` file in the root directory
2. Add your database connection string as `DATABASE_URL`
3. Run `npx prisma migrate dev` to create the database tables
4. Run `npx prisma db seed` to seed the database with initial data

## Deploying to Vercel

To deploy this application to Vercel for access on your iPad or other devices:

1. Create a Vercel account at [vercel.com](https://vercel.com)
2. Install the Vercel CLI: `npm install -g vercel`
3. Run `vercel login` and follow the instructions
4. From the project directory, run `vercel` to deploy
5. Follow the prompts to configure your deployment
6. Once deployed, you can access your app from any device using the provided URL

Alternatively, you can deploy directly from the Vercel dashboard:

1. Push your code to a GitHub repository
2. In the Vercel dashboard, click "New Project"
3. Import your repository and configure the project
4. Deploy the application

## Installing on iPad

Once deployed, you can install the app on your iPad:

1. Open Safari and navigate to your deployed app URL
2. Tap the share button (square with arrow)
3. Scroll down and tap "Add to Home Screen"
4. Customize the name if desired and tap "Add"

The app will now be available as an icon on your home screen, and many features will work offline.

## License

This project is licensed under the MIT License.
