/**
 * WHAT A PERSON IS TOLD WHEN SIGNING IN GOES WRONG.
 *
 * Both doors — components/zenya/access/AccessView on the apex and
 * components/accounts/AccountsAuthForm on accounts.zenyaai.co — used to do
 * this:
 *
 *     setError(err.message)
 *
 * which puts Supabase's own English straight on an Arabic page. The most
 * common failure on the most-used screen in the product read "Invalid login
 * credentials": English, in a sentence nobody writes, naming a thing called a
 * credential. It does not say what to do next, and half the people who see it
 * have simply mistyped their password.
 *
 * This is the one place those messages are written, so the two doors cannot
 * drift into saying different things about the same failure.
 *
 * ── THE ONE CASE THAT CANNOT BE SPLIT, AND WHY ─────────────────────────────
 *
 * Supabase returns THE SAME error for "no account with this address" and
 * "wrong password", deliberately. Splitting them would turn the sign-in form
 * into an account checker: type an address, read the error, learn whether that
 * person has a Zenya account. That is user enumeration, and it is the reason
 * the API is built this way — so this module does not defeat it with a lookup.
 *
 * WHAT IT DOES INSTEAD, and it covers the case the owner actually described:
 *
 *   · If the address is on THIS BROWSER'S remembered list, the account is
 *     known to exist without asking the server anything, so the message can
 *     safely say the password is wrong. This is the returning customer, which
 *     is nearly everyone who sees this error.
 *   · If it is not, the message names both possibilities in plain Arabic and
 *     offers the two ways out — reset the password, or create an account.
 *
 * Nothing here tells an ATTACKER anything they did not already have: knowing
 * an address is remembered in a browser requires already being in that
 * browser.
 *
 * ── MATCHING ON TEXT, NOT ONLY ON CODES ────────────────────────────────────
 *
 * Newer supabase-js sets error.code; older releases and some gateway errors
 * carry only a message. Both are checked, lowercased, because a mapping that
 * silently falls through to English is the bug being fixed.
 */

export type AuthContext = 'signin' | 'signup' | 'forgot' | 'reset'

/** What the caller knows locally, so the message can be more specific. */
export type AuthHints = {
  /** The address is on this browser's remembered list, so it certainly exists. */
  knownAccount?: boolean
}

/** The fallback. Deliberately says something, rather than "حدث خطأ ما". */
export const GENERIC = 'تعذّر إتمام الطلب. حاول مرة أخرى بعد قليل.'

function read(err: unknown): { code: string; message: string; status?: number } {
  if (err && typeof err === 'object') {
    const e = err as { code?: unknown; message?: unknown; status?: unknown; name?: unknown }
    return {
      code: typeof e.code === 'string' ? e.code.toLowerCase() : '',
      message: typeof e.message === 'string' ? e.message.toLowerCase() : '',
      status: typeof e.status === 'number' ? e.status : undefined,
    }
  }
  return { code: '', message: typeof err === 'string' ? err.toLowerCase() : '' }
}

/**
 * The number of seconds Supabase asks you to wait, when it says so.
 * "For security purposes, you can only request this after 41 seconds."
 */
function retryAfter(message: string): number | null {
  const m = message.match(/after (\d+) seconds?/)
  return m ? Number(m[1]) : null
}

export function authErrorMessage(
  err: unknown,
  context: AuthContext,
  hints: AuthHints = {},
): string {
  const { code, message, status } = read(err)
  const has = (...needles: string[]) =>
    needles.some((n) => code.includes(n) || message.includes(n))

  /* An Arabic message thrown by our own pre-submit validation passes straight
     through — those are already written for a person. Detected by the absence
     of ASCII letters rather than by a flag, so a caller cannot forget it. */
  if (err instanceof Error && err.message && !/[a-z]/i.test(err.message)) {
    return err.message
  }

  /* The network, before anything reached Supabase at all. */
  if (has('failed to fetch', 'networkerror', 'network request failed', 'load failed')) {
    return 'تعذّر الاتصال بالخادم. تحقّق من اتصالك بالإنترنت وحاول مرة أخرى.'
  }

  /* THE COMMON ONE. */
  if (has('invalid_credentials', 'invalid login credentials', 'invalid_grant')) {
    if (context === 'reset') return 'كلمة المرور الحالية غير صحيحة.'
    return hints.knownAccount
      ? 'كلمة المرور غير صحيحة. تحقّق منها، أو اطلب رابط إعادة تعيين.'
      : 'البريد الإلكتروني أو كلمة المرور غير صحيحة. تحقّق منهما، أو أنشئ حسابًا جديدًا إن لم يكن لديك واحد.'
  }

  if (has('email_not_confirmed', 'email not confirmed')) {
    return 'لم يتم تأكيد بريدك الإلكتروني بعد. افتح الرسالة التي أرسلناها لك واضغط على رابط التأكيد.'
  }

  if (has('user_already_exists', 'user already registered', 'already been registered')) {
    return 'هذا البريد الإلكتروني مسجّل بالفعل. سجّل الدخول بدلًا من إنشاء حساب.'
  }

  if (has('user_not_found', 'user not found')) {
    return context === 'forgot'
      ? 'إن كان هناك حساب بهذا البريد، فقد أرسلنا إليه رابط إعادة التعيين.'
      : 'لا يوجد حساب بهذا البريد الإلكتروني.'
  }

  if (has('weak_password', 'password should be at least', 'password is too short')) {
    return 'كلمة المرور قصيرة. استخدم ٦ أحرف على الأقل.'
  }

  if (has('same_password', 'should be different from the old password')) {
    return 'كلمة المرور الجديدة مطابقة للقديمة. اختر كلمة مرور مختلفة.'
  }

  if (has('validation_failed', 'unable to validate email address', 'invalid format')) {
    return 'صيغة البريد الإلكتروني غير صحيحة.'
  }

  /* Rate limits. Supabase puts the wait in the message when it knows it. */
  /* "for security purposes" is the throttle message Supabase sends most often
     and it contains none of the words "rate" or "limit" — it was falling
     through to the generic message until a test caught it. */
  if (
    has(
      'over_email_send_rate_limit',
      'over_request_rate_limit',
      'rate limit',
      'too many requests',
      'for security purposes',
      'you can only request this after',
    ) ||
    status === 429
  ) {
    const wait = retryAfter(message)
    return wait
      ? `محاولات كثيرة. انتظر ${wait} ثانية ثم حاول مرة أخرى.`
      : 'محاولات كثيرة خلال وقت قصير. انتظر قليلًا ثم حاول مرة أخرى.'
  }

  if (has('signup_disabled', 'signups not allowed')) {
    return 'إنشاء الحسابات متوقّف مؤقتًا. تواصل معنا وسنفتح لك حسابًا.'
  }

  if (has('session_expired', 'jwt expired', 'token has expired', 'otp_expired')) {
    return 'انتهت صلاحية الرابط. اطلب رابطًا جديدًا.'
  }

  if (status && status >= 500) {
    return 'الخدمة لا تستجيب حاليًا. حاول مرة أخرى بعد قليل.'
  }

  return GENERIC
}
