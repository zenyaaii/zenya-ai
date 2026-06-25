# Zenya — Supabase Auth Email Templates

Branded HTML email templates for every Supabase Auth flow Zenya uses (or might use). Copy each file's contents into the matching template in the Supabase Dashboard.

---

## 1. Configure Site URL and Redirect URLs (one time)

Supabase Dashboard → **Authentication → URL Configuration**

| Field | Value |
| --- | --- |
| **Site URL** | `https://zenyaai.co` |
| **Redirect URLs** | `https://zenyaai.co/auth/callback`<br>`https://www.zenyaai.co/auth/callback`<br>`https://zenyaai.co/auth/reset-password`<br>`http://localhost:3000/auth/callback`<br>`http://localhost:3000/auth/reset-password` |

Any URL not listed here is rejected as `redirect_to`, which is why the buttons in real emails appear broken in dev if you skip this step.

---

## 2. Paste each template

Supabase Dashboard → **Authentication → Email Templates**

For each template below, paste the **Subject** into the "Subject heading" field and the contents of the HTML file into the "Message body" field. Leave "Enable email" turned **on** for every template you want to use.

| Template in dashboard | File | Subject |
| --- | --- | --- |
| **Confirm signup** | [`confirm-signup.html`](confirm-signup.html) | `أكِّد حسابك في زينيا` |
| **Invite user** | [`invite-user.html`](invite-user.html) | `دعوة للانضمام إلى زينيا` |
| **Magic Link** | [`magic-link.html`](magic-link.html) | `رابط الدخول إلى زينيا` |
| **Change Email Address** | [`change-email.html`](change-email.html) | `أكِّد بريدك الجديد في زينيا` |
| **Reset Password** | [`reset-password.html`](reset-password.html) | `إعادة تعيين كلمة المرور في زينيا` |
| **Reauthentication** | [`reauthentication.html`](reauthentication.html) | `رمز التحقق من زينيا` |

All six templates share the **site look** — cream `#f7f4ed` page, white card with an `#e5e2d9` border, ink `#16171b` headings, indigo `#5e6ad2` accent + pill CTA, and the hosted زينيا wordmark — fully Arabic / RTL to match the app and the Resend transactional emails in `lib/email.ts`. They render well in Gmail / Outlook / Apple Mail and use Supabase template variables (`{{ .SiteURL }}`, `{{ .TokenHash }}`, `{{ .Email }}`, `{{ .NewEmail }}`, `{{ .Token }}`).

> **Fastest way to apply everything:** `SUPABASE_ACCESS_TOKEN=sbp_… node supabase/email-templates/_apply.mjs`
> (add `ENABLE_HIBP=1` once the project is on the Pro plan to turn on leaked-password protection). The manual dashboard steps below are an alternative.

---

## 3. Where each link lands in the app

| Flow | Email button → | What the user sees |
| --- | --- | --- |
| Confirm signup | `/auth/callback?next=/dashboard` | Logged in, lands on the dashboard with their 3 free credits |
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
| Sender email | `noreply@zenyaai.co` (or `hello@zenyaai.co`) |
| Sender name | `Zenya` |
| Host / port / user / pass | from Resend, Postmark, SES, etc. |

After switching SMTP, send yourself one of each template to verify rendering in Gmail, Outlook, and Apple Mail.
