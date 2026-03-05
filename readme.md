# Nestify - Your Modern Real Estate Platform

Welcome to **Nestify**! A sleek, modern web application that connects property seekers with their dream homes. Whether you're looking to buy, rent, or list properties, Nestify makes the entire process simple and enjoyable.

---

## What is Nestify?

Nestify is a full-featured real estate marketplace built with clean, modern web technologies. It's designed to make finding and managing properties as easy as possible for both buyers/renters and landlords.

### Key Features

- **Smart Property Search** - Find properties by location, type, bedrooms, and price range
- **Dual User Roles** - Sign up as a tenant or landlord with different dashboards
- **Landlord Dashboard** - Manage your properties, track bookings, and view tenant information
- **Tenant Dashboard** - Manage favorites, bookings, and messages
- **Favorites & Bookings** - Save your favorite properties and make reservations
- **Checkout System** - Easy booking and rental transaction management
- **Dark/Light Theme** - Toggle between themes for comfortable browsing anytime
- **Fully Responsive** - Works beautifully on desktop, tablet, and mobile
- **Smooth Animations** - Fade-in animations and scroll effects
- **Lightning Fast** - No backend server needed - runs entirely in your browser!

---

## Project Structure

```
nestify/
├── index.html                 # Homepage - Hero section & search
├── properties.html            # Property listing & filtering page
├── about.html                 # About us page
├── contact.html               # Contact information
├── privacy.html               # Privacy policy
├── terms.html                 # Terms of service
├── style.css                  # Global styles & design system
├── media-query.css            # Responsive mobile styles
├── script.js                  # Main JavaScript - scroll effects, theme toggle
│
├── css/                       # Feature-specific styles
│   ├── auth.css              # Login/signup modal styles
│   ├── properties.css        # Properties page styles
│   ├── dashboard.css         # Dashboard layouts
│   ├── checkout.css          # Checkout form styles
│   ├── property-detail.css   # Property detail page styles
│   └── tenant-dashboard.css  # Tenant features styles
│
├── javascripts/               # Feature-specific functionality
│   ├── auth.js               # User authentication & registration
│   ├── properties.js         # Property search, filter, & display
│   ├── property-detail.js    # Single property page logic
│   ├── dashboard.js          # Landlord dashboard features
│   ├── tenants.js            # Tenant dashboard functionality
│   ├── checkout.js           # Booking & checkout logic
│   └── property-detail.js    # Property detail page
│
└── pages/                     # Protected user pages (require login)
    ├── dashboard.html         # Landlord property management
    ├── property-detail.html   # Full property info page
    ├── tenant-dashboard.html # Tenant's personal space
    ├── checkout.html          # Booking confirmation page
    └── receipt.html          # Order receipt page
```

---

## Getting Started

### Prerequisites
- Any modern web browser (Chrome, Firefox, Safari, Edge, Opera)
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

## User Roles

### Tenant
- Browse and search properties for rent and sale
- View detailed property information
- Save properties to favorites
- Make rental or purchase bookings
- View booking history and status
- Manage profile settings

### Landlord
- Register with ID/business license verification
- List properties for rent or sale
- Add and edit property listings
- View and manage bookings
- Track property performance
- Manage availability and pricing

---

## Demo Information

This is a **frontend-only demonstration project** that uses browser localStorage for data persistence.

### Creating Demo Accounts:
1. Click "Sign Up" in the navigation
2. Enter your email, name, phone, and password
3. Select your role (Tenant or Landlord)
4. For Landlord role, optionally upload ID for verification
5. Click "Register" to create your account

### Testing Features:
- Browse properties without logging in
- Create an account to access dashboard features
- Add properties as a landlord
- Make bookings as a tenant
- Toggle dark/light mode
- Test responsive design on different screen sizes

---

## How It Works

### For Everyone
- **Dark/Light Mode**: Click the moon/sun icon in the navbar to toggle themes
- **Search & Filters**: Use location, property type, price, and listing type filters
- **Theme Persistence**: Your theme preference is saved automatically
- **Quick Filters**: Use chips on homepage for quick filtering

### For Tenants
- Save favorite properties (heart icon)
- View your upcoming and past bookings
- Proceed through checkout flow
- Manage your profile and preferences
- Contact landlords through messaging

### For Landlords
- Add and edit your property listings
- Track bookings and revenue
- Manage property availability
- View property statistics
- Respond to tenant inquiries

---

## Technology Stack

- **HTML5** - Semantic markup
- **CSS3** - Custom styles with CSS variables
- **JavaScript (ES6+)** - Vanilla JavaScript, no frameworks
- **Font Awesome 6.4** - Icons
- **Google Fonts (Inter)** - Typography
- **Unsplash** - Property images
- **localStorage** - Data persistence

### Key CSS Techniques
- CSS Grid for complex layouts
- CSS Flexbox for alignment
- CSS Custom Properties (variables)
- CSS Animations and Transitions
- Media Queries for responsive design
- Dark mode with data-theme attribute

---

## Pages Explained

| Page | Purpose |
|------|---------|
| **index.html** | Landing page with hero section, search, and featured listings |
| **properties.html** | Browse all available properties with advanced filters |
| **property-detail.html** | View detailed information about a specific property |
| **about.html** | Learn about Nestify's mission, stats, and team |
| **contact.html** | Get in touch with customer support |
| **pages/dashboard.html** | Landlord's management hub |
| **pages/tenant-dashboard.html** | Tenant's personal space for favorites and bookings |
| **pages/checkout.html** | Booking confirmation and payment |
| **pages/receipt.html** | Order confirmation receipt |

---

## Design Features

- **Responsive Layout** - Adapts to any screen size (mobile, tablet, desktop)
- **Smooth Animations** - Scroll-triggered fade-in animations
- **Dark Mode** - Easy on the eyes for night browsing
- **Modern UI** - Clean, professional design
- **Accessible** - Keyboard navigation support
- **Performance** - Lightweight and fast-loading

---

## Data Storage

Nestify uses the **browser's LocalStorage** to persist data:
- User accounts and profiles
- Property listings
- Bookings and reservations
- Favorite properties
- Theme preference

*Note: Data is stored locally on your device. Clearing browser data will reset everything.*

---

## Authentication

Simple, role-based authentication system:
- Sign up with email and password
- Choose your role (Tenant or Landlord)
- Landlord verification upload option (ID/Business License)
- Login to access personalized features
- Forgot password flow (UI demonstration)
- Session management

---

## Key Functionalities

### Property Search
- Search by location (city, neighborhood)
- Filter by property type (house, apartment, condo, villa, studio, office)
- Filter by listing type (for rent, for sale)
- Sort by price (low to high, high to low)
- Quick filter chips on homepage

### Booking Flow
1. Browse and find a property
2. View property details
3. Select booking type (rent/buy)
4. Choose dates (for rentals)
5. Proceed to checkout
6. Enter payment information (simulated)
7. Receive confirmation

### Dashboard Features
- Overview statistics and metrics
- Property management (CRUD)
- Booking management and tracking
- Favorites management
- Profile settings

---

## Limitations

This is a **frontend-only demonstration project**. The following are NOT implemented:

- ❌ **Backend Server** - No server-side processing
- ❌ **Real Database** - Data stored in browser localStorage only
- ❌ **Real Authentication** - No actual email verification or secure password storage
- ❌ **Real Payments** - Checkout is simulated, no actual transactions occur
- ❌ **Image Uploads** - File upload UI only, nothing is actually stored
- ❌ **Email Notifications** - No actual emails sent
- ❌ **Live Search** - All filtering is client-side only
- ❌ **Security** - No real security measures (JWT, encryption, etc.)

### For Production Use
To convert this into a production-ready application, you would need:
- Backend API (Node.js, Python, PHP, etc.)
- Database (PostgreSQL, MySQL, MongoDB)
- Secure authentication system
- Payment integration (Stripe, PayPal)
- Email service (SendGrid, Mailgun)
- Image hosting (AWS S3, Cloudinary)
- SSL/HTTPS certificate
- Security best practices

---

## Browser Support

- ✅ Chrome (latest)
- ✅ Firefox (latest)
- ✅ Safari (latest)
- ✅ Edge (latest)
- ✅ Opera (latest)

---

## External Resources

### Fonts
- **Inter** - Google Fonts (https://fonts.google.com/specimen/Inter)

### Icons
- **Font Awesome 6.4** - CDN (https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css)

### Images
- **Unsplash** - Property images from Unsplash (https://unsplash.com)
- Various Unsplash photographers for property exterior/interior images

---

## Contributing

To improve Nestify:
1. Identify areas for improvement
2. Create a new branch for your changes
3. Test thoroughly on mobile and desktop
4. Keep the design consistent
5. Document any new features

---

## Future Enhancements

Potential features to add in future versions:
- Backend API integration for real data
- Payment processing (Stripe, PayPal)
- Email notifications
- Advanced analytics dashboard
- Virtual property tours
- Real-time messaging between users
- Review and rating system
- Map-based property search
- Landlord verification system
- Multi-language support

---

## Legal

- **Privacy Policy** - See [privacy.html](privacy.html)
- **Terms of Service** - See [terms.html](terms.html)
- **Contact Us** - See [contact.html](contact.html)

---

## About Nestify

Founded in 2026, Nestify is a modern real estate platform dedicated to simplifying the property search process. Our mission is to make finding the perfect home accessible to everyone, everywhere. We believe in transparency, efficiency, and putting users first.

---

## Support

Have questions or need help? Visit our [Contact Page](contact.html) or check out our [About Page](about.html) to learn more about us.

---

**Project Status:** Complete MVP
**Last Updated:** March 2026
**Version:** 1.0.0

Happy house hunting! 🏠
