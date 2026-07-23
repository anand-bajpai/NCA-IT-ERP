const ONES = [
  "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
  "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen",
  "Seventeen", "Eighteen", "Nineteen",
];
const TENS = [
  "", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety",
];

function twoDigits(n) {
  if (n < 20) return ONES[n];
  const t = Math.floor(n / 10);
  const o = n % 10;
  return TENS[t] + (o ? " " + ONES[o] : "");
}

function threeDigits(n) {
  const h = Math.floor(n / 100);
  const rest = n % 100;
  let str = "";
  if (h) str += ONES[h] + " Hundred" + (rest ? " " : "");
  if (rest) str += twoDigits(rest);
  return str;
}

// Converts a whole rupee amount into words using the Indian numbering
// system (Lakh / Crore), e.g. 125000 -> "One Lakh Twenty Five Thousand"
function integerToIndianWords(num) {
  if (num === 0) return "Zero";

  const crore = Math.floor(num / 10000000);
  num %= 10000000;
  const lakh = Math.floor(num / 100000);
  num %= 100000;
  const thousand = Math.floor(num / 1000);
  num %= 1000;
  const hundred = num;

  const parts = [];
  if (crore) parts.push(threeDigits(crore) + " Crore");
  if (lakh) parts.push(threeDigits(lakh) + " Lakh");
  if (thousand) parts.push(threeDigits(thousand) + " Thousand");
  if (hundred) parts.push(threeDigits(hundred));

  return parts.join(" ").trim();
}

// Converts a rupee amount (can include paise) to a receipt-style words string:
// e.g. 21500.50 -> "Rupees Twenty One Thousand Five Hundred and Fifty Paise Only"
export function amountToWords(amount) {
  const value = Math.round((Number(amount) || 0) * 100) / 100;
  const rupees = Math.floor(value);
  const paise = Math.round((value - rupees) * 100);

  let words = "Rupees " + integerToIndianWords(rupees);
  if (paise > 0) {
    words += " and " + twoDigits(paise) + " Paise";
  }
  words += " Only";

  return words;
}
