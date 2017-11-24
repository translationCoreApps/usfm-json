/**
 * USFM definitions
 */

// must be sorted
export const NO_CONTENT_MARKERS = ["p","s5"];

// must be sorted
export const DISPLAYABLE_TEXT = [
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
  "w",
  "wg",
  "wh",
  "wj"
];

// must be sorted
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

export function bsearch(Arr,value) {
  let low  = 0;
  let high = Arr.length-1;
  let mid;
  while (low <= high) {
    mid = Math.floor((low+high)/2);
    if(Arr[mid]===value) {
      return mid;
    }
    else if (Arr[mid]<value)
    {
      low = mid+1;
    }
    else {
      high = mid-1;
    }
  }
  return -1 ;
}