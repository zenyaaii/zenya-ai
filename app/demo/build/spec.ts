/**
 * The restaurant wizard, as data.
 *
 * EVERY LABEL, PLACEHOLDER, SECTION TITLE AND SUBTITLE IN THIS FILE IS COPIED
 * FROM app/(main)/theme/new/restaurant/page.tsx. Nothing here is written for
 * the demo. The rule is the one app/demo/home/templates.tsx already states for
 * the deck: the cards are its cards, the order is its order, the labels are
 * its labels — a demo that invents a form the product does not have is worth
 * nothing. The required stars are its required stars.
 *
 * WHY ONE TEMPLATE AND NOT EIGHT. The seven buildable wizards are 4,586 lines
 * between them, and each has its own repeaters, hour grids, menu builders and
 * upload rails. Restaurant is the richest of them at eight sections, and it is
 * the one already mirrored in the deck, so it is the one that exercises the
 * form design hardest and can be checked against an existing mirror. The shape
 * below is the contract: another template is another SPEC object, and nothing
 * in the view knows the word "restaurant".
 *
 * The eighth template, one_product, has no wizard to mirror at all — its
 * builder is admin-only and the public catalogue shows قريبًا. See the note in
 * app/demo/templates/TemplatesView.tsx.
 */

import { RESTAURANT_PRESETS } from "@/utils/restaurant/presets"

export type FieldSpec = {
  key: string
  label: string
  ph?: string
  required?: boolean
  /** A textarea rather than a single line. */
  area?: boolean
  /** Latin content: phone numbers, e-mail, URLs. */
  ltr?: boolean
  /** Takes the full width of the two-column grid. */
  wide?: boolean
}

export type StepSpec = {
  id: string
  title: string
  sub: string
  /** The plain fields, if the step has any. */
  fields?: FieldSpec[]
  /** A step whose body is a purpose-built control rather than a field grid. */
  widget?: "chips" | "presets" | "hours" | "menu" | "uploads" | "review"
  /** Whether the step can be left empty and still pass. */
  optional?: boolean
}

/* The twelve chips, from RESTAURANT_TYPES in the wizard. Optional there, so
   optional here. */
export const PLACE_KINDS = [
  { id: "fine_dining", label: "مطعم راقٍ" },
  { id: "bistro", label: "بيسترو" },
  { id: "cafe", label: "مقهى" },
  { id: "coffee_takeaway", label: "قهوة · سفري" },
  { id: "bakery", label: "مخبز" },
  { id: "pizzeria", label: "بيتزا" },
  { id: "bar", label: "لاونج · عصائر" },
  { id: "brunch", label: "فطور متأخّر · طوال اليوم" },
  { id: "cafeteria", label: "كافيتيريا" },
  { id: "food_truck", label: "عربة طعام" },
  { id: "dessert", label: "حلويات وباتيسري" },
  { id: "other", label: "أخرى" },
] as const

/* The week, in the wizard's own order and with its own Arabic day names and
   default times. Saturday first, because that is where its week starts. */
export const DEFAULT_HOURS = [
  { day: "saturday", label: "السبت", open: "5:30 م", close: "11:00 م", closed: false },
  { day: "sunday", label: "الأحد", open: "5:00 م", close: "9:30 م", closed: false },
  { day: "monday", label: "الإثنين", open: "", close: "", closed: true },
  { day: "tuesday", label: "الثلاثاء", open: "5:30 م", close: "10:00 م", closed: false },
  { day: "wednesday", label: "الأربعاء", open: "5:30 م", close: "10:00 م", closed: false },
  { day: "thursday", label: "الخميس", open: "5:30 م", close: "11:00 م", closed: false },
  { day: "friday", label: "الجمعة", open: "1:00 م", close: "11:00 م", closed: false },
]

export const PRESETS = RESTAURANT_PRESETS

export const STEPS: StepSpec[] = [
  {
    id: "basics",
    title: "الأساسيات",
    sub: "من أنت وماذا تقدّم.",
    fields: [
      { key: "brand_name", label: "اسم المطعم", ph: "دار نُور", required: true },
      { key: "cuisine", label: "المطبخ", ph: "مأكولات شامية عصرية", required: true },
      { key: "city", label: "المدينة", ph: "بيروت", required: true },
      { key: "neighborhood", label: "الحي", ph: "الجميزة" },
    ],
    widget: "chips",
  },
  {
    id: "style",
    title: "النمط البصري",
    sub: "اختر المظهر. يمكنك تغييره لاحقًا.",
    widget: "presets",
  },
  {
    id: "place",
    title: "الموقع وساعات العمل",
    sub: "أين يجدك الضيوف، ومتى تفتح.",
    fields: [
      { key: "address", label: "العنوان الكامل", ph: "شارع غورو، الجميزة، بيروت", required: true, wide: true },
      { key: "phone", label: "الهاتف", ph: "+961 1 555 0140", required: true, ltr: true },
      { key: "email", label: "البريد الإلكتروني", ph: "reservations@restaurant.com", required: true, ltr: true },
      { key: "map_link", label: "رابط خرائط Google", ph: "https://maps.google.com/...", ltr: true, wide: true },
    ],
    widget: "hours",
  },
  {
    id: "menu",
    title: "القائمة",
    sub: "حتى صنف واحد يكفي. أضف صورة لأي صنف — تظهر بجانب الاسم في موقعك المنشور.",
    widget: "menu",
  },
  {
    id: "story",
    title: "قصتك",
    sub: "ملخّص قصير. سيحوّله الذكاء الاصطناعي إلى نص تحريري.",
    fields: [
      { key: "story_brief", label: "عن المطعم", ph: "بضع جمل. متى افتتحت، وما الفلسفة، ومن أين تستورد.", required: true, area: true, wide: true },
      { key: "chef_name", label: "اسم الشيف", ph: "الشيف سامي خوري" },
      { key: "chef_title", label: "لقب الشيف", ph: "الشيف · المالك" },
      { key: "chef_bio_brief", label: "نبذة عن الشيف", ph: "التدريب والخلفية وما الذي أتى به إلى هنا.", area: true, wide: true },
    ],
  },
  {
    id: "booking",
    title: "الحجوزات",
    sub: "تصل الحجوزات مباشرةً إلى لوحة تحكّمك في زينيا — بلا منصّات خارجية.",
    optional: true,
    fields: [
      { key: "booking", label: "رقم هاتف للحجز (احتياطي، اختياري)", ph: "+961 1 555 0140", ltr: true, wide: true },
      { key: "reservation_note", label: "ملاحظة الحجز (اختياري)", ph: "مثلاً: «للمناسبات الخاصة أو 8 أشخاص فأكثر، يُرجى الاتصال».", area: true, wide: true },
    ],
  },
  {
    id: "visuals",
    title: "الصور",
    sub: "ارفع صورك الخاصة. أو تخطَّ — نحن نتكفّل بذلك.",
    optional: true,
    widget: "uploads",
  },
  {
    id: "press",
    title: "الصحافة والجوائز",
    sub: "اختياري. واحدة في كل سطر.",
    optional: true,
    fields: [
      { key: "press_outlets", label: "الصحافة والجوائز", ph: "النهار\nدليل ميشلان\nتايم آوت بيروت", area: true, wide: true },
    ],
  },
  {
    id: "review",
    title: "المراجعة",
    sub: "كل ما ستبني عليه. راجعه قبل التوليد.",
    widget: "review",
  },
]

/** The two upload rails, with the wizard's own captions and caps. */
export const UPLOADS = [
  { key: "gallery", label: "المعرض (حتى 8)", max: 8 },
  { key: "dishes", label: "صور الأطباق المميّزة (حتى 4)", max: 4 },
] as const

/** Every plain field on the form, flattened — used for progress and review. */
export const ALL_FIELDS: FieldSpec[] = STEPS.flatMap((s) => s.fields ?? [])
