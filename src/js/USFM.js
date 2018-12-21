/* eslint-disable quote-props */
/**
 * USFM definitions
 */

// for these tags we support number attribute
export const MARKERS_WITH_NUMBERS = {
  c: true,
  v: true
};

// maps milestone end marker back to start marker
export const SPECIAL_END_TAGS = {
  esbe: "esb",
  "qt-e": "qt-s",
  "qt1-e": "qt1-s",
  "qt2-e": "qt2-s",
  "qt3-e": "qt3-s",
  "qt4-e": "qt4-s",
  "qt5-e": "qt5-s"
};

// for each USFM tag, specify associated properties
//    {boolean} display - optional, if true then attribute content is translatable text
//    {string} type - optional category
//    {string|array} endTag - optional text to indicate the end of content/text
//    {boolean} attrib - optional if true then expect attributes delimited by `|`
//    {boolean} endAttrib - optional if true then expect attributes on end milestone delimited by `|`
//    {boolean} milestone - optional if true then contents between tags with `-s` and `-e` (used for our custom milestones)
//    {boolean} standalone - optional if true then force a milestone marker to be treated as standalone
export const USFM_PROPERTIES = {
  "+add": {
    endTag: "*",
    display: true
  },
  "+bd": {
    endTag: "*",
    display: true
  },
  "+bdit": {
    endTag: "*",
    display: true
  },
  "+bk": {
    endTag: "*",
    display: true
  },
  "+dc": {
    endTag: "*",
    display: true
  },
  "+em": {
    endTag: "*",
    display: true
  },
  "+it": {
    endTag: "*",
    display: true
  },
  "+k": {
    endTag: "*",
    display: true
  },
  "+lit": {
    display: true
  },
  "+nd": {
    endTag: "*",
    display: true
  },
  "+no": {
    endTag: "*",
    display: true
  },
  "+ord": {
    endTag: "*",
    display: true
  },
  "+pn": {
    endTag: "*",
    display: true
  },
  "+png": {
    endTag: "*",
    display: true
  },
  "+qt": {
    type: "quote",
    endTag: "*",
    display: true
  },
  "+sc": {
    endTag: "*",
    display: true
  },
  "+sig": {
    endTag: "*",
    display: true
  },
  "+sls": {
    endTag: "*",
    display: true
  },
  "+sup": {
    endTag: "*",
    display: true
  },
  "+tl": {
    endTag: "*",
    display: true
  },
  "+wj": {
    endTag: "*",
    display: true
  },
  add: {
    endTag: "*",
    display: true
  },
  b: {
    type: "paragraph",
    display: true
  },
  bd: {
    endTag: "*",
    display: true
  },
  bdit: {
    endTag: "*",
    display: true
  },
  bk: {
    endTag: "*",
    display: true
  },
  ca: {
    endTag: "*"
  },
  cat: {
    endTag: "*"
  },
  cls: {
    type: "paragraph",
    display: true
  },
  d: {
    display: true
  },
  dc: {
    endTag: "*",
    display: true
  },
  ef: {
    endTag: "*"
  },
  em: {
    endTag: "*",
    display: true
  },
  esb: {
    endTag: "esbe"
  },
  ex: {
    endTag: "*"
  },
  f: {
    type: "footnote",
    endTag: "*"
  },
  fa: {
    endTag: "*"
  },
  fdc: {
    endTag: "*"
  },
  fe: {
    endTag: "*"
  },
  fig: {
    endTag: "*",
    attrib: true
  },
  fm: {
    endTag: "*"
  },
  fqa: {
    endTag: "*"
  },
  fv: {
    endTag: "*"
  },
  ior: {
    endTag: "*"
  },
  iqt: {
    endTag: "*"
  },
  it: {
    endTag: "*",
    display: true
  },
  jmp: {
    endTag: "*",
    attrib: true,
    display: true
  },
  k: {
    endTag: ["-e", "*"],
    type: "milestone",
    display: true,
    attrib: true
  },
  lf: {
    display: true
  },
  lh: {
    display: true
  },
  li: {
    endTag: "*",
    display: true
  },
  lik: {
    endTag: "*",
    display: true
  },
  lim: {
    display: true
  },
  lim1: {
    display: true
  },
  lim2: {
    display: true
  },
  lim3: {
    display: true
  },
  lim4: {
    display: true
  },
  lim5: {
    display: true
  },
  lit: {
    display: true
  },
  litl: {
    endTag: "*",
    display: true
  },
  liv: {
    endTag: "*",
    display: true
  },
  liv1: {
    endTag: "*",
    display: true
  },
  liv2: {
    endTag: "*",
    display: true
  },
  liv3: {
    endTag: "*",
    display: true
  },
  liv4: {
    endTag: "*",
    display: true
  },
  liv5: {
    endTag: "*",
    display: true
  },
  m: {
    type: "paragraph",
    display: true
  },
  mi: {
    type: "paragraph",
    display: true
  },
  nb: {
    type: "paragraph",
    display: true
  },
  nd: {
    endTag: "*",
    display: true
  },
  ndx: {
    endTag: "*"
  },
  no: {
    endTag: "*",
    display: true
  },
  ord: {
    endTag: "*",
    display: true
  },
  p: {
    type: "paragraph",
    display: true
  },
  pb: {
    type: "paragraph",
    display: true
  },
  pc: {
    type: "paragraph",
    display: true
  },
  ph: {
    type: "paragraph",
    display: true
  },
  ph1: {
    type: "paragraph",
    display: true
  },
  ph2: {
    type: "paragraph",
    display: true
  },
  ph3: {
    type: "paragraph",
    display: true
  },
  ph4: {
    type: "paragraph",
    display: true
  },
  ph5: {
    type: "paragraph",
    display: true
  },
  pi: {
    type: "paragraph",
    display: true
  },
  pi1: {
    type: "paragraph",
    display: true
  },
  pi2: {
    type: "paragraph",
    display: true
  },
  pi3: {
    type: "paragraph",
    display: true
  },
  pi4: {
    type: "paragraph",
    display: true
  },
  pi5: {
    type: "paragraph",
    display: true
  },
  pm: {
    type: "paragraph",
    display: true
  },
  pmc: {
    type: "paragraph",
    display: true
  },
  pmo: {
    type: "paragraph",
    display: true
  },
  pmr: {
    type: "paragraph",
    display: true
  },
  pn: {
    endTag: "*",
    display: true
  },
  png: {
    endTag: "*",
    display: true
  },
  po: {
    type: "paragraph",
    display: true
  },
  pr: {
    type: "paragraph",
    display: true
  },
  pro: {
    endTag: "*"
  },
  q: {
    type: "quote",
    display: true
  },
  q1: {
    type: "quote",
    display: true
  },
  q2: {
    type: "quote",
    display: true
  },
  q3: {
    type: "quote",
    display: true
  },
  q4: {
    type: "quote",
    display: true
  },
  qa: {
    type: "quote",
    display: true
  },
  qac: {
    type: "quote",
    endTag: "*",
    display: true
  },
  qc: {
    type: "quote",
    display: true
  },
  qm: {
    type: "quote",
    display: true
  },
  qr: {
    type: "quote",
    display: true
  },
  qs: {
    type: "quote",
    endTag: "*",
    display: true
  },
  qt: {
    type: "quote",
    endTag: "*",
    display: true,
    milestone: true,
    attrib: true
  },
  qt1: {
    type: "quote",
    endTag: "*",
    display: true,
    milestone: true,
    attrib: true
  },
  qt2: {
    type: "quote",
    endTag: "*",
    display: true,
    milestone: true,
    attrib: true
  },
  qt3: {
    type: "quote",
    endTag: "*",
    display: true,
    milestone: true,
    attrib: true
  },
  qt4: {
    type: "quote",
    endTag: "*",
    display: true,
    milestone: true,
    attrib: true
  },
  qt5: {
    type: "quote",
    endTag: "*",
    display: true,
    milestone: true,
    attrib: true
  },
  "qt-e": {
    endAttrib: true
  },
  "qt1-e": {
    endAttrib: true
  },
  "qt2-e": {
    endAttrib: true
  },
  "qt3-e": {
    endAttrib: true
  },
  "qt4-e": {
    endAttrib: true
  },
  "qt5-e": {
    endAttrib: true
  },
  "qt-s": {
    type: "quote",
    endTag: "-e",
    display: true,
    milestone: true,
    usfm3Milestone: true,
    attrib: true
  },
  "qt1-s": {
    type: "quote",
    endTag: "-e",
    display: true,
    milestone: true,
    usfm3Milestone: true,
    attrib: true
  },
  "qt2-s": {
    type: "quote",
    endTag: "-e",
    display: true,
    milestone: true,
    usfm3Milestone: true,
    attrib: true
  },
  "qt3-s": {
    type: "quote",
    endTag: "-e",
    display: true,
    milestone: true,
    usfm3Milestone: true,
    attrib: true
  },
  "qt4-s": {
    type: "quote",
    endTag: "-e",
    display: true,
    milestone: true,
    usfm3Milestone: true,
    attrib: true
  },
  "qt5-s": {
    type: "quote",
    endTag: "-e",
    display: true,
    milestone: true,
    usfm3Milestone: true,
    attrib: true
  },
  rb: {
    endTag: "*",
    display: true,
    attrib: true
  },
  rq: {
    endTag: "*"
  },
  rt: {
    endTag: "*"
  },
  s: {
    type: "section"
  },
  s1: {
    type: "section"
  },
  s2: {
    type: "section"
  },
  s3: {
    type: "section"
  },
  s4: {
    type: "section"
  },
  s5: {
    type: "section"
  },
  sc: {
    endTag: "*",
    display: true
  },
  sig: {
    endTag: "*",
    display: true
  },
  sis: {
    endTag: "*"
  },
  sls: {
    endTag: "*",
    display: true
  },
  sp: {
    display: true
  },
  sup: {
    endTag: "*",
    display: true
  },
  tl: {
    endTag: "*",
    display: true
  },
  ts: {
    milestone: true,
    display: false,
    standalone: true
  },
  "ts-e": {
    milestone: true,
    display: false,
    endAttrib: true,
    standalone: true
  },
  "ts-s": {
    milestone: true,
    display: false,
    endAttrib: true,
    standalone: true
  },
  v: {
    display: true
  },
  va: {
    endTag: "*"
  },
  vp: {
    endTag: "*"
  },
  w: {
    endTag: "*",
    display: true,
    attrib: true
  },
  wa: {
    endTag: "*",
    display: true
  },
  wg: {
    endTag: "*",
    display: true
  },
  wh: {
    endTag: "*",
    display: true
  },
  wj: {
    endTag: "*",
    display: true
  },
  x: {
    endTag: "*"
  },
  xdc: {
    endTag: "*"
  },
  xnt: {
    endTag: "*"
  },
  xop: {
    endTag: "*"
  },
  xot: {
    endTag: "*"
  },
  xt: {
    endTag: "*",
    attrib: true
  },
  zaln: {
    endTag: "-e",
    type: "milestone",
    display: true,
    attrib: true
  }
};

export const getMarkerType = tagProps => {
  return tagProps && tagProps.type;
};

export const propTermination = tagProps => {
  return tagProps && tagProps.endTag;
};

export const markerTermination = tag => {
  const tagProps = USFM_PROPERTIES[tag];
  return propTermination(tagProps);
};

export const propAttributes = tagProps => {
  return tagProps && tagProps.attrib;
};

export const markerHasEndAttributes = tag => {
  const tagProps = USFM_PROPERTIES[tag];
  return tagProps && tagProps.endAttrib;
};

export const propStandalone = tagProps => {
  return tagProps && tagProps.standalone;
};

export const markerStandalone = tag => {
  const tagProps = USFM_PROPERTIES[tag];
  return propStandalone(tagProps);
};

export const propDisplayable = tagProps => {
  return tagProps && tagProps.display;
};

export const markerContentDisplayable = tag => {
  const tagProps = USFM_PROPERTIES[tag];
  return propDisplayable(tagProps);
};

export const markerSupportsNumbers = tag => {
  return MARKERS_WITH_NUMBERS[tag];
};

export const markerIsMilestone = tag => {
  const tagProps = USFM_PROPERTIES[tag];
  return tagProps && tagProps.milestone;
};

export const markerHasSpecialEndTag = tag => {
  return SPECIAL_END_TAGS[tag];
};

export const propUsfm3Milestone = tagProps => {
  return tagProps && tagProps.usfm3Milestone;
};

export const wordSpecialAttributes = ['morph', 'occurrence', 'occurrences', 'tw'];

