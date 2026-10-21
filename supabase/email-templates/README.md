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

All templates share the **paper and light** look of the site and of the Resend emails in `lib/email.ts`: a `#fafafa` page, a white sheet with a hairline `#e6e6e6` border and no shadow, obsidian `#171717` type, an obsidian pill button, and one header picture, `public/brand/email-header.png` (served at `https://beynoun.com/brand/email-header.png`), which is the site's light glowing behind the بينون wordmark. It is a picture because mail clients drop blur, gradients and SVG. Fully Arabic / RTL. They use Supabase template variables (`{{ .SiteURL }}`, `{{ .TokenHash }}`, `{{ .Email }}`, `{{ .NewEmail }}`, `{{ .Token }}`). Questions go to `team@beynoun.com`, never `noreply@`.

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
