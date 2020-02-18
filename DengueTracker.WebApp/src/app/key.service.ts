import { Injectable } from '@angular/core';

declare var sodium;

@Injectable({
  providedIn: 'root'
})
export class KeyService {

  private keys: any = null;

  getKeys() {

    if (!this.keys) {
      this.keys = sodium.crypto_sign_keypair();
      this.keys.privateKeyHex = sodium.to_hex(this.keys.privateKey)
      this.keys.publicKeyHex = sodium.to_hex(this.keys.publicKey)
    }

    return this.keys;
  }

}
