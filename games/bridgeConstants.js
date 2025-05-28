// bridgeConstants.js

export const SuitName = ['C', 'D', 'H', 'S'];
export const SuitNum = { 'C': 0, 'D': 1, 'H': 2, 'S': 3 };

export const RankName = ['2', '3', '4', '5', '6', '7', '8', '9', 'T', 'J', 'Q', 'K', 'A'];
export const RankNum = {
  '2': 0, '3': 1, '4': 2, '5': 3, '6': 4,
  '7': 5, '8': 6, '9': 7, 'T': 8, 'J': 9, 'Q': 10, 'K': 11, 'A': 12
};

export const VulName = ['N', 'NS', 'EW', 'B'];
export const VulNum = { 'N': 0, 'NS': 1, 'EW': 2, 'B': 3 };

export const CardName = [
  'C2', 'C3', 'C4', 'C5', 'C6', 'C7', 'C8', 'C9', 'CT', 'CJ', 'CQ', 'CK', 'CA',
  'D2', 'D3', 'D4', 'D5', 'D6', 'D7', 'D8', 'D9', 'DT', 'DJ', 'DQ', 'DK', 'DA',
  'H2', 'H3', 'H4', 'H5', 'H6', 'H7', 'H8', 'H9', 'HT', 'HJ', 'HQ', 'HK', 'HA',
  'S2', 'S3', 'S4', 'S5', 'S6', 'S7', 'S8', 'S9', 'ST', 'SJ', 'SQ', 'SK', 'SA'
];

export const CardNum = Object.fromEntries(CardName.map((name, index) => [name, index]));

export const BidName = [
  '1C', '1D', '1H', '1S', '1N',
  '2C', '2D', '2H', '2S', '2N',
  '3C', '3D', '3H', '3S', '3N',
  '4C', '4D', '4H', '4S', '4N',
  '5C', '5D', '5H', '5S', '5N',
  '6C', '6D', '6H', '6S', '6N',
  '7C', '7D', '7H', '7S', '7N',
  'P', 'X', 'XX'
];

export const BidNum = Object.fromEntries(BidName.map((name, index) => [name, index]));

export const LevelName = ['1', '2', '3', '4', '5', '6', '7'];
export const LevelNum = { '1': 0, '2': 1, '3': 2, '4': 3, '5': 4, '6': 5, '7': 6 };

export const TrumpsName = ['C', 'D', 'H', 'S', 'N'];
export const TrumpsNum = { 'C': 0, 'D': 1, 'H': 2, 'S': 3, 'N': 4 };

export const PostionName = ['N', 'E', 'S', 'W'];
export const PostionNum = { 'N': 0, 'E': 1, 'S': 2, 'W': 3 };

export const DoubleName = ['', 'X', 'XX'];
export const DoubleNum = { '': 0, 'X': 1, 'XX': 2 };

export function toCardName(card) {
  return CardName[card] ?? -1;
}

export function toCardNum(card) {
  return CardNum[card.toUpperCase()] ?? -1;
}

export function toBidName(bid) {
  return BidName[bid] ?? '';
}

export function toBidNum(bid) {
  return BidNum[bid.toUpperCase()] ?? -1;
}
