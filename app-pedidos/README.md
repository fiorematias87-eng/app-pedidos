# Delivery Management Platform

## Overview
This project is a comprehensive delivery management platform designed to facilitate the operations of clients, administrators, and drivers. Built using React, TypeScript, and Tailwind CSS, it leverages Supabase for real-time data handling and provides a seamless user experience across three distinct interfaces.

## Features
- **Client Interface:**
  - Dynamic product catalog with search and filter options.
  - Real-time cart updates and checkout process with GPS location capture.
  - Live order tracking with a progress bar.

- **Admin Interface:**
  - Swipeable container for managing product catalogs and kitchen display systems (KDS).
  - Kanban-style KDS board with audio/visual alerts for new orders.
  - Analytics panel displaying key performance indicators.

- **Driver Interface:**
  - Lightweight mobile interface for managing deliveries.
  - Real-time updates on assigned orders.
  - Secure delivery confirmation with multiple verification options.

## Technologies Used
- **Frontend:** React, TypeScript, Tailwind CSS
- **Backend:** Supabase (PostgreSQL, Realtime)
- **State Management:** Redux
- **Routing:** React Router

## Project Structure
```
app-pedidos
├── public
│   └── index.html
├── src
│   ├── App.tsx
│   ├── main.tsx
│   ├── assets
│   │   └── styles
│   │       └── globals.css
│   ├── components
│   │   ├── common
│   │   │   ├── Button.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Modal.tsx
│   │   │   └── Spinner.tsx
│   │   ├── client
│   │   │   ├── CatalogView.tsx
│   │   │   ├── CartPanel.tsx
│   │   │   ├── CheckoutForm.tsx
│   │   │   ├── LiveTrackerPanel.tsx
│   │   │   └── SearchFilters.tsx
│   │   ├── admin
│   │   │   ├── SwipeContainer.tsx
│   │   │   ├── CatalogManager.tsx
│   │   │   ├── KdsBoard.tsx
│   │   │   ├── DispatchModal.tsx
│   │   │   └── AnalyticsPanel.tsx
│   │   └── driver
│   │       ├── DeliveryList.tsx
│   │       ├── DeliveryCard.tsx
│   │       ├── DeliveryModal.tsx
│   │       └── NavigationButton.tsx
│   ├── pages
│   │   ├── ClientExperiencePage.tsx
│   │   ├── AdminOperationsPage.tsx
│   │   └── DriverDashboardPage.tsx
│   ├── routes
│   │   └── index.tsx
│   ├── hooks
│   │   ├── useGeolocation.ts
│   │   ├── useRealtimeOrders.ts
│   │   └── useSupabaseChannel.ts
│   ├── services
│   │   ├── supabaseClient.ts
│   │   ├── realtimeService.ts
│   │   ├── ordersService.ts
│   │   ├── productsService.ts
│   │   └── driversService.ts
│   ├── store
│   │   ├── index.ts
│   │   ├── slices
│   │   │   ├── clientSlice.ts
│   │   │   ├── adminSlice.ts
│   │   │   └── driverSlice.ts
│   │   └── selectors
│   │       └── index.ts
│   ├── types
│   │   └── delivery.ts
│   ├── utils
│   │   ├── formatters.ts
│   │   ├── validators.ts
│   │   └── constants.ts
│   └── lib
│       └── environment.ts
├── package.json
├── tsconfig.json
├── vite.config.ts
├── tailwind.config.ts
├── postcss.config.js
└── README.md
```

## Getting Started
1. Clone the repository:
   ```
   git clone <repository-url>
   cd app-pedidos
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Set up environment variables for Supabase in a `.env` file:
   ```
   VITE_SUPABASE_URL=<your-supabase-url>
   VITE_SUPABASE_ANON_KEY=<your-anon-key>
   ```

4. Start the development server:
   ```
   npm run dev
   ```

## Contributing
Contributions are welcome! Please submit a pull request or open an issue for any enhancements or bug fixes.

## License
This project is licensed under the MIT License. See the LICENSE file for more details.