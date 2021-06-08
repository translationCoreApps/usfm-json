

const verseMark = /^verse\/(.+)$/;
const versesMark = /^verses\/(.+)$/;
const attributeMark = /^attribute\/(.+)$/;
const milestoneMark = /^milestone\/(.+)$/;
const spanWithAttsMark = /^spanWithAtts\/(.+)$/;

function convertAttributes(obj) {
  const attrs = obj?.attributes || [];

  if (attrs) {
    for (let attr of attrs) {
      if (attr.indexOf('x-') === 0) {
        attr = attr.substr(2);
      }

      const parts = attr.split('/');
      const key = parts[0];
      const value = (parts.length > 2) ? parts[2] : '';
      obj[key] = value;
    }

    delete obj.attributes;
  }
}

function flattenTextChildren(obj) {
  const singleChild = obj?.children?.length === 1;

  if (singleChild) {
    const child = obj?.children[0];

    if (child.type === 'token') {
      obj.text = child.payload;
      delete obj.children;
    }
  }
}

function convertObjArrayToTcore(objArray) {
  for (const obj of objArray) {
    const type = obj.type;

    if (type === 'token') {
      obj.text = obj.payload;
      obj['type'] = 'text';
    } else if ((type === 'scope') && (obj.subType === 'start')) {
      let payload = obj.payload || '';
      let matched = payload.match(milestoneMark);

      if (matched) {
        obj.tag = matched[1];
        obj['type'] = 'milestone';
        flattenTextChildren(obj);
        convertAttributes(obj);
      } else {
        matched = payload.match(spanWithAttsMark);

        if (matched) {
          obj.tag = matched[1];
          obj['type'] = (obj.tag === 'w') ? 'word' : obj.tag;
          flattenTextChildren(obj);
          convertAttributes(obj);
        } else {
          console.log(`Don't know what to do with: `, obj);
          convertAttributes(obj);
        }
      }

      if (obj.children?.length > 0) {
        convertObjArrayToTcore(obj.children);
      }
    }
  }
  return objArray;
}

function getVerseData(verse, verseID) {
  const verseChild = verse?.[0]?.children?.[0];
  let childPayload = verseChild?.payload || '';
  const matched = childPayload.match(versesMark);
  let verseData = verse;

  if (matched) { // if verses found
    verseID = matched[1];
    verseData = verseChild.children;
  } else if (!verseChild) { // skip undefined parts of a verse span
    verseID = null;
  }
  return { verseData, verseID };
}

export function convertToTcore(content) {
  const results = {};
  const verses = Object.keys(content);

  for (const v of verses) {
    let verseID = v;
    const verse = content[v];
    const { verseData, verseID: verseID_ } = getVerseData(verse, verseID);

    if (verseID_) {
      const verseObjects = convertObjArrayToTcore(verseData);
      results[verseID_] = { verseObjects };
    }
  }
  return results;
}

export function makeNestedView(content) {
  const results = {};
  const cv = content?.data?.documents?.[0]?.cv?.[0]?.items;
  let verseId = 'front';
  let idx = 0;
  let len = cv.length;
  let matched;
  let verseContent = [];
  let stack = [];
  let currentNode;

  while (idx < len) { // iterate all
    const obj = cv[idx++];

    if (!currentNode) {
      currentNode = { children: [] };
      verseContent.push(currentNode);
      stack.push(currentNode);
    }

    const subType = obj.subType;

    // eslint-disable-next-line no-cond-assign
    if (subType === 'start') {
      matched = obj?.payload?.match(verseMark);

      if (matched) { // found verse start marker
        const foundVerse = matched[1];

        if (foundVerse) {
          results[verseId] = verseContent;
          verseId = foundVerse;
          obj.children = [];
          currentNode = obj;
          verseContent = [currentNode];
          stack = [currentNode];
        }
      } else {
        matched = obj?.payload?.match(attributeMark);

        if (matched && currentNode?.payload) {
          const match = `attribute/${currentNode.payload}`;
          const pos = obj?.payload?.indexOf(match);
          const attribute = (pos === 0) ? obj?.payload.substr(match.length + 1) : obj?.payload;

          if (!currentNode.attributes) {
            currentNode.attributes = [];
          }

          let currentAttributes = currentNode.attributes;
          let merged = false;

          if (currentAttributes.length) {
            const lastAttrIndex = currentAttributes.length - 1;
            const lastAttr = currentAttributes[lastAttrIndex];
            const lastAttrParts = lastAttr.split('/');
            const attrParts = attribute.split('/');

            if (lastAttrParts[0] === attrParts[0]) {
              if (lastAttrParts[1] === '0') {
                const newData = `${lastAttr},${attrParts[2]}`;
                currentAttributes[lastAttrIndex] = newData;
                merged = true;
              }
            }
          }

          if (!merged) {
            currentNode.attributes.push(attribute);
          }
        }
      }

      if (!matched) { // not verse start
        currentNode.children.push(obj);
        obj.children = [];
        stack.push(obj);
        currentNode = obj;
      }
    } else if (subType === 'end') {
      const isAttr = obj?.payload?.match(attributeMark);

      if (!isAttr) {
        let matched = false;

        for (let i = stack.length - 1; i >= 0; i--) {
          const ancestor = stack[i];

          if ((ancestor.subType === 'start') && (ancestor.payload === obj.payload)) {
            if (i > 1) { // don't run off end of stack
              stack = stack.slice(0, i);
              currentNode = stack[i - 1];
            } else {
              currentNode = stack[0];
            }
            matched = true;
            break;
          }
        }

        if (!matched) { // no match, so start at top
          console.log(`ignored:`, obj);
        }
      }
    } else { // flat item
      currentNode.children.push(obj);
    }
  }
  results[verseId] = verseContent;
  return results;
}

export function parseProskommaToTcore(content) {
  for (const c of Object.keys(content)) {
    const chapterData = content[c];
    const results = makeNestedView(chapterData);
    const tC_Data = convertToTcore(results);
    // console.log(JSON.stringify(output, null, 2))
    content[c] = tC_Data;
  }
}

