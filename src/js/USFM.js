/**
 * USFM definitions
 */

// type descriptions for tags
export const MARKER_TYPE = {
  "f": "footnote",
  "p": "paragraph",
  "q": "quote",
  "q1": "quote",
  "q2": "quote",
  "q3": "quote",
  "q4": "quote",
  "qa": "quote",
  "qac": "quote",
  "qc": "quote",
  "qm": "quote",
  "qr": "quote",
  "qs": "quote",
  "qt": "quote",
  "s": "section",
  "s1": "section",
  "s2": "section",
  "s3": "section",
  "s4": "section",
  "s5": "section",
};

// for these tags we support number attribute
export const MARKERS_WITH_NUMBERS = [
  "c",
  "v"
];

// for these tags we embed the text as text attribute instead of content
export const MARK_CONTENT_AS_TEXT = [
  "add",
  "bd",
  "bdit",
  "bk",
  "dc",
  "em",
  "it",
  "k",
  "lit",
  "nd",
  "no",
  "ord",
  "p",
  "pn",
  "q",
  "q1",
  "q2",
  "q3",
  "q4",
  "qa",
  "qac",
  "qc",
  "qm",
  "qr",
  "qs",
  "qt",
  "s",
  "s1",
  "s2",
  "s3",
  "s4",
  "s5",
  "sc",
  "sig",
  "sls",
  "tl",
  "v",
  "w",
  "wa",
  "wg",
  "wh",
  "wj"
];

// for these tags we must embed following text in content until we find an end marker,
export const NEED_TERMINATION_MARKERS = [
  "bd",
  "bdit",
  "bk",
  "ca",
  "cat",
  "dc",
  "ef",
  "em",
  "ex",
  "f",
  "fa",
  "fdc",
  "fe",
  "fig",
  "fm",
  "fqa",
  "fv",
  "imte",
  "imte1",
  "imte2",
  "imte3",
  "ior",
  "iqt",
  "it",
  "jmp",
  "k",
  "lik",
  "litl",
  "liv",
  "liv1",
  "liv2",
  "liv3",
  "nd",
  "ndx",
  "no",
  "ord",
  "pn",
  "png",
  "pro",
  "qac",
  "qs",
  "qt",
  "rb",
  "rq",
  "rt",
  "sc",
  "sig",
  "sis",
  "tl",
  "va",
  "vp",
  "w",
  "wa",
  "wg",
  "wh",
  "wj",
  "x",
  "xdc",
  "xnt",
  "xop",
  "xot",
  "xta"
];

/**
 * @description - initialize by putting tags in object for fast lookup
 * @param {object} lookup - target lookup dictionary
 * @param {array} keys - list of tags for lookup
 */
export const initLookup = (lookup, keys) => {
  for (let item of keys) {
    lookup[item] = true;
  }
};

export const NEED_TERMINATION_MARKERS_LOOKUP = {};
export const MARK_CONTENT_AS_TEXT_LOOKUP = {};
export const MARKERS_WITH_NUMBERS_LOOKUP = {};

/**
 * description - initialize by putting tags in dictionary for fast lookup
 */
export const init = () => {
  initLookup(NEED_TERMINATION_MARKERS_LOOKUP, NEED_TERMINATION_MARKERS);
  initLookup(MARK_CONTENT_AS_TEXT_LOOKUP, MARK_CONTENT_AS_TEXT);
  initLookup(MARKERS_WITH_NUMBERS_LOOKUP, MARKERS_WITH_NUMBERS);
};

export const markerRequiresTermination = tag => {
  return NEED_TERMINATION_MARKERS_LOOKUP[tag] === true;
};

export const markContentAsText = tag => {
  return MARK_CONTENT_AS_TEXT_LOOKUP[tag] === true;
};

export const markerSupportsNumbers = tag => {
  return MARKERS_WITH_NUMBERS_LOOKUP[tag] === true;
};
