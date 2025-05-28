const ec = new EC('secp256k1');
const G = ec.g;
const n = ec.curve.n;
const BN = ec.curve.n.constructor;

export class Protocol {
    constructor(Pos, nPlayer = 4, nCards = 52) {
        this.Pos = Pos;
        this.nextPos = (Pos + 1) % nPlayer;
        this.nPlayer = nPlayer;
        this.nCards = nCards;
        this.Key = this.randomScalar();
        this.initP = Array(nCards);
        this.finalP = Array(nCards);
        this.allP = Array.from({ length: nPlayer }, () => Array(nCards));
        this.allK = Array.from({ length: nPlayer }, () => Array(nCards));
        this.id_to_val = Array(nCards);

        for (let i = 0; i < nCards; i++) {
            this.allK[this.Pos][i] = this.randomScalar();
            this.allP[this.Pos][i] = G.mul(this.randomScalar());
        }

    }

    randomScalar() {
        return ec.keyFromPrivate(crypto.getRandomValues(new Uint8Array(32))).getPrivate();
    }

    encrypt(P, k) {
        return P.mul(k);
    }

    decrypt(P, k) {
        const invK = new BN(k.toString()).invm(ec.curve.n);
        return P.mul(invK);
    }

    shuffleArray(cards) {
        const array = [...cards];
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    encryptCardsByKey(cards, keyList) {
        for (let i = 0; i < this.nCards; i++) {
            cards[i] = this.encrypt(cards[i], keyList[i]);
        }
        return cards;
    }

    decryptCardsByKey(cards, keyList) {
        for (let i = 0; i < this.nCards; i++) {
            cards[i] = this.decrypt(cards[i], keyList[i]);
        }
        return cards;
    }

    pointToJSON(P) {
        return { x: P.getX().toString(16), y: P.getY().toString(16) };
    }

    jsonToPoint(obj) {
        let p = ec.curve.point(obj.x, obj.y);
        console.log(this.pointToJSON(p))
        return p
        
    }

    async declarePoints(p2pInterface) {
        const points = Array(this.nCards);
        for (let i = 0; i < this.nCards; i++) {
            points[i] = this.pointToJSON(this.allP[this.Pos][i]);
        }

        await p2pInterface.sendMsg({ type: 'declare point', Pos: this.Pos, points }, -1);

        for (let i = 0; i < this.nPlayer - 1; i++) {
            const msg = await p2pInterface.recvMsg('declare point');
            const Pos = msg.Pos;
            const receivedPoints = msg.points;
            for (let j = 0; j < receivedPoints.length; j++) {
                this.allP[Pos][j] = this.jsonToPoint(receivedPoints[j]);
            }
        }

        for (let i = 0; i < this.nCards; i++) {
            let t = this.allP[0][i];
            for (let j = 1; j < this.nPlayer; j++) {
                console.log(this.pointToJSON(this.allP[j][i]))
                
                console.log(t)
                t = t.add(this.allP[j][i]);
                    
                
            }
            this.initP[i] = t
        }
    }

    async shuffle(p2pInterface) {
        await this.declarePoints(p2pInterface);

        let cards = new Array(this.nCards);
        if (this.Pos === 0) {
            for (let i = 0; i < this.nCards; i++) {
                cards[i]=this.initP[i]
                console.log(this.pointToJSON(cards[i]))
            }
        } else {
            const msg = await p2pInterface.recvMsg('shuffle');
            for (let i = 0; i < this.nCards; i++) {
                cards[i] = this.jsonToPoint(msg.cards[i]);
                console.log(this.pointToJSON(cards[i]))
            }
        }

        cards = this.shuffleArray(cards);
        cards = this.encryptCardsByKey(cards, Array(this.nCards).fill(this.Key));

        const payload = {
            type: 'shuffle',
            cards: new Array(this.nCards)
        };
        for (let i = 0; i < this.nCards; i++) {
            payload.cards[i] = this.pointToJSON(cards[i]);
        }

        await p2pInterface.sendMsg(payload, this.nextPos);

        const msg2 = await p2pInterface.recvMsg('shuffle');
        cards = new Array(this.nCards);
        for (let i = 0; i < this.nCards; i++) {
            cards[i] = this.jsonToPoint(msg2.cards[i]);
        }

        cards = this.decryptCardsByKey(cards, Array(this.nCards).fill(this.Key));
        cards = this.encryptCardsByKey(cards, this.allK[this.Pos]);

        const encrypted = new Array(this.nCards);
        for (let i = 0; i < this.nCards; i++) {
            encrypted[i] = this.pointToJSON(cards[i]);
            
        }

        if (this.nextPos === 0) {
            await p2pInterface.sendMsg({ type: 'shuffle', cards: encrypted }, -1);
            for (let i = 0; i < this.nCards; i++) {
                this.finalP[i] = cards[i];
            }
        } else {
            await p2pInterface.sendMsg({ type: 'shuffle', cards: encrypted }, this.nextPos);
            const msg3 = await p2pInterface.recvMsg('shuffle');
            for (let i = 0; i < this.nCards; i++) {
                this.finalP[i] = this.jsonToPoint(msg3.cards[i]);
            }
        }
    }

    async dealCards(p2pInterface) {
        for (let Pos = 0; Pos < this.nPlayer; Pos++) {
            if (Pos === this.Pos) {
                const IDs = [];
                for (let i = 0; i < this.nCards; i++) {
                    if (i % this.nPlayer === this.Pos) {
                        IDs.push(i);
                    }
                }
                await this.getCards(p2pInterface, IDs);
            } else {
                await this.otherGetCards(p2pInterface);
            }
        }
        return this.cards;
    }

    async getCards(p2pInterface, IDs) {
        const req = { type: 'request_keys', Pos: this.Pos, IDs };
        await p2pInterface.sendMsg(req, -1);

        let received = 0;
        while (received < this.nPlayer - 1) {
            const msg = await p2pInterface.recvMsg('provide_keys');
            const sender = parseInt(msg.Pos);
            const keys = msg.keys;
            for (let i = 0; i < keys.length; i++) {
                const cardId = parseInt(keys[i].index);
                const key = new BN(keys[i].key, 16);
                this.allK[sender][cardId] = key;
            }
            received++;
        }

        this.cards = [];
        for (let idx = 0; idx < IDs.length; idx++) {
            const cardId = IDs[idx];
            let kProd = new BN(1);
            for (let p = 0; p < this.nPlayer; p++) {
                kProd = kProd.mul(this.allK[p][cardId]).umod(n);
            }
            const P0 = this.decrypt(this.finalP[cardId], kProd);

            let found = false;
            for (let i = 0; i < this.nCards; i++) {
                if (P0.eq(this.initP[i])) {
                    this.id_to_val[cardId] = i;
                    this.cards.push(i);
                    found = true;
                    break;
                }
            }
            if (!found) {
                console.warn(`Card ${cardId} 解密後無對應 initP`);
            }
        }
    }

    async otherGetCards(p2pInterface) {
        let received = 0;
        while (received < this.nPlayer - 1) {
            const msg = await p2pInterface.recvMsg();
            if (msg.type === 'request_keys') {
                const requester = parseInt(msg.Pos);
                const IDs = msg.IDs;

                const keys = [];
                for (let i = 0; i < IDs.length; i++) {
                    keys.push({
                        index: IDs[i],
                        key: this.allK[this.Pos][IDs[i]].toString(16)
                    });
                }

                const resp = {
                    type: 'provide_keys',
                    Pos: this.Pos,
                    keys
                };

                await p2pInterface.sendMsg(resp, -1);
                received++;
            } else if (msg.type === 'provide_keys') {
                const sender = parseInt(msg.Pos);
                for (let i = 0; i < msg.keys.length; i++) {
                    const cardId = parseInt(msg.keys[i].index);
                    this.allK[sender][cardId] = new BN(msg.keys[i].key, 16);
                }
                received++;
            }
        }
    }

    async playCards(p2pInterface, cardVal) {
        const cardId = this.id_to_val.indexOf(cardVal);
        const myKey = this.allK[this.Pos][cardId];

        const msg = {
            type: 'play card',
            Pos: this.Pos,
            card_id: cardId,
            key: myKey.toString(16),
            card_val: cardVal
        };
        await p2pInterface.sendMsg(msg, -1);

        let confirmed = 0;
        while (confirmed < this.nPlayer - 1) {
            const res = await p2pInterface.recvMsg('check card');
            if (res.msg === 'ok') {
                confirmed++;
            } else {
                console.warn('出牌遭質疑，不合法！');
                return -1;
            }
        }
        return 1;
    }
    async otherPlayCards(p2pInterface) {
        const msg = await p2pInterface.recvMsg('play card');

        const cardId = parseInt(msg.card_id);
        const cardVal = parseInt(msg.card_val);
        const sender = parseInt(msg.Pos);
        const key = new BN(msg.key, 16);

        this.allK[sender][cardId] = key;

        let kProd = new BN(1);
        for (let i = 0; i < this.nPlayer; i++) {
            kProd = kProd.mul(this.allK[i][cardId]).umod(n);
        }

        const P = this.finalP[cardId];
        const decrypted = this.decrypt(P, kProd);

        const expectedPoint = this.initP[cardVal];
        const isValid = decrypted.eq(expectedPoint);

        const reply = {
            type: 'check card',
            msg: isValid ? 'ok' : 'not ok'
        };

        await p2pInterface.sendMsg(reply, sender);
        return isValid ? [cardVal, sender] : [-1, sender];
    }
}








