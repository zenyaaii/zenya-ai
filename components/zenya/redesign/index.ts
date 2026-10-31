import * as s1 from './s1'
import * as s2 from './s2'
import * as s3 from './s3'
import * as s4 from './s4'
import * as s5 from './s5'

export const STYLES: Record<string, { Home: () => JSX.Element; Pricing: () => JSX.Element }> = {
  '1': s1,
  '2': s2,
  '3': s3,
  '4': s4,
  '5': s5,
}
