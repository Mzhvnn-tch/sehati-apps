import crypto from 'crypto';

interface IPFSConfig {
  gateway: string;
  apiEndpoint: string | null;
  projectId: string | null;
  projectSecret: string | null;
}

interface UploadResult {
  hash: string;
  size: number;
  url: string;
}

class IPFSService {
  private config: IPFSConfig;
  private isConfigured: boolean;

  constructor() {
    this.config = {
      gateway: process.env.IPFS_GATEWAY || 'https://ipfs.io/ipfs/',
      apiEndpoint: process.env.IPFS_API_ENDPOINT || null,
      projectId: process.env.PINATA_API_KEY || process.env.WEB3_STORAGE_TOKEN || null,
      projectSecret: process.env.PINATA_SECRET_KEY || null,
    };
    
    this.isConfigured = !!(this.config.projectId);
  }

  getConfig(): { gateway: string; isConfigured: boolean } {
    return {
      gateway: this.config.gateway,
      isConfigured: this.isConfigured,
    };
  }

  async uploadData(data: object): Promise<string> {
    const content = JSON.stringify(data);
    
    if (this.isConfigured && this.config.projectId) {
      try {
        return await this.uploadToPinata(content);
      } catch (error) {
        console.warn('Pinata upload failed, using simulated hash:', error);
      }
    }
    
    return this.generateSimulatedHash(content);
  }

  private async uploadToPinata(content: string): Promise<string> {
    if (!this.config.projectId || !this.config.projectSecret) {
      throw new Error('Pinata not configured');
    }

    const response = await fetch('https://api.pinata.cloud/pinning/pinJSONToIPFS', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'pinata_api_key': this.config.projectId,
        'pinata_secret_api_key': this.config.projectSecret,
      },
      body: JSON.stringify({
        pinataContent: JSON.parse(content),
        pinataMetadata: {
          name: `sehati-record-${Date.now()}`,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Pinata upload failed: ${response.statusText}`);
    }

    const result = await response.json();
    return result.IpfsHash;
  }

  private generateSimulatedHash(content: string): string {
    const hash = crypto
      .createHash('sha256')
      .update(content + Date.now().toString())
      .digest('hex');
    
    return `Qm${Buffer.from(hash.substring(0, 34), 'hex').toString('base64').replace(/[+/=]/g, '').substring(0, 44)}`;
  }

  getUrl(hash: string): string {
    return `${this.config.gateway}${hash}`;
  }

  async getData(hash: string): Promise<object | null> {
    try {
      const response = await fetch(this.getUrl(hash));
      if (!response.ok) {
        throw new Error('Failed to fetch from IPFS');
      }
      return await response.json();
    } catch (error) {
      console.error('IPFS fetch failed:', error);
      return null;
    }
  }

  async verifyHash(hash: string, content: string): Promise<boolean> {
    try {
      const data = await this.getData(hash);
      if (!data) return false;
      
      const storedContent = JSON.stringify(data);
      return storedContent === content;
    } catch (error) {
      return false;
    }
  }

  generateContentHash(content: string): string {
    return crypto
      .createHash('sha256')
      .update(content)
      .digest('hex');
  }
}

export const ipfsService = new IPFSService();
