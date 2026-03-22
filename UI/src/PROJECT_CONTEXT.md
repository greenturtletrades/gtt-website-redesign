# Green Turtle Trades - Platform Context & Technical Documentation

## Platform Overview

Green Turtle Trades is a next-generation trading platform that connects skilled, verified traders with real investor capital. The platform features a clean dark-on-light fintech aesthetic with teal/turquoise brand colours (#0d9488), full mobile responsiveness, and comprehensive dashboards.

## Core Features

### Turtle Analytics System
The platform's signature feature is a comprehensive per-trader machine learning system that analyses each trader's historical trade data using:
- Counterfactual simulations
- Bayesian optimisation
- Survival analysis
- Unsupervised clustering

This generates personalised performance insights for each trader.

## Pricing Model

### Current Subscription: Pay-As-You-Go
- **Base Price**: £25/month
- **Usage Fee**: £0.20 per trade analysed
- **No free trial** - Users pay immediately upon signup

### Referral System
- **Discount**: 20% off base subscription price
- **Duration**: First 2 months only
- **Calculation**: £25.00 → £20.00 per month for months 1 and 2
- **Reversion**: Returns to £25.00/month from month 3 onwards
- **Application**: Referral code is captured during signup flow and passed to PaymentModal via `hasReferralCode` prop

## Technical Implementation

### Payment Flow
1. User completes signup form (captures referral code if provided)
2. PaymentModal component receives `hasReferralCode` boolean prop
3. Order summary displays:
   - Without referral: "Due Today: £25.00" + auto-renew messaging
   - With referral: "Due Today: £20.00" + "Referral Discount (First 2 Months): -£5.00" + renewal messaging explaining £20 for month 2, then £25 thereafter
4. Submit button text updates dynamically: "Pay £25.00 Now" or "Pay £20.00 Now"

### PaymentModal Component Props
```typescript
interface PaymentModalProps {
  onClose: () => void;
  onComplete: () => void;
  onBack: () => void;
  selectedPlan: "payg";
  userName?: string;
  hasReferralCode?: boolean; // New prop for referral discount
}
```

## Design System

### Brand Identity
- **Primary Colour**: Teal/Turquoise (#0d9488)
- **Aesthetic**: Professional fintech, prestigious, basic, and understandable
- **Typography**: Default fonts from `/styles/globals.css`
- **Framework**: React + Tailwind CSS v4

### Responsive Behaviour
- Desktop layout is maintained on mobile devices
- Users zoom and pan rather than responsive breakpoints
- No mobile-specific responsive version

## Localisation & Legal

### Language
- **British English** throughout entire platform
- Examples: "colour" not "color", "analyse" not "analyze", "organisation" not "organization"

### Legal Compliance
- **Jurisdiction**: England and Wales
- **Regulatory Bodies**: FCA (Financial Conduct Authority), FSCS (Financial Services Compensation Scheme)
- **Company**: Green Turtle Trades Ltd (UK entity)
- **Legal Pages**: Risk Disclosure, Contact Us, Privacy Policy, Terms of Service
- All legal pages updated with proper header padding and UK-specific regulations

## Recent Updates

### Latest Changes (January 2026)
1. ✅ Fixed header visibility issues across all legal pages with proper top padding
2. ✅ Updated all legal documents to UK regulations and jurisdiction (removed US law references)
3. ✅ Updated company references to Green Turtle Trades Ltd with UK address
4. ✅ Removed 7-day free trial from payment flow
5. ✅ Implemented referral code discount system (20% off for first 2 months)
6. ✅ Updated PaymentModal component with conditional referral discount logic

## File Structure

### Key Components
- `/App.tsx` - Main application entry point
- `/components/PaymentModal.tsx` - Payment processing and order summary with referral logic
- `/styles/globals.css` - Global styles and Tailwind v4 configuration
- `/legal/*` - Legal pages (Risk Disclosure, Privacy Policy, Terms of Service, Contact Us)

### Protected Files
- `/components/figma/ImageWithFallback.tsx` - System component, do not modify

## What We Have Built

✅ Complete payment modal with card processing UI  
✅ Referral discount system (20% off first 2 months)  
✅ UK-compliant legal pages  
✅ Professional fintech design system  
✅ Single Pay-As-You-Go pricing tier  

## What Still Needs to Be Built

⏳ Signup flow that captures and validates referral codes  
⏳ Dashboard for traders to view analytics  
⏳ Turtle Analytics ML system integration  
⏳ Trade data upload and processing  
⏳ Backend API for payment processing (Stripe integration)  
⏳ User authentication and account management  
⏳ Admin panel for managing traders and investors  
⏳ Referral code generation and tracking system  

## Development Notes

### Best Practices
- Always use British English spellings
- Maintain consistent teal (#0d9488) brand colour
- Follow Tailwind v4 conventions (no custom config file)
- Use Unsplash for placeholder images via `unsplash_tool`
- Import icons from `lucide-react`
- Create modular components in `/components` directory

### API Integration Notes
- Payment processing to be handled via Stripe
- Mock payment flow currently implemented (2-second delay)
- Production implementation requires:
  1. Stripe API integration
  2. Backend user account creation
  3. Email confirmation system
  4. Webhook handlers for subscription management
  5. Referral code validation and tracking

## Company Information

**Green Turtle Trades Ltd**  
United Kingdom  
Regulated by: FCA  
Protected by: FSCS  

---

*Last Updated: 16 January 2026*
