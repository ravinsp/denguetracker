import { Component, ViewChild, ElementRef } from '@angular/core';
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

  loginAttemptOngoing: boolean = false;
  loggedIn: boolean = false;
  errorMsg: string = '';
  totalCasesInSession: number = 0;

  org = { key: '', name: '' };
  caseEntry = { address: '', lat: 0, lon: 0, result: 0 };

  @ViewChild("addressInput", null) addressInput: ElementRef;

  constructor(private ws: WebSocketService, private ks: KeyService) {

    this.resultOptions = [
      { label: 'Positive', value: 1 },
      { label: 'Negative', value: 2 }
    ];

    ws.connected.subscribe(() => this.ws_connected());
    ws.disconnected.subscribe(() => this.ws_disconnected());
    ws.outputReceived.subscribe((output) => {
      // Outputs produced by Dengue tracker HP contract has the format: {origin:'', content: '<json>'}
      const obj = JSON.parse(output);
      this.ws_outputReceived(obj.origin, JSON.parse(obj.content));
    });

  }

  initiateLogin() {
    this.loginAttemptOngoing = true;
    this.errorMsg = '';
    this.ws.connect();
  }

  login(orgName: string) {
    this.loginAttemptOngoing = false;
    this.org.name = orgName;
    this.loggedIn = true;
  }

  logout() {
    this.org = { key: '', name: '' };
    this.caseEntry = { address: '', lat: 0, lon: 0, result: 0 };
    this.totalCasesInSession = 0;
    this.loggedIn = false;
    this.ws.disconnect();
  }

  submitCase() {

    const submitObj = { isPositive: (this.caseEntry.result == 1), lat: 0, lon: 0, createdBy: this.org.key };
    this.ws.send(this.createInputMsg('add-case ' + JSON.stringify(submitObj)));
    this.totalCasesInSession++;
    this.caseEntry = { address: '', lat: 0, lon: 0, result: 0 };

    this.addressInput.nativeElement.focus();
  }

  // This is called during the login attempt.
  ws_connected() {
    this.ws.send(this.createInputMsg('check-auth ' + this.org.key));
  }

  ws_disconnected() {
    this.loginAttemptOngoing = false;

    if (this.loggedIn)
      this.logout();
  }

  ws_outputReceived(origin: string, content: any) {
    if (origin == 'check-auth' && this.loginAttemptOngoing) {
      this.loginAttemptOngoing = false;

      if (content.success == true) {
        this.login(content.name);
      }
      else {
        this.errorMsg = "Invalid organization code.";
        this.ws.disconnect();
      }
    }
  }

  createInputMsg(inp: string) {

    const keys = this.ks.getKeys();

    const inpContainer = {
      nonce: (new Date()).getTime().toString(),
      input: sodium.to_hex(sodium.from_string(inp + '\n')),
      max_ledger_seqno: 999999999
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
