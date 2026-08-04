# High-Performance Delivery Ecosystem

## Overview
This project is a high-performance delivery ecosystem built with React and TypeScript. It consists of three main applications: Client App, Admin Control Center, and Driver App. Each application is designed to provide a seamless experience for users, administrators, and drivers.

## Project Structure
The project is organized into the following main directories:

- **public**: Contains the main HTML file that serves as the entry point for the React application.
- **src**: Contains all the source code for the application, including components, pages, services, store, and utilities.
  - **components**: Contains reusable components categorized by their usage (common, client, admin, driver).
  - **pages**: Contains the main page components for each application.
  - **services**: Contains functions for API calls and delivery operations.
  - **store**: Contains the Redux store setup and slices for state management.
  - **types**: Centralizes TypeScript types used throughout the application.
  - **utils**: Contains utility functions for data formatting.

## Getting Started

### Prerequisites
- Node.js (version 14 or higher)
- npm (Node package manager)

### Installation
1. Clone the repository:
   ```
   git clone <repository-url>
   ```
2. Navigate to the project directory:
   ```
   cd app-pedidos
   ```
3. Install the dependencies:
   ```
   npm install
   ```

### Running the Application
To start the development server, run:
```
npm run dev
```
The application will be available at `http://localhost:3000`.

### Building for Production
To build the application for production, run:
```
npm run build
```
The production files will be generated in the `dist` directory.

## Components Overview
- **Client App**: Integrates the Menu Catalog and Order Tracker for customers to browse and track their orders.
- **Admin Control Center**: Provides a Dashboard Panel and Fleet Monitor for administrators to manage operations and monitor the fleet.
- **Driver App**: Features Delivery Updates and Route Navigator for drivers to receive real-time updates and navigate efficiently.

## Contributing
Contributions are welcome! Please open an issue or submit a pull request for any enhancements or bug fixes.

## License
This project is licensed under the MIT License. See the LICENSE file for more details.