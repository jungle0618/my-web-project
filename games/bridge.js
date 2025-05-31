// Bridge.js

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

import { Protocol } from '../encrypt/protocol.js';

export class Bridge {
    constructor(p2pInterface, cfg = {}) {
        // 傳入的 P2P 通訊模組（你要自己實作或用 WebRTC 來處理）
        this.p2pInterface = p2pInterface;
        console.log('Bridge initialized with P2P interface:', p2pInterface.userId);
        this.userIds = [...p2pInterface.userIds];
        this.index = p2pInterface.index;
        this.userId = p2pInterface.userId;

        // 玩家方位
        this.decidePosition();

        // 遊戲選項
        this.encryption = cfg.encryption ?? false;
        this.schuffleCheat = cfg.schuffleCheat ?? false;
        this.playCheat = cfg.playCheat ?? false;
        this.isHashChain = cfg.hashChain ?? false;
        this.autoPlay = cfg.autoPlay ?? false;

        if (this.encryption) {
            this.protocol = new Protocol(this.Pos, 4, 52); // TODO: 實作或引入
        }

        if (this.isHashChain) {
            this.hashChain = new HashChain(); // TODO: 實作或引入
        }
    }

    decidePosition() {
        this.Pos = this.index;
        this.nextPos = (this.Pos + 1) % 4;
        this.prevPos = (this.Pos + 3) % 4;
    }

    boradInit(boardId) {
        const findDealerAndVul = (id) => {
            const dealer = id % 4;
            const mod16 = id % 16 + 1;
            let vul;
            if ([1, 8, 11, 14].includes(mod16)) vul = VulNum['N'];
            else if ([2, 5, 12].includes(mod16)) vul = VulNum['NS'];
            else if ([3, 6, 9, 16].includes(mod16)) vul = VulNum['EW'];
            else if ([4, 7, 10, 13].includes(mod16)) vul = VulNum['B'];
            return [dealer, vul];
        };

        this.boradId = boardId;
        [this.dealer, this.vul] = findDealerAndVul(boardId);
    }

    toCardName(card) {
        return CardName[card] ?? -1;
    }

    toCardNum(card) {
        return CardNum[card.toUpperCase()] ?? -1;
    }

    toBidName(bid) {
        return BidName[bid] ?? '';
    }

    toBidNum(bid) {
        return BidNum[bid.toUpperCase()] ?? -1;
    }

    display() {
        const ids = ['downCard', 'leftCard', 'upCard', 'rightCard']
        const ids2 = ['downHand', 'leftHand', 'upHand', 'rightHand']
        loadCards(this.cards.sort((a, b) => a - b), null, 'downHand');
        if (this.gameStage == 'play') {
            let id2 = ids2[(this.dummyPos - this.Pos + 4) % 4]
            loadCards(this.dummyCards.sort((a, b) => a - b), null, id2);

            for (let i = 0; i < 4; i++) {
                let id = ids[(this.leadPos + i - this.Pos + 4) % 4]
                if (i < this.oneRoundCards.length)
                    loadCards([this.oneRoundCards[i]], null, id);
                else
                    loadCards([], null, id);
            }

        }
        const bidDiv = document.getElementById('bidHistory');
        if (this.bidList && this.bidList.length > 0) {
            const bidStrings = this.bidList.map(i => BidName[i] ?? '?');
            bidDiv.textContent = 'Bidding History: ' + bidStrings.join(' → ');
        } else {
            bidDiv.textContent = 'Bidding History: (none)';
        }
        const infoDiv = document.getElementById('gameInfo');
        if (infoDiv) {
            infoDiv.innerHTML = `
            <p>Position: ${PostionName[this.Pos] ?? 'N/A'}</p>
            <p>Deal Name: ${this.dealName ?? 'N/A'}</p>
            <p>Declarer Tricks: ${this.declarerTrick ?? 0}</p>
            <p>Defender Tricks: ${this.defenderTrick ?? 0}</p>
            <p>Vulnerability: ${VulName[this.vul] ?? 'None'}</p>
            <p>Board ID: ${this.boradId ?? 'N/A'}</p>`;
        }
    }
    async shuffle() {
        // 有加密洗牌的話，使用協定協商處理（尚未實作）
        if (this.encryption && this.protocol) {
            await this.protocol.shuffle(this.p2pInterface);
            await this.protocol.dealCards(this.p2pInterface);
            this.cards = this.protocol.cards;
            return this.cards;
        }

        // 自己是發牌人（dealer）
        if (this.Pos === this.dealer) {
            let cards = Array.from({ length: 52 }, (_, i) => i);

            if (this.schuffleCheat) {
                const cmd = parseInt(prompt(
                    '決定你的洗牌方式:\n' +
                    '1: 正常洗牌\n' +
                    '2: 自己拿超好牌\n' +
                    '3: 發奇怪的牌'
                ), 10);

                if (cmd === 1) {
                    cards = this.shuffleArray(cards);
                } else if (cmd === 2) {
                    let t = 0;
                    for (let j = 12; j >= 0; j--) {
                        for (let i = 0; i < 4; i++) {
                            cards[t++] = 13 * i + j;
                        }
                    }
                } else {
                    // 發奇怪的牌（可自訂）
                    console.warn("奇怪的牌尚未定義");
                }
            } else {
                cards = this.shuffleArray(cards);
            }

            // 分給其他人
            await this.p2pInterface.sendMsg({ type: 'shuffle', cards: cards.slice(13, 26) }, (this.Pos + 1) % 4);
            await this.p2pInterface.sendMsg({ type: 'shuffle', cards: cards.slice(26, 39) }, (this.Pos + 2) % 4);
            await this.p2pInterface.sendMsg({ type: 'shuffle', cards: cards.slice(39, 52) }, (this.Pos + 3) % 4);

            // 自己的牌
            this.cards = cards.slice(0, 13).sort((a, b) => a - b);
        } else {
            // 等待接收牌
            const msg = await this.p2pInterface.recvMsg('shuffle');
            this.cards = msg.cards.map(Number).sort((a, b) => a - b);
        }

        return this.cards;
    }

    // 輔助函數：Fisher-Yates 洗牌
    shuffleArray(array) {
        const arr = [...array];
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        return arr;
    }

    async bid() {

        const isValidBid = (bid, bidList) => {
            const [lastBid, lastBidPos, double] = findLastBid(bidList);
            const Pos = bidList.length % 4;

            if (bid === -1) return false; // 無效編號
            if (bid === 35) return true;  // Pass

            if (bid === 36) return (lastBidPos + Pos) % 2 === 1 && double === 0 && lastBid !== -1; // X
            if (bid === 37) return (lastBidPos + Pos) % 2 === 0 && double === 1 && lastBid !== -1; // XX

            return bid > lastBid;
        };

        const findLastBid = (bidList) => {
            let lastBid = -1, lastBidPos = -1, double = 0;
            for (let i = 0; i < bidList.length; i++) {
                const bid = bidList[i];
                if (bid < 35) {
                    lastBid = bid;
                    lastBidPos = i % 4;
                    double = 0;
                } else if (bid === 36) {
                    double = 1;
                } else if (bid === 37) {
                    double = 2;
                }
            }
            return [lastBid, lastBidPos, double];
        };

        const findDeal = (bidList, dealer) => {
            let finalBid = -1, finalPos = 0, double = 0;
            bidList.forEach((bid, i) => {
                if (bid < 35) {
                    finalBid = bid;
                    finalPos = i % 4;
                    double = 0;
                } else if (bid === 36) {
                    double = 1;
                } else if (bid === 37) {
                    double = 2;
                }
            });

            if (finalBid === -1) return [-1, -1, -1, 0];

            let declarerPos = -1;
            for (let i = 0; i < bidList.length; i++) {
                if ((i % 4 === finalPos || i % 4 === (finalPos + 2) % 4) &&
                    bidList[i] < 35 && bidList[i] % 5 === finalBid % 5) {
                    declarerPos = (i + dealer) % 4;
                    break;
                }
            }

            return [Math.floor(finalBid / 5), finalBid % 5, declarerPos, double];
        };

        const isBidFinish = (bidList) => {
            if (bidList.length < 4) return false;
            const last3 = bidList.slice(-3);
            return last3.every(b => b === 35); // 連續3個pass
        };

        const getDealName = (level, trump, declarerPos, double) => {
            if (level === -1) return 'AP';
            return `${LevelName[level]}${TrumpsName[trump]}${PostionName[declarerPos]}${DoubleName[double]}`;
        };

        const promptBid = async (bidList) => {
            let bid = await new Promise(resolve => showBidUI(resolve));
            while (!isValidBid(bid, bidList)) {
                console.log('error bid')
                bid = await new Promise(resolve => showBidUI(resolve));
            }
            return bid;
        };

        // ----- 開始叫牌 -----
        this.bidList = [];

        // 如果是第一個
        this.display()
        if (this.Pos === this.dealer) {
            const bid = await promptBid(this.bidList);
            this.bidList.push(bid);
            await this.p2pInterface.sendMsg({ type: 'bid', bid, from: this.Pos });
        }

        while (true) {
            this.display()

            const msg = await this.p2pInterface.recvMsg('bid');
            const bid = Number(msg.bid);
            this.bidList.push(bid);
            this.display()
            if (isBidFinish(this.bidList)) {
                const [level, trump, declarerPos, double] = findDeal(this.bidList, this.dealer);
                this.level = level;
                this.trump = trump;
                this.declarerPos = declarerPos;
                this.double = double;
                this.dealName = getDealName(level, trump, declarerPos, double);
                console.log("叫牌結束，合約為:", this.dealName);
                break;
            }

            if (Number(msg.from) === this.prevPos) {
                const newBid = await promptBid(this.bidList);
                this.bidList.push(newBid);
                await this.p2pInterface.sendMsg({ type: 'bid', bid: newBid, from: this.Pos });

                if (isBidFinish(this.bidList)) {
                    const [level, trump, declarerPos, double] = findDeal(this.bidList, this.dealer);
                    this.level = level;
                    this.trump = trump;
                    this.declarerPos = declarerPos;
                    this.double = double;
                    this.dealName = getDealName(level, trump, declarerPos, double);
                    console.log("叫牌結束，合約為:", this.dealName);
                    break;
                }
            }
        }
    }
    async play() {
        const isValidCard = (card, hand, oneRoundCards) => {
            if (!hand.includes(card)) return false;
            if (oneRoundCards.length === 0) return true;
            const leadSuit = Math.floor(oneRoundCards[0] / 13);
            if (Math.floor(card / 13) === leadSuit) return true;
            return !hand.some(c => Math.floor(c / 13) === leadSuit);
        };

        const compare4Cards = (cards, trump, leadPos = 0) => {
            const compare2Cards = (card1, card2, trump, leadSuit) => {
                const suit1 = Math.floor(card1 / 13);
                const num1 = card1 % 13;
                const suit2 = Math.floor(card2 / 13);
                const num2 = card2 % 13;

                if (suit1 === suit2) {
                    return num1 > num2 ? 0 : 1;
                } else if (suit1 === trump) {
                    return 0;
                } else if (suit2 === trump) {
                    return 1;
                } else if (suit1 === leadSuit) {
                    return 0;
                } else {
                    return 1;
                }
            };

            const leadSuit = Math.floor(cards[0] / 13);
            let maxCard = cards[0];
            let maxCardId = 0;

            for (let i = 1; i < cards.length; i++) {
                if (compare2Cards(maxCard, cards[i], trump, leadSuit) === 1) {
                    maxCard = cards[i];
                    maxCardId = i;
                }
            }
            console.log(cards, trump, leadPos, maxCardId)
            return (maxCardId + leadPos) % 4;
        };


        const getCard = async (hand, oneRoundCards, type) => {
            if (this.autoPlay) {
                for (const c of hand) {
                    if (isValidCard(c, hand, oneRoundCards)) {
                        return c;
                    }
                }
            }
            const ids2 = ['downHand', 'leftHand', 'upHand', 'rightHand']
            let id
            if (type == 'dummy')
                id = ids2[(this.dummyPos - this.Pos + 4) % 4]
            else
                id = ids2[0]
            return new Promise(resolve => {
                loadCards(hand.sort((a, b) => a - b), (cardNum) => {
                    if (isValidCard(cardNum, hand, oneRoundCards)) {
                        resolve(cardNum); // 合法就結束等待
                    } else {
                        alert("這張牌不能出，請重新點選合法的牌。");
                    }
                }, id);
            });
        };

        const playOneRound = async () => {
            this.playPos = this.leadPos
            this.oneRoundCards = []
            for (let _ = 0; _ < 4; _ = _ + 1) {
                console.log(_, this.roundNum, this.playPos, this.leadPos, this.oneRoundCards)
                if (_ == 1 && this.roundNum == 0)
                    await dummyLaid()
                    this.display()
                if (this.Pos === this.playPos) {
                    await playOneCard()
                } else {
                    await otherPlayOneCard()
                }
                this.display()
                if (this.playPos == this.dummyPos && this.Pos != this.dummyPos) {

                    const lastCard = this.oneRoundCards[this.oneRoundCards.length - 1];
                    const idx = this.dummyCards.indexOf(lastCard);
                    if (idx !== -1) {
                        this.dummyCards.splice(idx, 1);
                    }
                    this.display()
                }
                if (this.isHashChain)
                    pass
                //this.hashChain.add_operation(f'type:play, playerId:{this.playPos}, play:{this.oneRoundCards[-1]}')
                this.playPos = (this.playPos + 1) % 4
            }
            this.display()
            //await waitForClick()
            let winner = compare4Cards(this.oneRoundCards, this.trump, this.leadPos)
            this.leadPos = winner
            this.trick += (winner + this.Pos) % 2 == 0
            this.declarerTrick += (winner + this.declarerPos) % 2 == 0
            this.defenderTrick += (winner + this.declarerPos) % 2 != 0
        };


        const play13Rounds = async () => {
            if (this.dealName === 'AP') return;
            for (this.roundNum = 0; this.roundNum < 13; this.roundNum++)
                await playOneRound()
        };
        const dummyLaid = async () => {
            if (this.Pos == this.dummyPos) {
                let msg = {
                    'type': 'laid',
                    'dummyCards': this.cards,
                    'from': this.Pos,
                }
                await this.p2pInterface.sendMsg(msg)
            }
            else {
                let msg = await this.p2pInterface.recvMsg('laid')
                this.dummyCards = msg["dummyCards"]
                this.dummyCards = this.dummyCards.map(Number);
                this.dummyIsLaid = true
            }
        };
        const waitForClick = async () => {
            return new Promise(resolve => {
                const handler = () => {
                    document.removeEventListener('click', handler); // 只執行一次
                    resolve();
                };
                document.addEventListener('click', handler);
            });
        }
        const playOneCard = async () => {
            //決定card_val
            let card_val = ''
            if (this.Pos == this.dummyPos) {//叫莊家決定
                let msg = {
                    'type': 'dummy',
                    'dummyCards': this.cards,
                    'oneRoundCards': this.oneRoundCards,
                    'from': this.Pos
                }
                await this.p2pInterface.sendMsg(msg, this.declarerPos)
                msg = await this.p2pInterface.recvMsg('declare')
                card_val = Number(msg["card"])
            }
            else
                card_val = await getCard(this.cards, this.oneRoundCards, 'self')

            if (this.encryption) {//如果有加密功能，叫其他人驗證
                let ok = await this.protocol.playCards(this.p2pInterface, card_val)
                if (!ok) {
                    print("牌被多人质疑！中断本轮出牌。")
                    return -1
                }
            }
            else {//否則單純送出資料
                await this.p2pInterface.sendMsg({
                    'type': 'play card',
                    'Pos': this.Pos,
                    'card_val': card_val
                })
            }
            this.cards = this.cards.filter(c => c !== card_val);
            this.oneRoundCards.push(card_val);


            return
        };

        const otherPlayOneCard = async () => {
            if (this.Pos == this.declarerPos && this.playPos == this.dummyPos) {//幫莊家出牌
                let msg = await this.p2pInterface.recvMsg('dummy')
                let dummyCards = msg["dummyCards"]
                dummyCards = dummyCards.map(Number);
                let oneRoundCards = msg["oneRoundCards"]
                oneRoundCards = oneRoundCards.map(Number);
                let card_val = await getCard(this.dummyCards, oneRoundCards, 'dummy')
                msg = {
                    'type': 'declare',
                    'card': card_val,
                    'from': this.Pos,
                }
                await this.p2pInterface.sendMsg(msg, this.dummyPos)
            }
            if (this.encryption) {//如果有加密功能，則驗證其他人的牌
                let [card_val, sender] = await this.protocol.otherPlayCards(this.p2pInterface)
                if (card_val == -1 || sender != this.playPos)
                    return -1
                this.oneRoundCards.push(card_val);

            }
            else {
                let msg = await this.p2pInterface.recvMsg('play card')
                card_val = msg["card_val"]
                this.oneRoundCards.push(card_val);
            }


            return
        }

        const initPlay = () => {
            this.roundNum = 0;
            this.declarerTrick = 0;
            this.defenderTrick = 0;
            this.trick = 0;
            this.dummyPos = (this.declarerPos + 2) % 4;
            this.leadPos = (this.declarerPos + 1) % 4;
            this.dummyIsLaid = false;
            this.dummyCards = [];
        };

        const calculateScore = (level, trump, declarerPos, vul, double, declarerTrick) => {
            const isVul = (pos, vul) => {
                if (pos === 0 || pos === 2) return vul === 1 || vul === 3;
                return vul === 2 || vul === 3;
            };
            if (level === -1) return 0;

            const vulnerable = isVul(declarerPos, vul);
            const contractTricks = level + 7;
            const made = declarerTrick >= contractTricks;
            let score = 0;

            const trickVal = trump === 4 ? [40, ...Array(level).fill(30)] : Array(level + 1).fill(trump < 2 ? 20 : 30);

            if (made) {
                let trickScore = trickVal.reduce((a, b) => a + b, 0) * (1 << double);
                score += trickScore;
                if (double === 1) score += 50;
                if (double === 2) score += 100;

                const over = declarerTrick - contractTricks;
                if (double === 0) score += over * trickVal.at(-1);
                else score += over * (vulnerable ? 200 : 100) * (1 << (double - 1));

                score += trickScore >= 100 ? (vulnerable ? 500 : 300) : 50;
                if (level === 5) score += vulnerable ? 750 : 500;
                if (level === 6) score += vulnerable ? 1500 : 1000;
            } else {
                const under = contractTricks - declarerTrick;
                if (double === 0) {
                    score -= under * (vulnerable ? 100 : 50);
                } else {
                    let penalty = 0;
                    for (let i = 0; i < under; i++) {
                        if (!vulnerable) penalty += i === 0 ? 100 : (i < 3 ? 200 : 300);
                        else penalty += i === 0 ? 200 : 300;
                    }
                    score -= penalty * (double === 2 ? 2 : 1);
                }
            }

            return (declarerPos === 1 || declarerPos === 3) ? -score : score;
        };

        const settleScore = async () => {
            if (this.Pos == this.dealer) {
                this.score = calculateScore(this.level, this.trump, this.declarerPos, this.vul, this.double, this.declarerTrick)
                let msg = {
                    'type': 'result',
                    'deal': {
                        'boradId': this.boradId,
                        'level': this.level,
                        'trump': this.trump,
                        'declarerPos': this.declarerPos,
                        'double': this.double,
                        'vul': this.vul,
                        'declarerTrick': this.declarerTrick,
                        'score': this.score
                    }
                }
                await this.p2pInterface.sendMsg(msg)
            }
            else {
                let msg = this.p2pInterface.recvMsg('result')
                console.log(msg)
            }
        }
        initPlay();
        await play13Rounds();
        await settleScore();
    }
    async run() {
        for (let i = 0; i < 8; i++) {
            this.boradInit(i)
            this.gameStage = 'shuffle'
            await this.shuffle()
            this.gameStage = 'bid'
            await this.bid()
            this.gameStage = 'play'
            await this.play()
            if (this.isHashChain && this.p2pInterface.isSignature)
                await this.updataLog()
        }
    }
}






