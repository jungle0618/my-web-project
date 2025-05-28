// socketTools.js
export class SocketTools {
    static async sendMsg(websocket, index, peerIndex, isSignature, userId, msg = {}, digitalSignature = null) {
        // peerIndex=-1為sendall, -2為send to server
        console.log(`Sending message: ${JSON.stringify(msg)}`);
        const msg1 = SocketTools.wrapWithSignature(msg, index, peerIndex, userId, isSignature, digitalSignature);
        
        await SocketTools.transMsg(websocket, msg1);
    }

    static async transMsg(websocket, msg) {
        // WebSocket async 發送
        const msg_str = JSON.stringify(msg);
        
        // 檢查 WebSocket 連接狀態
        if (websocket.readyState === WebSocket.OPEN) {
            websocket.send(msg_str);
        } else {
            throw new Error(`WebSocket is not open. ReadyState: ${websocket.readyState}`);
        }
    }
    

    static wrapWithSignature(message, index, peerIndex, userId, isSignature, digitalSignature) {
        const timestamp = Math.floor(Date.now() / 1000);
        const nonce = this.generateNonce(16);
        if (isSignature && digitalSignature) {
            const secureMessage = {
                original_message: message,
                timestamp,
                nonce,
                sender_index: index,
                peer_index: peerIndex,
                userId
            };
            const messageStr = JSON.stringify(secureMessage);
            const signature = digitalSignature.sign(messageStr);

            return {
                metadata: {
                    timestamp,
                    nonce,
                    sender: index,
                    receiver: peerIndex,
                    userId,
                    publicKey: digitalSignature.getPublicKey()
                },
                payload: message,
                signature,
                isSigned: true
            };
        } else {
            return {
                metadata: { timestamp, nonce, sender: index, receiver: peerIndex, userId },
                payload: message,
                isSigned: false
            };
        }
    }
    static generateNonce(length) {
        const array = new Uint8Array(length);
        window.crypto.getRandomValues(array);
        return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
    }

    static attachReceiver(websocket, queue) {
    
        websocket.addEventListener('message', (event) => {
            try {
                const data = JSON.parse(event.data);
                queue.push(data);
            } catch (error) {
                console.error(`Invalid JSON: ${event.data}, error: ${error}`);
            }
        });
    
        websocket.addEventListener('error', (error) => {
            console.error('WebSocket error:', error);
        });
    
        websocket.addEventListener('close', () => {
            console.warn('WebSocket connection closed');
        });
    }

    static async getMsg(queue, type = '', digitalSignature = null, maxTimestampDiff = 30, usedNonces = new Set()) {
        const tempQueue = [];
        while (true) {
            console.log(queue.length)
            while (queue.length === 0) {
                await new Promise(resolve => setTimeout(resolve, 100)); // 每 100ms 檢查一次
            }
            
            const rawData = queue.shift();
            console.log(rawData)
            // Basic checks
            if (typeof rawData !== 'object') {
                tempQueue.push(rawData);
                continue;
            }


            // Type filter
            if (type!='' && rawData.payload?.type !== type) {
                tempQueue.push(rawData);
                continue;
            }

            // Signature verification
            if (digitalSignature && rawData.isSigned) {
                // ...（驗證邏輯實現，使用Web Crypto API）
            }

            // Return valid message
            
            queue.unshift(...tempQueue);
            console.log(`Received message: ${JSON.stringify(rawData.payload)}`);
            return rawData.payload;
        }
    }
}