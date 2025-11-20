# MassHealth

<div align="center">
  
  ![MassHealthLogo](https://github.com/user-attachments/assets/adec8c01-50f1-4ec8-a719-44a9f8afe492)
  
  **Personalized fitness tracking and workout planning application**
  
  [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
  [![React](https://img.shields.io/badge/React-20232A?style=flat&logo=react&logoColor=61DAFB)](https://reactjs.org/)
  [![Supabase](https://img.shields.io/badge/Supabase-181818?style=flat&logo=supabase&logoColor=white)](https://supabase.com/)
  [![Docker](https://img.shields.io/badge/Docker-2CA5E0?style=flat&logo=docker&logoColor=white)](https://www.docker.com/)

</div>

## 📋 Overview

MassHealth is a comprehensive fitness application designed to help users improve their health and physical fitness through personalized workout routines and rivalries. The application combines various types of exercises - from running to strength training - adapting to the user's health status and fitness level.

### ✨ Key Features

- **Personalized Workout Routines** - Tailored to individual fitness levels and health conditions
- **Exercise Database** - Comprehensive collection sourced from [Muscle Wiki](https://musclewiki.com), [Muscle & Strenght](https://www.muscleandstrength.com) and [Free Exercise DB](https://github.com/drksv/free-exercise-gym?tab=readme-ov-file)
- **GPS Tracking** - Monitor and visualize your running routes
- **Progress Analytics** - Track your improvement over time with detailed visualizations
- **Cross-Platform** - Available on iOS, Android, web, and tablets
- **Rivalries** - Get motiated by inviting your friends to a little friendly competition!

## 🚀 Getting Started

### Prerequisites

TBA (hopefully only phone)

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd masshealth
   ```

2. **Access the app through setup.bat**
   Click twice on setup.bat to run it, read the screen instructions to run the app, don't forget to open MQTT explorer and connect on localhost as 'host'

## Project history

Project history from the year 2025 to 2026

### Phase 1: System Setup & Infrastructure

- Jira task management
- GitHub repository setup
- React application foundation
- Supabase backend with Docker
- Technical documentation

### Phase 2: Feature Development

- Core application logic
- Web scraper for exercise data
- Mobile-responsive UI
- Two-factor authentication
- GPS integration with MQTT protocol

### Phase 3: Porting and rescoping

- Reimplement app
- Implement MQTT through HiveMQ
- Database in the cloud with Supabase and Django
- Implementing admin panel in Varcel

## 🧩 Use Cases

- **Fitness Improvement** - Get a personalized program based on your current fitness level
- **Specialized Training** - Explore specific workout types (calisthenics, HIIT, yoga)
- **Adapted Exercise** - Safe routines for users with health limitations
- **Custom Workouts** - Create your own exercise routines from our database
- **Running Progress** - Track your routes, pace, time, and calories burned

## 🎨 Design

MassHealth features a modern, minimalist design with:

- A color scheme combining purple (symbolizing strength and balance) and green (representing health and vitality)
- Clean lines and interactive animations (Inspired by fitness apps and duolingo)
- Light mode with dark mode option
- Tag-based filtering system for exercises

## 🛠️ Tech Stack

- **Frontend**: React
- **Backend**: Supabase
- **Authentication**: SSO (Google, Apple, Microsoft) with Face Recognition option
- **Containerization**: Docker
- **Task Management**: Jira
- **Version Control**: GitHub
- **Development Environment**: Visual Studio Code
- **Testing**: Jest, Cypress
- **Monitoring**: Sentry/LogRocket
