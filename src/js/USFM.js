/**
 * USFM definitions
 */

// for these tags we don't embed the following text in marker content
export const NO_CONTENT_MARKERS = [
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
  "pn",
  "q",
  "q1",
  "q2",
  "q3",
  "qt",
  "qt",
  "sc",
  "sig",
  "sls",
  "tl",
  "v",
  "w",
  "wg",
  "wh",
  "wj"
];

// for these tages we must embed following text in content until we find an end marker,
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

export const NO_CONTENT_MARKERS_LOOKUP = {};
export const NEED_TERMINATION_MARKERS_LOOKUP = {};

/**
 * description - initialize by putting tags in object for fast lookup
 */
export const init = () => {
  initLookup(NO_CONTENT_MARKERS_LOOKUP, NO_CONTENT_MARKERS);
  initLookup(NEED_TERMINATION_MARKERS_LOOKUP, NEED_TERMINATION_MARKERS);
};

export const markerHasNoContent = tag => {
  return NO_CONTENT_MARKERS_LOOKUP[tag] === true;
};

export const markerRequiresTermination = tag => {
  return NEED_TERMINATION_MARKERS_LOOKUP[tag] === true;
};
