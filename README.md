# Route Mate Pakistan

Build a production-grade web application named "Travel Sync" (Tagline: "Your security is our concern") — an exclusive, verified carpooling platform for working professionals (Jobians) and university students in Pakistan. 



### 1. CORE CONCEPT & BUSINESS REVENUE MODEL (Model 2: Pay-to-Unlock Contacts)

LinksIn solves off-platform leakage and disintermediation by keeping direct contact numbers hidden behind an admin-configured unlock fee (PKR) paid via JazzCash, Easypaisa, or Bank Transfer:

- Zero free direct contact sharing and zero free unmoderated chat before unlocking.

- Both Drivers and Passengers express interest via an "Interested" button.

- Contact details (phone number, WhatsApp link) are only revealed after paying the platform connection fee.

- Expiring Leads: If a lead/request is not unlocked within 24 hours, it auto-expires to create urgency.



---



### 2. DUAL INTERACTION FLOWS



#### Flow A: Passenger Posts Route Request (Passenger Pays to Unlock Driver)

1. **Search & Post**: Passenger specifies Workplace & Home locations, commuting timings, and gender preference.

2. **Same-Route Matching**: System broadcasts the request only to verified drivers traveling on the same/overlapping route (irrespective of company/office).

3. **Driver View**: Drivers see passenger summary (Name, Company/University, Gender, Profile photo, Star rating & Reviews). Contact details are completely hidden.

4. **Driver Action**: Driver clicks the "Interested" (I'm Interested to Pick) button.

5. **Passenger View**: Passenger receives notification and sees a list of interested drivers with their verified badge, company name, car model, and rating.

6. **Pay-to-Unlock**: Passenger clicks "View Contact / Call Driver". A payment modal pops up showing the admin-defined fee in PKR (e.g. PKR 150) with payment options (Easypaisa, JazzCash, Bank Transfer).

7. **24-Hour Expiry**: A visible countdown warning badge states: "This offer will expire in 24 hours if contact is not unlocked."

8. **Contact Revealed**: Once payment is completed/verified, phone number and one-click WhatsApp chat link unlock permanently for that trip.



#### Flow B: Driver Posts Shared Ride (Driver or Passenger Unlocks)

1. **Driver Post**: Driver posts daily commute with Route (pickup/drop zones), departure times, available seats, and Plan Fares in PKR:

   - Daily fare (PKR)

   - Weekly package (PKR)

   - Monthly subscription plan (PKR)

2. **Route Match Broadcast**: All registered passengers whose saved workplace-to-home route matches receive an instant notification: *"A verified driver has started traveling on your route! Tap to view ride."*

3. **Passenger View**: Ride card displays Driver Name, Company/Institution, Route milestones, Available seats, Ratings/Reviews, and Daily/Weekly/Monthly PKR fares. Contact details are hidden.

4. **Passenger Expresses Interest**: Passenger clicks "Interested" button.

5. **Driver Notification & Unlock**: Driver gets notified with Interested Passenger profiles (Name, Office/University, Gender, Star Rating). Driver clicks "Unlock Contact", pays the platform fee via Easypaisa/JazzCash/Bank, and gets direct WhatsApp/Call access to finalize pickup.



---



### 3. DESIGN SYSTEM & PAKISTANI LOCALIZATION

- **Color Palette**: Dark Navy primary background (`#0b131f` to `#101b2b`), vibrant Teal accent (`#0dbfa8` / `#14b8a6`), subtle card borders (`rgba(255,255,255,0.08)`), crisp white text.

- **Typography**: Bebas Neue display font for headers/badges, Barlow for UI body and data tables.

- **Cultural & Safety Standards**:

  - Genders kept distinct: Filter for "Females Only (Pink/Teal badge)" and "Male Only" carpools.

  - Verification Badges: Green/Teal checkmark for "Verified Official Email" (corporate `@company.com` or university `@edu.pk`).

  - Currency: Clear PKR formatting (e.g., `PKR 450/day`, `PKR 8,500/month`).

  - Mobile responsive first: Optimized for 360px–420px mobile screens with clean bottom sheets and touch-friendly buttons.



---



### 4. KEY SCREENS & MODULES

1. **Splash & Welcome**: 3-second animated splash screen with LinksIn logo (`lln`), followed by 3 illustrated onboarding awareness slides highlighting Security, Verified Coworkers, and Route Sharing.

2. **Registration & 3-Way Verification**:

   - Role selector: "Jobian" (Company Name, Department, Work Email OTP) vs "Student" (Institute Name, Student ID/Email OTP).

   - CNIC Full Name, Gender, City, Workplace Address, Home Address.

   - Password rule: Minimum 6 alphanumeric characters (no complex special-char restrictions).

   - Preferences: Smoking allowed/prohibited, AC, Music, Quiet ride.

3. **Home Feed & Smart Matching**:

   - Route search bar (Pickup zone to Drop zone).

   - Tabs: "Find Rides (Drivers)" and "Passenger Requests".

   - Comprehensive Filter modal: City, Home Area, Office Area, Gender, Age group, Department, Smoking, Date.

   - Partner/Registered Companies horizontal strip with logos.

4. **Payment Modal & Contact Reveal Sheet**:

   - Triggered upon clicking "Unlock Contact".

   - Shows dynamic fee set by Admin (PKR).

   - Option tabs: Easypaisa, JazzCash, Direct Bank Transfer (shows Account Title, IBAN/Account #, and Transaction ID / screenshot upload field).

   - Instant unlock state toggle upon confirmation.

5. **Side Tray Menu (Replaces bottom Account tab)**:

   - Hamburger icon (3 lines) opens drawer with: Profile, Security, Privacy (phone public/private toggle), Q&A / FAQs, Terms & Conditions, Privacy Policy, About Us, Contact Us.

   - Footer of drawer displays social media icons (WhatsApp, Facebook, LinkedIn, Instagram).

6. **Admin Panel (`/admin`)**:

   - Hardcoded prototype credentials: `pp@gmail.com` / `ppllmm`.

   - Normal login detection: When admin credentials are typed into standard user login, redirect immediately to `/admin`.

   - **Monetization Settings**: Admin can edit the Contact Unlock Fee in PKR and toggle 24-hour auto-cancel duration.

   - **Payment Verification**: Review pending unlock transactions, approved payments, and revenue analytics.

   - **CMS Management**: Upload/replace Home slider images, edit all side menu text pages (About, Terms, Privacy, FAQs), and configure social media links.

   - **User & Ride Management**: View/verify users, activate/deactivate rides, approve partner company logos (auto-compressed on upload).



---



### 5. TECHNICAL STACK & ARCHITECTURE RULES

- TanStack Start / React with Tailwind CSS and Lucide React icons.

- Mock Client / In-memory data store with React Query for instant UI/UX prototyping until payment APIs (JazzCash/Easypaisa sandbox) and Firebase/Cloud DB are plugged in.

- Vehicle Photo Verification: Client-side compression and AI-assisted number plate verification rule.

- No direct client-to-client contact data rendered in DOM until `payment_status === 'unlocked'`.

Jesy indrive app ka structure ha home screen py rides feed ni show krwani bs isme driver apni ride post kray to usay Intrested passengers ka count with name show ho aur passenger post kray to usko Intrested drivers ka count and names show hon aur uspy 24 hours tme count down start ho jaey. Passenger or driver contact button py click kray to unsko information dialogue box me disclaimer show ho k ye payment k bad diey janay walay contact sy agr apki ride sharing deal ho ya na ho agay hum zimadar nhe hain. Ye disclaimer Urdu aur English dono me likhna hai. Aur disclaimer me ye bhi likhna ha k ye offer 24 hrs k bad auto cancel ho jaey ge , contact button py jesy e click kray to usko admin sy set ki gae fee aur disclaimer show ho aur proceed to payment ka button ho proceed to payment py click kray to usko payment methods show hon..  simple home screen py from and to location means home address and workplace address fields hon aur instructions box ho aur passenger k liey send request ka button ho, aur driver k liey share ride ka button ho ye button press krne k bad users ko search screen me wo user show hotay Jaen Jo Intrest show kren. Indrive app jesa bold and baray font wala UI UX use krna ha but color theme official blue rakhna hai.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/4706dac7-6d9c-4bbf-ab1e-85c536eb7161).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
