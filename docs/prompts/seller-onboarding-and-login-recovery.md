# Seller Onboarding And Login Recovery

## Prompt

Improve the seller onboarding and access flow so a non-technical local seller
understands what to do before registering, how to enter the dashboard, and what
to do if the email does not match a seller profile.

## Goal

Make the "Quiero vender" journey feel guided instead of abrupt. Sellers should
know that:

- they register the business first;
- they must use the same email for dashboard access;
- the private panel is where they upload products;
- public seller and product pages are what buyers see;
- expired or used login links can be requested again;
- the wrong email will not find the business.

## Scope

- Add a `/vender` onboarding page before the registration form.
- Route homepage, catalog, and public seller CTAs through `/vender`.
- Improve `/registro` so it feels like step one of onboarding.
- Improve `/entrar` copy for expired login links and wrong seller emails.
- Prevent magic links from being sent to emails with no seller profile when the
  admin Supabase client is available.
- Improve `/panel` no-profile recovery with clear options:
  - enter with another email;
  - register with the current email;
  - review the seller onboarding steps.

## Out Of Scope

- SMS login.
- WhatsApp OTP login.
- Custom Supabase SMTP.
- Admin approval.
- Payments, shipping, or commissions.

## Notes

Phone or WhatsApp login may be better for some sellers later, but it adds cost,
provider setup, and recovery complexity. For the MVP, email login stays, but the
copy and routing must be much clearer.
