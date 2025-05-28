// client.js
import { DigitalSignature } from './encrypt/signature.js';
import { SocketTools } from './socketTools.js';
export class P2PWorker {
    constructor(serverUrl, queue, userId) {
        try {
            this.socket = new WebSocket(serverUrl);
        } catch (e) {
            console.error('WebSocket 创建失败:', e);
            return; // 创建失败时退出，避免后续错误
        }
        this.queue = queue;
        this.userId = userId;
        this.isConnect = false;
    
        console.log('Server URL:', serverUrl);
        this.connect();
    }

    cleanup() {
        this.socket.close();
        this.isConnect = false;
    }

    ready() {
        return new Promise((resolve) => {
            if (this.socket.readyState === WebSocket.OPEN) {
                resolve();
            } else {
                this.socket.addEventListener('open', () => resolve(), { once: true });
            }
        });
    }
    
    connect(){
        console.log('Connecting to WebSocket...');
        this.socket.onopen = () => {
            this.isConnect = true;
            console.log("WebSocket 已连接");
            try {
                SocketTools.attachReceiver(this.socket, this.queue);
            } catch (e) {
                console.error('attachReceiver 错误:', e);
            }
        };
        this.socket.onclose = (event) => {
            this.isConnect = false;
            console.warn("WebSocket 断开，代码:", event.code, "原因:", event.reason);
        };
        this.socket.onerror = (error) => {
            console.error("WebSocket 错误:", error);
        };
        console.log('p2pworker 初始化完成');
    }
}


export class P2PInterface {
    constructor(peerNum = 4, isSignature = false, serverUrl = 'ws://140.112.30.186:8765') {
        this.serverUrl = serverUrl;
        this.peerNum = peerNum;
        this.isSignature = isSignature;
        this.queue = [];
        this.usedNonces = new Set();
        
        if (isSignature) {
            this.digitalSignature = new DigitalSignature();
            this.userId = this.digitalSignature.getUserId();
        }
        this.worker = new P2PWorker(serverUrl, this.queue, this.userId);
        // ❌ 不再在 constructor 裡呼叫 this.initP2P()
    }

    async init() {
        this.worker.connect();
        await this.worker.ready();
        
        await this.initP2P();
    }

    async initP2P() {
        await this.sendMsg({ type: 'login' }, -2);
        await this.sendMsg({ type: 'join' }, -2);
        
        while (true) {
            const msg = await this.recvMsg('server');
            console.log('Received message, processing:', msg);
            if (msg && msg["is full"]) {
                this.index = Number(msg.id);
                this.userIds = [...msg.userIds];
                console.log(`P2P Interface initialized with index: ${this.index}, userIds: ${this.userIds}`);
                break;
            }
            console.log('Waiting for full message from server...');
        }
    }

    async sendMsg(message, peerIndex = -1) {
        if (!message.type) {
            console.error('Message must contain type');
            return;
        }

        await SocketTools.sendMsg(
            this.worker.socket,
            this.index,
            peerIndex,
            this.isSignature && this.alreadyExchangePubKey,
            this.userId,
            message,
            this.digitalSignature
        );
    }

    async recvMsg(type = '') {
        console.log(`Waiting for message of type: ${type}`);
        return await SocketTools.getMsg(this.queue, type, null, 30, this.usedNonces);
    }
}
