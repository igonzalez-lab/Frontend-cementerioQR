import CryptoJS from 'crypto-js';

export const encryptMessage = (message) => {
    const keyWordArray = CryptoJS.enc.Base64.parse(import.meta.env.VITE_HASH_PASSWORD);
    const keyWords = keyWordArray.words.slice(0, 8);
    const key = CryptoJS.lib.WordArray.create(keyWords, 32);

    const iv = CryptoJS.lib.WordArray.random(16);
    const encrypted = CryptoJS.AES.encrypt(message, key, {
        iv: iv,
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7,
    });

    const ivAndCiphertext = iv.clone().concat(encrypted.ciphertext);
    const encryptedMessageB64 = CryptoJS.enc.Base64.stringify(ivAndCiphertext);

    return encryptedMessageB64;
};

export const decryptMessage = (encryptedMessageB64) => {
    const keyWordArray = CryptoJS.enc.Base64.parse(import.meta.env.VITE_HASH_PASSWORD);
    const keyWords = keyWordArray.words.slice(0, 8);
    const key = CryptoJS.lib.WordArray.create(keyWords, 32);

    const encryptedMessage = CryptoJS.enc.Base64.parse(encryptedMessageB64);
    const ivWords = encryptedMessage.words.slice(0, 4);
    const iv = CryptoJS.lib.WordArray.create(ivWords, 16);

    const cipherTextWords = encryptedMessage.words.slice(4);
    const cipherTextSigBytes = encryptedMessage.sigBytes - 16;
    const cipherText = CryptoJS.lib.WordArray.create(cipherTextWords, cipherTextSigBytes);

    const decrypted = CryptoJS.AES.decrypt(
        { ciphertext: cipherText },
        key,
        {
            iv: iv,
            mode: CryptoJS.mode.CBC,
            padding: CryptoJS.pad.Pkcs7,
        }
    );
    const decryptedText = decrypted.toString(CryptoJS.enc.Utf8);

    return decryptedText;
};