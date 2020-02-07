import { Injectable, EventEmitter } from '@angular/core';
import { KeyService } from './key.service';
import * as sodium from 'libsodium-wrappers';

const ENCODING = 'utf-8';

@Injectable({
  providedIn: 'root'
})
export class WebSocketService {

  public connected: EventEmitter<any> = new EventEmitter();
  public disconnected: EventEmitter<any> = new EventEmitter();

  private socket: WebSocket = null;
  private isConnecting: boolean = false;

  constructor(private ks: KeyService) {
  }

  send(msg: any) {
    this.socket.send(JSON.stringify(msg));
  }

  connect() {

    this.socket = new WebSocket("wss://localhost:8080");

    this.socket.binaryType = 'arraybuffer';

    this.socket.onopen = (e) => {
      this.isConnecting = true;
    };

    this.socket.onmessage = (event) => {
      const str = new TextDecoder(ENCODING).decode(event.data);

      try {
        const msg = JSON.parse(str);
        this.handleHPMessage(msg);
      }
      catch (e) {
        console.log("Non json msg received: " + str);
      }

    };

    this.socket.onclose = (event) => {
      if (event.wasClean) {
        console.log(`Connection closed. code=${event.code} reason=${event.reason}`);
      } else {
        // e.g. server process killed or network down
        // event.code is usually 1006 in this case
        console.log(`Connection died. code=${event.code}`);
      }

      this.isConnecting = false;
      this.disconnected.emit();
    };

    this.socket.onerror = (error) => {
      console.log(error);
    };
  }

  handleHPMessage(msg: any) {
    if (msg.type == 'public_challenge') {
      this.handleChallenge(msg);
    }
    else if (msg.type == 'contract_output') {
      this.handleContractOutput(msg);
    }
  }

  handleChallenge(msg: any) {
    // sign the challenge and send back the response

    const keys = this.ks.getKeys();
    var sigbytes = sodium.crypto_sign_detached(msg.challenge, keys.privateKey);
    var response = {
      type: 'challenge_resp',
      challenge: msg.challenge,
      sig: sodium.to_hex(sigbytes),
      pubkey: 'ed' + keys.publicKeyHex
    }
    this.socket.send(JSON.stringify(response));

    // If we are still connected after a short period that means Hot Pocket has accepted our connection.
    setTimeout(() => {
      if (this.isConnecting) {
        console.log("HP connection established.");
        this.isConnecting = false;

        this.connected.emit()
      }
    }, 200);
  }

  handleContractOutput(msg) {
    const output: string = sodium.to_string(sodium.from_hex(msg.content));
    const lines = output.split('\n').filter(s => s.length > 0);
    console.log(lines);
  }
}
