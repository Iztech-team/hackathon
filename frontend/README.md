# Code For Hebron Hackathon Management App

A complete hackathon management system built with React, featuring team registration, leaderboard tracking, and a judge panel with QR code scanning.

## Features

### 1. Team Registration
- Register teams with team name, project name, members, and description
- Automatically generates unique QR codes for each team
- Display QR code for teams to print/save for judge scanning

### 2. Leaderboard
- Real-time leaderboard showing all teams ranked by score
- Medal indicators for top 3 teams
- Live score updates as judges award points

### 3. Judge Panel
- QR code scanner using device camera
- Scan team badges to identify teams
- Award custom point values to teams
- Manual team ID entry as fallback
- Instant score updates

## Tech Stack

- **React 18** - UI framework
- **Vite** - Build tool
- **React Router DOM** - Routing
- **Tailwind CSS** - Styling
- **Radix UI** - Accessible component primitives
- **qrcode.react** - QR code generation
- **html5-qrcode** - QR code scanning
- **class-variance-authority** - Component variants
- **LocalStorage** - Data persistence

## Design System

Follows the UI-DESIGN-SYSTEM.md guidelines:
- Dark-first theme with deep black backgrounds
- Emerald primary color (#10b981)
- Glass morphism effects
- HSL color tokens
- Smooth transitions and interactions

## Getting Started

### Install Dependencies
```bash
npm install
```

### Run Development Server
```bash
npm run dev
```

### Build for Production
```bash
npm run build
```

### Preview Production Build
```bash
npm run preview
```

## Usage

1. **Register Teams**: Navigate to the registration page and fill out team details
2. **Generate QR Codes**: After registration, teams receive a unique QR code to print
3. **Judge Scanning**: Judges use the Judge Panel to scan team badges and award points
4. **View Leaderboard**: Check real-time rankings on the leaderboard page

## Data Persistence

All team data and scores are stored in browser localStorage, so data persists across page refreshes.

## Camera Permissions

The Judge Panel requires camera access to scan QR codes. Make sure to grant camera permissions when prompted.
