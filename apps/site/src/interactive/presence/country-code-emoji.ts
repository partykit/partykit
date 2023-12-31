// Convert a country code to a flag emoji
// modified from  https://github.com/thekelvinliu/country-code-emoji/

// country code regex
const CC_REGEX = /^[a-z]{2}$/i;

// offset between uppercase ascii and regional indicator symbols
const OFFSET = 127397;

/**
 * convert country code to corresponding flag emoji
 */
export default function countryCodeEmoji(cc: string): string {
  if (!CC_REGEX.test(cc)) {
    // if it's not recognized as a country code, return pirate flag as fallback
    return `🏴‍☠️`;
  }

  const codePoints = [...cc.toUpperCase()].map(
    (c) => (c.codePointAt(0) ?? 0) + OFFSET,
  );
  return String.fromCodePoint(...codePoints);
}

/* 

The MIT License (MIT)

Copyright (c) 2019 Kelvin Liu

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

*/
