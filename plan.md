Absolutely. Here is the **final V1 plan** I would give directly to your AI coding agent. I’ve consolidated the previous plan and made the **Solar Calculator the core of SunVolt**, while keeping the e-commerce side deliberately simple.

# SUNVOLT

## Solar E-Commerce + Smart Backup Calculator

## 1. Project Objective

Build a modern, mobile-first Next.js website for **SunVolt**, a solar business selling ready-made solar backup packages.

The core business flow is:

**Customer selects appliances → enters required backup time → calculator determines energy requirement → SunVolt recommends the appropriate package → customer orders/contact SunVolt.**

The website should be simple enough for a non-technical customer.

Customers should NOT need to understand:

* Ah
* Wh
* battery chemistry
* MPPT
* charge-controller ratings
* battery calculations

unless they choose to view technical details.

---

# 2. Core Customer Journey

The primary journey must be:

```text
Homepage
    ↓
"আমার ব্যাকআপ হিসাব করুন"
    ↓
Select appliances
    ↓
Enter quantity
    ↓
Calculate total load
    ↓
Select backup hours
    ↓
Calculate required energy
    ↓
Check SunVolt packages
    ↓
Recommend suitable package
    ↓
View package
    ↓
Order / WhatsApp
```

Secondary journey:

```text
Homepage
    ↓
প্যাকেজ দেখুন
    ↓
Package Listing
    ↓
Package Details
    ↓
Order / WhatsApp
```

---

# 3. Technology Stack

Use:

* Next.js
* TypeScript
* App Router
* Tailwind CSS
* shadcn/ui
* Supabase
* PostgreSQL
* Supabase Storage
* Next.js Server Components
* Client Components only where interaction is required

Deployment:

* Vercel
* Supabase

The project must use environment variables for all credentials and configuration.

---

# 4. Website Language

Customer-facing website:

### Bengali first

Technical terminology can remain in English:

* LiFePO4
* 12V
* 45Ah
* 200W
* 150W
* DC
* MPPT

Admin dashboard:

### English

The architecture should allow English localization later.

---

# 5. Brand Identity

Brand:

# SUNVOLT

Tagline:

### সূর্যের শক্তি, আপনার নির্ভরতা

Visual style:

* Professional
* Modern
* Clean
* Solar/energy focused
* Mobile-first
* Trustworthy
* Large readable typography
* Strong CTA buttons
* Product-focused cards

Primary colors:

* Navy blue
* Solar orange/yellow
* Green
* White

Avoid making the website look like a generic electronics marketplace.

---

# 6. Pages

Create:

```text
/
    Homepage

/calculator
    Smart Solar Calculator

/packages
    All packages

/packages/[slug]
    Individual package

/about
    About SunVolt

/contact
    Contact

/order/[id]
    Order confirmation

/admin
    Admin dashboard

/admin/products
    Product management

/admin/orders
    Order management

/admin/appliances
    Appliance management

/admin/settings
    Business/calculation settings
```

---

# 7. Homepage

The homepage should immediately explain the product.

## Hero

Display:

### SUNVOLT

### সূর্যের শক্তি, আপনার নির্ভরতা

Main headline:

### বিদ্যুৎ চলে গেলেও আপনার প্রয়োজনীয় ডিভাইস চালান

Supporting text:

> আপনার ফ্যান, লাইট ও অন্যান্য ডিভাইস নির্বাচন করুন। SunVolt আপনার প্রয়োজন অনুযায়ী সোলার প্যাকেজ সাজেস্ট করবে।

Primary CTA:

### 🔋 আমার ব্যাকআপ হিসাব করুন

Secondary CTA:

### 📦 সব প্যাকেজ দেখুন

---

# 8. Homepage Sections

Order of sections:

1. Hero
2. Backup Calculator CTA
3. How It Works
4. Popular Packages
5. Why SunVolt
6. Solar System Flow
7. Customer FAQ
8. Contact / WhatsApp CTA
9. Footer

---

# 9. Smart Solar Calculator

This is the most important feature of the website.

Route:

```text
/calculator
```

The calculator must be visually simple.

---

# 10. Calculator Step 1 — Appliances

Heading:

### আপনি কী কী চালাতে চান?

Show appliance cards.

Initial appliances:

| Appliance   | Default Watt |
| ----------- | -----------: |
| DC Fan      |          17W |
| DC Light    |           5W |
| TV          |          60W |
| WiFi Router |          10W |
| DC Bulb     |           5W |
| Other       |       Custom |

Every appliance must have:

```text
[-] quantity [+]
```

Example:

```text
DC Fan

[-] 2 [+]

17W × 2 = 34W
```

---

# 11. Calculator Step 2 — Total Load

Display a live calculation.

Example:

```text
2 × DC Fan
17W × 2
= 34W

1 × Light
5W × 1
= 5W
```

Then prominently display:

# মোট লোড: 39W

The total should update instantly whenever quantity changes.

---

# 12. Custom Appliance

Allow customers to add their own device.

Fields:

```text
Device name
Wattage
Quantity
```

Example:

```text
Device:
Small TV

Watt:
50W

Quantity:
1
```

The calculator adds it to the total load.

---

# 13. Calculator Step 3 — Backup Time

Heading:

### কত ঘণ্টা ব্যাকআপ প্রয়োজন?

Display:

```text
3 ঘণ্টা
6 ঘণ্টা
12 ঘণ্টা
```

Also provide:

### নিজের সময় নির্বাচন করুন

Allow custom backup hours.

Example:

```text
8 hours
```

---

# 14. Energy Calculation

The calculator calculates:

```text
Required Energy = Total Load × Backup Hours
```

Example:

```text
39W × 12 hours
= 468Wh
```

Display to customer:

### আপনার প্রয়োজনীয় শক্তি

## 468Wh

The calculation details can be hidden behind:

### বিস্তারিত হিসাব দেখুন

---

# 15. Battery Calculation Engine

Create a dedicated calculation module:

```text
/lib/solar/calculator.ts
```

Do NOT put calculation logic inside React components.

Functions should include:

```text
calculateTotalLoad()
calculateEnergyRequirement()
calculateBatteryRequirement()
calculateBackupTime()
checkPackageCompatibility()
recommendPackage()
```

---

# 16. Configurable Calculation Parameters

Do NOT hardcode efficiency values.

Store these in database/settings.

Example:

```text
usable_battery_factor
system_efficiency
recommended_reserve
```

Initial values can be configured by the administrator.

Example:

```text
usable_battery_factor = 0.90
system_efficiency = 0.90
```

The admin should be able to modify these later.

---

# 17. Package Recommendation Engine

The recommendation engine must compare the customer's calculated requirement against available SunVolt packages.

It should consider:

1. Required energy
2. Maximum recommended load
3. Battery capacity
4. Package availability
5. Active/inactive status

The system should recommend the **smallest suitable package**.

---

# 18. Example

Customer selects:

```text
2 × 17W Fan
1 × 5W Light
```

Total:

```text
39W
```

Customer selects:

```text
12 hours
```

Required energy:

```text
39 × 12
= 468Wh
```

System checks available packages.

If SunVolt 12 Hour is suitable:

Display:

# আপনার জন্য উপযুক্ত প্যাকেজ

## SunVolt 12 Hour

☀️ 200W Solar Panel

⚡ 150W Solar Controller

🔋 12V 45Ah LiFePO4

🌀 2 × Fan

💡 1 × Light

### প্রায় 12 ঘণ্টা*

# ৳18,700

Buttons:

### অর্ডার করুন

### WhatsApp-এ যোগাযোগ করুন

---

# 19. Important — Don't Force a Package

If a customer requires more power than any standard package can safely provide, DO NOT recommend an unsuitable package.

Example:

```text
4 fans
4 lights
12 hours
```

If the available packages cannot support it:

Display:

### আপনার প্রয়োজনীয় লোড স্ট্যান্ডার্ড প্যাকেজের চেয়ে বেশি।

Then:

### আপনার জন্য কাস্টম সোলার সিস্টেম প্রয়োজন।

Buttons:

**SunVolt-এর সাথে যোগাযোগ করুন**

**WhatsApp করুন**

This protects SunVolt from making unrealistic backup promises.

---

# 20. Recommendation Explanation

After recommending a package, show:

### কেন এই প্যাকেজটি আপনার জন্য উপযুক্ত?

Example:

```text
আপনার মোট লোড: 39W
প্রয়োজনীয় ব্যাকআপ: 12 ঘণ্টা
প্রয়োজনীয় শক্তি: 468Wh

SunVolt 12 Hour Package আপনার প্রয়োজন অনুযায়ী
নির্বাচন করা হয়েছে।
```

Keep the technical calculation collapsible.

---

# 21. Package Listing

Route:

```text
/packages
```

Display package cards.

Initial packages:

### SunVolt 3 Hour

15Ah Lithium Battery

### SunVolt 6 Hour

30Ah Lithium Battery

### SunVolt 12 Hour

45Ah Lithium Battery

Package specifications and prices must come from the database.

Do NOT hardcode these values into frontend components.

---

# 22. Package Detail Page

Route:

```text
/packages/[slug]
```

Example:

# SunVolt 12 Hour

### ১২ ঘণ্টার Solar Backup Package

Show:

* Main product image
* Product gallery
* Price
* Battery
* Solar panel
* Controller
* Recommended load
* Backup estimate
* Warranty
* Installation information
* Package contents
* Technical specifications

---

# 23. Current 12-Hour Package

Initial product:

```text
Name:
SunVolt 12 Hour Solar Backup

Battery:
12V 45Ah LiFePO4

Solar Panel:
200W

Controller:
150W

Recommended Load:
39W

Backup:
Approximately 12 hours

Price:
৳18,700

Warranty:
6 months
```

Customer-facing backup claim must include:

> *ব্যাকআপ সময় লোডের ধরন, ব্যবহার পদ্ধতি, ব্যাটারির অবস্থা ও অন্যান্য পরিস্থিতির উপর নির্ভরশীল।*

Do not advertise backup as an unconditional guarantee.

---

# 24. Package Contents

Display:

☀️ 200W Solar Panel

⚡ 150W Solar Charge Controller

🔋 12V 45Ah LiFePO4 Battery

The system should allow additional components to be added later.

---

# 25. Pricing

Current package:

# ৳18,700/-

Installation:

### Installation charge separate

Do not display the old ৳15,200 price anywhere.

Price must come from the database.

---

# 26. Order System

Keep ordering simple.

Do NOT build a complicated checkout in V1.

Customer enters:

```text
Name
Phone
Address
District
Selected package
Quantity
Installation required
Notes
```

Then:

### অর্ডার নিশ্চিত করুন

---

# 27. Order Status

Use:

```text
Pending
Confirmed
Processing
Installed
Completed
Cancelled
```

Admin can update status.

---

# 28. Save Calculator Information

When an order comes from the calculator, save:

```text
Selected appliances
Appliance quantities
Total load
Requested backup hours
Required energy
Recommended package
```

This is important for SunVolt sales staff.

Example:

```text
Customer requested:

2 × Fan
1 × Light

Total:
39W

Backup:
12 hours

Recommended:
SunVolt 12 Hour
```

---

# 29. WhatsApp Integration

WhatsApp should be a major conversion channel.

Current SunVolt number:

### 01780744069

Do not hardcode this in multiple components.

Store it in settings.

Generate a pre-filled WhatsApp message.

Example:

```text
Assalamu Alaikum SunVolt,

I am interested in the SunVolt 12 Hour Solar Backup Package.

Battery: 12V 45Ah LiFePO4
Solar Panel: 200W
Controller: 150W
Price: ৳18,700

My Name:
My Phone:
My Address:
```

---

# 30. Floating Mobile CTA

On mobile, display a floating WhatsApp button.

Also provide:

### 📞 Call Now

Both numbers must come from settings.

---

# 31. Database

Use PostgreSQL/Supabase.

## products

```text
id
name
slug
description
battery_voltage
battery_capacity_ah
battery_type
solar_panel_watt
controller_watt
backup_hours
recommended_load_watt
price
installation_price
warranty_months
stock
image_url
active
featured
created_at
updated_at
```

---

## appliances

```text
id
name
category
default_watt
icon
active
created_at
updated_at
```

---

## orders

```text
id
customer_name
phone
address
district
product_id
quantity
total_price
total_load
backup_hours
required_energy
installation_required
notes
status
created_at
updated_at
```

---

## order_appliances

```text
id
order_id
appliance_id
quantity
watt
total_watt
```

---

## settings

```text
id
business_name
phone
whatsapp
address
currency
battery_efficiency
system_efficiency
recommended_reserve
```

---

# 32. Admin Dashboard

Route:

```text
/admin
```

Dashboard cards:

```text
Total Orders
Pending Orders
Confirmed Orders
Completed Orders
Active Packages
```

---

# 33. Admin Product Management

Admin must be able to:

* Create package
* Edit package
* Delete package
* Enable/disable package
* Change price
* Change battery capacity
* Change panel wattage
* Change controller wattage
* Change recommended load
* Change backup hours
* Change warranty
* Upload images
* Set featured package
* Manage stock

Example:

Admin changes:

```text
৳18,700
```

to:

```text
৳19,500
```

The website should automatically show:

```text
৳19,500
```

No code changes.

---

# 34. Admin Appliance Management

Admin should be able to:

* Add appliance
* Edit appliance
* Change wattage
* Enable/disable appliance
* Set icon

Example:

```text
DC Fan
17W
```

If the actual product changes to 18W later, admin changes it from the dashboard.

The calculator automatically uses the new value.

---

# 35. Admin Settings

Allow admin to manage:

```text
Business Name
Phone
WhatsApp
Address
Currency
Battery Efficiency
System Efficiency
Reserve Factor
```

This prevents business-specific information from being scattered through the code.

---

# 36. Authentication

Admin routes must be protected.

Use Supabase authentication.

Only authenticated admin users can access:

```text
/admin/*
```

Never expose product management or order management publicly.

---

# 37. Security

Implement:

* Supabase Row Level Security
* Protected admin routes
* Input validation
* Server-side validation
* Rate limiting where appropriate
* Sanitization
* Secure environment variables
* No secret keys in client-side code

Customer order data must not be publicly accessible.

---

# 38. Mobile UX

Mobile is the priority.

Requirements:

* Responsive design
* Large touch targets
* Large CTA buttons
* Sticky WhatsApp button
* Fast loading
* Minimal forms
* No unnecessary animations
* Calculator must be easy to use with one hand
* Product price must be highly visible

Test at minimum:

```text
320px
375px
390px
430px
768px
1024px
1440px
```

---

# 39. SEO

Implement:

* Dynamic page metadata
* Sitemap
* robots.txt
* Open Graph metadata
* Product structured data
* Local Business structured data
* Canonical URLs

Example product title:

```text
SunVolt 12 Hour Solar Backup Package | 45Ah LiFePO4
```

---

# 40. Performance

Optimize for mobile networks.

Requirements:

* Next.js Image
* Image optimization
* Lazy loading
* Minimal client-side JavaScript
* Server Components where possible
* Avoid unnecessary libraries
* Good Core Web Vitals

Target:

### Lighthouse Performance: 90+

where practical.

---

# 41. Future-Proof Solar Architecture

The calculation engine must be independent from the UI.

Create:

```text
/lib/solar/
    calculator.ts
    battery.ts
    packages.ts
    types.ts
```

Example functions:

```text
calculateTotalLoad()
calculateEnergyRequirement()
calculateBatteryRequirement()
calculateBackupTime()
isPackageSuitable()
recommendPackage()
```

This allows SunVolt to eventually support larger systems.

---

# 42. Future Custom Solar Calculator

Do not build this into V1, but design the architecture so it can later support:

```text
Fan
Light
TV
Fridge
Computer
Router
Pump
AC
Other
```

Then calculate:

```text
Total Load
Daily Energy
Battery Size
Solar Panel Size
Controller
Inverter
Estimated System Price
```

This can become:

# Build Your Own Solar System

That could eventually become SunVolt's main sales engine.

---

# 43. Future E-Commerce Features

Do not build these in V1:

* Online payment
* Customer accounts
* Wishlist
* Coupons
* Reviews
* Multi-vendor
* Shipping API
* ERP
* Subscription
* Complex inventory
* Advanced CRM

Add them only after real customers start using the system.

---

# 44. V1 Development Phases

## Phase 1 — Foundation

Build:

* Next.js
* TypeScript
* Tailwind
* shadcn/ui
* Supabase
* Database
* Authentication
* SunVolt design system

---

## Phase 2 — Public Website

Build:

* Homepage
* Header
* Footer
* Package listing
* Package detail
* About
* Contact
* WhatsApp CTA

---

## Phase 3 — Smart Calculator

Build:

* Appliance selection
* Quantity controls
* Custom appliance
* Total load calculation
* Backup time
* Energy calculation
* Package matching
* Recommendation
* No-suitable-package state

This is the highest-priority feature.

---

## Phase 4 — Ordering

Build:

* Order form
* Order creation
* Order confirmation
* WhatsApp message generation
* Calculator data storage

---

## Phase 5 — Admin

Build:

* Dashboard
* Product management
* Appliance management
* Order management
* Settings

---

## Phase 6 — Production

Implement:

* SEO
* Sitemap
* Analytics
* Error handling
* Loading states
* Empty states
* Mobile optimization
* Security review
* Performance optimization
* Vercel deployment

---

# 45. UX Rules

Follow these rules throughout the application.

### Rule 1

Always explain the result in terms customers understand.

Bad:

```text
Required battery capacity = 41.25Ah
```

Better:

```text
আপনার জন্য SunVolt 12 Hour Package উপযুক্ত।
```

Technical calculation can be expandable.

---

### Rule 2

Always show the price clearly.

### Rule 3

Always provide WhatsApp/contact as an alternative to online ordering.

### Rule 4

Never recommend an undersized system just to sell a package.

### Rule 5

Never hardcode prices.

### Rule 6

Never hardcode appliance wattages.

### Rule 7

Never hardcode contact information.

### Rule 8

Never promise guaranteed backup without conditions.

---

# 46. Final Homepage Structure

The homepage should essentially communicate:

```text
SUNVOLT

সূর্যের শক্তি, আপনার নির্ভরতা

বিদ্যুৎ চলে গেলেও প্রয়োজনীয় ডিভাইস চালান

[ 🔋 আমার ব্যাকআপ হিসাব করুন ]

[ 📦 প্যাকেজ দেখুন ]


আপনার প্রয়োজন অনুযায়ী সোলার সিস্টেম

🌀 FAN
💡 LIGHT
📺 TV
📡 ROUTER

↓

Smart Calculator


জনপ্রিয় প্যাকেজ

3 Hour
15Ah

6 Hour
30Ah

12 Hour
45Ah


কীভাবে কাজ করে?

☀️ Solar Panel
      ↓
⚡ Charge Controller
      ↓
🔋 Battery
      ↓
🌀 Appliances


কেন SunVolt?

✓ Lithium Battery
✓ Solar Charging
✓ Low Maintenance
✓ Reliable Backup
✓ Professional Support


[ WhatsApp করুন ]

01780744069
```

---

# 47. AI Coding Agent Instructions

Build this project as a production-quality Next.js application.

Before writing code:

1. Read the complete specification.
2. Create the architecture.
3. Create the database schema.
4. Define TypeScript types.
5. Define the solar calculation engine.
6. Define reusable UI components.
7. Define the package recommendation algorithm.

Then build incrementally.

Do NOT build everything in one huge implementation.

Implement and test each phase before continuing.

The calculator must be treated as a core business feature, not a secondary UI component.

All business values must be configurable.

Do not hardcode:

* prices
* package specifications
* appliance wattages
* phone numbers
* WhatsApp numbers
* efficiency values
* warranty periods

The application must be easy for a non-developer SunVolt administrator to update.

Prioritize:

1. Correct solar calculations
2. Mobile UX
3. Simple customer journey
4. Package recommendation
5. WhatsApp conversion
6. Order management
7. Admin configurability
8. Performance
9. SEO
10. Future extensibility

Do not over-engineer V1.

The final experience should feel like:

**"Tell SunVolt what you want to run → SunVolt tells you what you need → Order."**

That is the core product.
