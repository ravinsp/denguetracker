import { Injectable } from '@angular/core';
import * as sodium from 'libsodium-wrappers';

@Injectable({
  providedIn: 'root'
})
export class KeyService {

  private keys: any = null;

  constructor() {
    sodium.ready.then(() => { console.log('Sodium loaded.') }).catch((e) => { console.log(e) })
  }

  getKeys() {

    if (!this.keys) {
      this.keys = sodium.crypto_sign_keypair();
      this.keys.privateKeyHex = sodium.to_hex(this.keys.privateKey)
      this.keys.publicKeyHex = sodium.to_hex(this.keys.publicKey)
    }

    return this.keys;
  }

}
