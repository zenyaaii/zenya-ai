import * as s1 from './s1'
import * as s2 from './s2'
import * as s3 from './s3'
import * as s4 from './s4'
import * as s5 from './s5'
import * as s6 from './s6'
import * as s7 from './s7'
import * as s8 from './s8'
import * as s9 from './s9'
import * as s10 from './s10'
import * as s11 from './s11'

type Style = {
  Home: () => JSX.Element; Pricing: () => JSX.Element; Templates?: () => JSX.Element; Contact?: () => JSX.Element
  Login?: (p: { mode?: 'signin' | 'signup' | 'forgot' }) => JSX.Element; Accounts?: () => JSX.Element
}

export const STYLES: Record<string, Style> = {
  '1': s1,
  '2': s2,
  '3': s3,
  '4': s4,
  '5': s5,
  '6': s6,
  '7': s7,
  '8': s8,
  '9': s9,
  '10': s10,
  '11': { Home: s11.Home, Pricing: s11.Pricing, Templates: s11.Templates, Contact: s11.ContactPage, Login: s11.Login, Accounts: s11.Accounts },
  '11b': { Home: s11.HomeB, Pricing: s11.Pricing, Templates: s11.Templates, Contact: s11.ContactPage, Login: s11.Login, Accounts: s11.Accounts },
}
