#  Nestify - Your Modern Real Estate Platform

Welcome to **Nestify**! A sleek, modern web application that connects property seekers with their dream homes. Whether you're looking to buy, rent, or list properties, Nestify makes the entire process simple and enjoyable.

---

##  What is Nestify?

Nestify is a full-featured real estate marketplace built with clean, modern web technologies. It's designed to make finding and managing properties as easy as possible for both buyers/renters and landlords.

###  Key Features

- **Smart Property Search** - Find properties by location, type, bedrooms, and price range
- **Dual User Roles** - Sign up as a tenant or landlord with different dashboards
- **Landlord Dashboard** - Manage your properties, track bookings, and view tenant information
- **Favorites & Bookings** - Save your favorite properties and make reservations
- **Checkout System** - Easy booking and rental transaction management
- **Dark/Light Theme** - Toggle between themes for comfortable browsing anytime
- **Fully Responsive** - Works beautifully on desktop, tablet, and mobile
- **Lightning Fast** - No backend server needed - runs entirely in your browser!

---

## Project Structure

```
nestify/
├── index.html                 # Homepage - Hero section & search
├── properties.html            # Property listing & filtering page
├── property-detail.html       # Individual property details
├── about.html                 # About us page
├── contact.html               # Contact information
├── privacy.html               # Privacy policy
├── terms.html                 # Terms of service
├── checkout.html              # Checkout/booking page
│
├── style.css                  # Global styles & design system
├── media-query.css            # Responsive mobile styles
├── script.js                  # Main JavaScript - scroll effects & navigation
│
├── css/                       # Feature-specific styles
│   ├── auth.css              # Login/signup modal styles
│   ├── properties.css        # Properties page styles
│   ├── dashboard.css         # Dashboard layouts
│   ├── checkout.css          # Checkout form styles
│   └── tenant-dashboard.css  # Tenant features styles
│
├── javascripts/              # Feature-specific functionality
│   ├── auth.js              # User authentication & registration
│   ├── properties.js        # Property search, filter, & display
│   ├── property-detail.js   # Single property page logic
│   ├── dashboard.js         # Landlord dashboard features
│   ├── tenant-dashboard.js  # Tenant dashboard/favorites
│   ├── checkout.js          # Booking & checkout logic
│   └── tenants.js           # Tenant management for landlords
│
└── pages/                    # Protected user pages (require login)
    ├── dashboard.html       # Landlord property management
    ├── property-detail.html # Full property info page
    ├── tenant-dashboard.html # Tenant's personal space
    └── checkout.html        # Booking confirmation page
```

---

##  Getting Started

### Prerequisites
- Any modern web browser (Chrome, Firefox, Safari, Edge)
- No server required - everything runs locally!

### How to Use

1. **Open the project** - Simply open `index.html` in your web browser
2. **Create an account** - Click "Sign Up" and choose your role:
   - **Tenant**: Looking to rent or buy properties
   - **Landlord**: Ready to list and manage properties
3. **Browse properties** - Visit the Properties page to search and filter
4. **Make bookings** - Click on a property to see details and book
5. **Manage your account** - Access your dashboard from the user menu

---

##  How It Works

### For Everyone
- **Dark/Light Mode**: Click the moon icon in the navbar to toggle themes
- **Search & Filters**: Use location, property type, price, and bedrooms filters
- **Theme Persistence**: Your theme preference is saved automatically

### For Tenants
-  Save favorite properties
-  View your upcoming bookings
-  Proceed through secure checkout
-  Manage your profile and preferences

### For Landlords
-  Add and edit your properties
-  Track bookings and revenue
-  Manage tenant information
-  View property statistics and insights

---

##  Technology Stack

- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Icons**: Font Awesome 6.4.0
- **Storage**: Browser LocalStorage (no database needed!)
- **Design**: Mobile-first, fully responsive
- **Animations**: Smooth scroll effects and parallax

---

##  Pages Explained

| Page | Purpose |
|------|---------|
| **index.html** | Landing page with hero section and quick search |
| **properties.html** | Browse all available properties with filters |
| **property-detail.html** | View detailed information about a specific property |
| **about.html** | Learn about Nestify's mission and team |
| **contact.html** | Get in touch with customer support |
| **dashboard.html** | Landlord's management hub |
| **tenant-dashboard.html** | Tenant's personal space for favorites and bookings |

---

## Design Features

- **Responsive Layout** - Adapts to any screen size
- **Smooth Animations** - Scroll-triggered animations for engaging UX
- **Accessibility** - Keyboard navigation and ARIA labels
- **Performance** - Lightweight and fast-loading
- **Dark Mode** - Easy on the eyes for night browsing

---

## Data Storage

Nestify uses **browser's LocalStorage** to persist data:
- User accounts and profiles
- Property listings
- Bookings and favorites
- Tenant information
- Search preferences

*Note: Data is stored locally on your device. Clearing browser data will reset everything.*

---

##  Authentication

Simple, secure authentication system:
- Sign up with email and password
- Choose your role (Tenant or Landlord)
- Landlord verification upload option
- Login to access personalized features
- Session management with automatic logout

---

##  Future Enhancements

Potential features to add:
- Backend API integration for real data
- Payment processing (Stripe, PayPal)
- Email notifications
- Advanced analytics dashboard
- Virtual property tours
- Real-time messaging between users
- Review and rating system

---

## Development Notes

### Key JavaScript Modules

- **script.js** - Global utilities (scroll effects, navbar animations)
- **auth.js** - Authentication and user management
- **properties.js** - Property search and filtering logic
- **dashboard.js** - Landlord dashboard functionality
- **checkout.js** - Booking and transaction processing

### CSS Organization

- **style.css** - Main components (navbar, buttons, cards)
- **media-query.css** - All responsive breakpoints
- **css/auth.css** - Modal and form styling
- **css/properties.css** - Listing page specific styles
- **css/dashboard.css** - Dashboard layouts

---

## Contributing

To improve Nestify:
1. Identify what needs improvement
2. Create a new branch for your changes
3. Test thoroughly on mobile and desktop
4. Keep the design consistent
5. Document any new features

---

##  Legal

- **Privacy Policy** - See [privacy.html](privacy.html)
- **Terms of Service** - See [terms.html](terms.html)
- **Contact Us** - See [contact.html](contact.html)

---

##  About Nestify

Founded in 2026, Nestify is a modern real estate platform dedicated to simplifying the property search process. Our mission is to make finding the perfect home accessible to everyone, everywhere. We believe in transparency, efficiency, and putting users first.

---

##  Support

Have questions or need help? Visit our [Contact Page](contact.html) or check out our [About Page](about.html) to learn more about us.

**Happy house hunting! **
