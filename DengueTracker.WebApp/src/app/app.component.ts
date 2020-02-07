import { Component } from '@angular/core';
import { SelectItem } from 'primeng/api';
import { WebSocketService } from './websocket.service'
import * as sodium from 'libsodium-wrappers';
import { KeyService } from './key.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {

  title = 'Dengue Tracker';
  version = 'v1.0.200206'

  resultOptions: SelectItem[] = [];
  selectedResult: number;

  loggedIn: boolean = false;
  orgKey: string = "";

  constructor(private ws: WebSocketService, private ks: KeyService) {

    this.selectedResult = 0;
    this.resultOptions = [
      { label: 'Positive', value: 1 },
      { label: 'Negative', value: 2 }
    ];

    ws.connected.subscribe(() => { this.ws_connected(); })
    ws.disconnected.subscribe(() => { this.ws_disconnected(); })

  }

  login() {
    this.ws.connect();
  }

  logout() {

  }

  ws_connected() {
    this.ws.send(this.createInputMsg('abc'));
    this.ws.send(this.createInputMsg('def'));
  }

  ws_disconnected() {
    this.logout();
  }

  createInputMsg(inp: string) {

    const keys = this.ks.getKeys();

    const inpContainer = {
      nonce: (new Date()).getTime().toString(),
      input: sodium.to_hex(sodium.from_string(inp + '\n')),
      max_ledger_seqno: 999999
    }
    const inpContainerBytes = JSON.stringify(inpContainer);

    const sigBytes = sodium.crypto_sign_detached(inpContainerBytes, keys.privateKey);

    let signedInpContainer = {
      type: "contract_input",
      content: inpContainerBytes,
      sig: sodium.to_hex(sigBytes)
    }

    return signedInpContainer;
  }
}
