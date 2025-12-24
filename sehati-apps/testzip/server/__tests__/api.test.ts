import { describe, it, expect, vi, beforeEach } from 'vitest';
import { web3Service } from '../services/web3';
import { ipfsService } from '../services/ipfs';

describe('Web3 Service', () => {
  describe('generateWallet', () => {
    it('should generate a valid Ethereum wallet', () => {
      const wallet = web3Service.generateWallet();
      
      expect(wallet).toHaveProperty('address');
      expect(wallet).toHaveProperty('privateKey');
      expect(wallet).toHaveProperty('mnemonic');
      expect(wallet.address).toMatch(/^0x[a-fA-F0-9]{40}$/);
      expect(wallet.privateKey).toMatch(/^0x[a-fA-F0-9]{64}$/);
    });
  });

  describe('isValidAddress', () => {
    it('should return true for valid Ethereum addresses', () => {
      expect(web3Service.isValidAddress('0x71C7656EC7ab88b098defB751B7401B5f6d8976F')).toBe(true);
    });

    it('should return false for invalid addresses', () => {
      expect(web3Service.isValidAddress('invalid')).toBe(false);
      expect(web3Service.isValidAddress('0x123')).toBe(false);
      expect(web3Service.isValidAddress('')).toBe(false);
    });
  });

  describe('generateNonce', () => {
    it('should generate a random 64-character hex nonce', () => {
      const nonce = web3Service.generateNonce();
      expect(nonce).toMatch(/^[a-f0-9]{64}$/);
    });

    it('should generate unique nonces', () => {
      const nonce1 = web3Service.generateNonce();
      const nonce2 = web3Service.generateNonce();
      expect(nonce1).not.toBe(nonce2);
    });
  });

  describe('generateSignMessage', () => {
    it('should generate a message containing the wallet address and nonce', () => {
      const nonce = 'test-nonce-123';
      const address = '0x71C7656EC7ab88b098defB751B7401B5f6d8976F';
      const message = web3Service.generateSignMessage(nonce, address);
      
      expect(message).toContain('SEHATI');
      expect(message).toContain(address);
      expect(message).toContain(nonce);
    });
  });

  describe('hashData', () => {
    it('should generate consistent hashes for the same input', () => {
      const data = 'test data';
      const hash1 = web3Service.hashData(data);
      const hash2 = web3Service.hashData(data);
      
      expect(hash1).toBe(hash2);
      expect(hash1).toMatch(/^0x[a-f0-9]{64}$/);
    });

    it('should generate different hashes for different inputs', () => {
      const hash1 = web3Service.hashData('data1');
      const hash2 = web3Service.hashData('data2');
      
      expect(hash1).not.toBe(hash2);
    });
  });

  describe('getConfig', () => {
    it('should return supported chains configuration', () => {
      const config = web3Service.getConfig();
      
      expect(config).toHaveProperty('supportedChains');
      expect(Array.isArray(config.supportedChains)).toBe(true);
      expect(config.supportedChains.length).toBeGreaterThan(0);
      
      config.supportedChains.forEach(chain => {
        expect(chain).toHaveProperty('id');
        expect(chain).toHaveProperty('name');
        expect(chain).toHaveProperty('rpcUrl');
      });
    });
  });
});

describe('IPFS Service', () => {
  describe('getConfig', () => {
    it('should return IPFS configuration', () => {
      const config = ipfsService.getConfig();
      
      expect(config).toHaveProperty('gateway');
      expect(config).toHaveProperty('isConfigured');
      expect(typeof config.gateway).toBe('string');
      expect(typeof config.isConfigured).toBe('boolean');
    });
  });

  describe('generateContentHash', () => {
    it('should generate consistent hashes for the same content', () => {
      const content = '{"test": "data"}';
      const hash1 = ipfsService.generateContentHash(content);
      const hash2 = ipfsService.generateContentHash(content);
      
      expect(hash1).toBe(hash2);
      expect(hash1).toMatch(/^[a-f0-9]{64}$/);
    });
  });

  describe('getUrl', () => {
    it('should construct proper IPFS URL from hash', () => {
      const hash = 'QmTest123';
      const url = ipfsService.getUrl(hash);
      
      expect(url).toContain(hash);
      expect(url).toContain('ipfs');
    });
  });

  describe('uploadData', () => {
    it('should return a hash when uploading data', async () => {
      const data = { test: 'data', timestamp: Date.now() };
      const hash = await ipfsService.uploadData(data);
      
      expect(typeof hash).toBe('string');
      expect(hash.length).toBeGreaterThan(0);
    });
  });
});
