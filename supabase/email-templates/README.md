# Beynoun — Supabase Auth Email Templates

Branded HTML email templates for every Supabase Auth flow Beynoun uses (or might use). Copy each file's contents into the matching template in the Supabase Dashboard.

---

## 1. Configure Site URL and Redirect URLs (one time)

Supabase Dashboard → **Authentication → URL Configuration**

| Field | Value |
| --- | --- |
| **Site URL** | `https://beynoun.com` |
| **Redirect URLs** | `https://beynoun.com/auth/callback`<br>`https://www.beynoun.com/auth/callback`<br>`https://beynoun.com/auth/reset-password`<br>`http://localhost:3000/auth/callback`<br>`http://localhost:3000/auth/reset-password` |

Any URL not listed here is rejected as `redirect_to`, which is why the buttons in real emails appear broken in dev if you skip this step.

---

## 2. Paste each template

Supabase Dashboard → **Authentication → Email Templates**

For each template below, paste the **Subject** into the "Subject heading" field and the contents of the HTML file into the "Message body" field. Leave "Enable email" turned **on** for every template you want to use.

| Template in dashboard | File | Subject |
| --- | --- | --- |
| **Confirm signup** | [`confirm-signup.html`](confirm-signup.html) | `أكِّد حسابك في بينون` |
| **Invite user** | [`invite-user.html`](invite-user.html) | `دعوة للانضمام إلى بينون` |
| **Magic Link** | [`magic-link.html`](magic-link.html) | `رابط الدخول إلى بينون` |
| **Change Email Address** | [`change-email.html`](change-email.html) | `أكِّد بريدك الجديد في بينون` |
| **Reset Password** | [`reset-password.html`](reset-password.html) | `إعادة تعيين كلمة المرور في بينون` |
| **Reauthentication** | [`reauthentication.html`](reauthentication.html) | `رمز التحقق من بينون` |
| **Password Changed**¹ | [`password-changed.html`](password-changed.html) | `تم تغيير كلمة مرور حسابك في بينون` |

> **¹ Note on "Password Changed".** This is the branded version of the plain
> *"Your password has been changed"* security email (the ugly English one).
> It is **not** one of GoTrue's six config-API templates, so `_apply.mjs`
> deliberately does **not** push it and it has no `{{ .TokenHash }}` link —
> only `{{ .Email }}` and `{{ .SiteURL }}`. Apply it one of two ways:
> 1. **If your project exposes it** under *Authentication → Emails*, paste the
>    subject + body there.
> 2. **Otherwise**, send it yourself from our own Resend system via
>    `passwordChangedEmail()` in [`lib/email.ts`](../../lib/email.ts) after a
>    password update, and leave Supabase's default off. That path is fully
>    branded and under our control.

All templates share the **layl** (night) look of the site and of the Resend emails in `lib/email.ts`: a near-black `#0F0D0A` page, a `#1A1713` sheet with a hairline `#2E2922` border, paper `#F4EFE6` type with Amiri headings, a paper pill button, and the wordmark twice. The small one sits in the header picture, `public/brand/email-header-night.jpg` (served at `https://beynoun.com/brand/email-header-night.jpg`), on the site's orange light. The big one rises out of the paper cap at the foot, `public/brand/email-foot-night.png`; its fatha and dots are paprika `#E2532A`. Both are pictures because mail clients drop blur, gradients, SVG and web fonts; with images off, the styled alt text «بينون» stands in. Fully Arabic / RTL. They use Supabase template variables (`{{ .SiteURL }}`, `{{ .TokenHash }}`, `{{ .Email }}`, `{{ .NewEmail }}`, `{{ .Token }}`). Questions go to `team@beynoun.com`, never `noreply@`.

> **Fastest way to apply everything:** `SUPABASE_ACCESS_TOKEN=sbp_… node supabase/email-templates/_apply.mjs`
> (add `ENABLE_HIBP=1` once the project is on the Pro plan to turn on leaked-password protection). The manual dashboard steps below are an alternative.

---

## 3. Where each link lands in the app

| Flow | Email button → | What the user sees |
| --- | --- | --- |
| Confirm signup | `/auth/callback?next=/dashboard` | Logged in, lands on the dashboard with their 2 free sites |
| Reset password | `/auth/callback?next=/auth/reset-password` | Form to choose a new password, then auto-redirect to `/dashboard` |
| Magic link | `/auth/callback?next=/dashboard` | Logged in, lands on the dashboard |
| Invite user | `/auth/callback?next=/dashboard` | Sets a password (via Supabase invite flow), then dashboard |
| Change email | `/auth/callback?next=/settings` | Email change confirmed, lands on Settings |
| Reauthentication | (no link — 6-digit code) | User pastes the code into the in-app prompt |

The `/auth/callback` route ([`app/(main)/auth/callback/route.ts`](../../app/(main)/auth/callback/route.ts)) exchanges the code for a session, then forwards to whatever `next` parameter the app passed when triggering the email. On failure it falls back to `/auth/auth-code-error`.

---

## 4. Enable the security recommendations

Same dashboard, **Authentication → Providers → Email**:

- **Enable Confirm email** — already on.
- **Enable "Secure password change"** — requires reauthentication before password change. Pairs with the Reauthentication template above.
- **Enable "Leaked password protection"** — checks new passwords against HaveIBeenPwned. (Flagged as missing by Supabase advisor.)
- **Minimum password length: 8** — matches the validation on `/auth/reset-password`.

---

## 5. Custom SMTP (recommended for production)

By default Supabase sends from `noreply@mail.app.supabase.io`, which has a low daily limit and lower deliverability. For production, configure a custom SMTP provider in **Authentication → SMTP Settings**:

| Field | Value |
| --- | --- |
| Sender email | `noreply@beynoun.com` (or `hello@beynoun.com`) |
| Sender name | `Beynoun` |
| Host / port / user / pass | from Resend, Postmark, SES, etc. |

After switching SMTP, send yourself one of each template to verify rendering in Gmail, Outlook, and Apple Mail.
