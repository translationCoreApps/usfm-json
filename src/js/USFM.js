/**
 * USFM definitions
 */

// for these tags we don't embed the following text in marker content
// must be sorted so we can do fast binary search
export const NO_CONTENT_MARKERS = [
  "add",
  "b",
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
  "qt",
  "qt",
  "s5",
  "sc",
  "sig",
  "sls",
  "tl",
  "w",
  "wg",
  "wh",
  "wj"
];

// for these tages we must embed following text in content until we find an end marker,
// must be sorted so we can do fast binary search
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