import * as Crypto from "expo-crypto";
import { File } from "expo-file-system";
import { Platform } from "react-native";

export interface Block {
  index: number;
  timestamp: number;
  documentName: string;
  documentHash: string;
  fileSize: number;
  mimeType: string;
  ownerAddress: string;
  chatId: string;
  previousHash: string;
  hash: string;
  version?: 2;
}

export async function computeFileHash(
  fileName: string,
  fileSize: number,
  mimeType: string,
  uri: string
): Promise<string> {
  const maxSize = 20 * 1024 * 1024;
  if (fileSize > maxSize) throw new Error("Fayl hajmi 20 MB dan oshmasligi kerak.");
  const bytes = Platform.OS === "web"
    ? new Uint8Array(await (await fetch(uri)).arrayBuffer())
    : await new File(uri).bytes();
  if (bytes.byteLength > maxSize) throw new Error("Fayl hajmi 20 MB dan oshmasligi kerak.");
  const hash = await Crypto.digest(Crypto.CryptoDigestAlgorithm.SHA256, bytes);
  return Array.from(new Uint8Array(hash), b => b.toString(16).padStart(2, "0")).join("");
}

export async function computeBlockHash(block: Omit<Block, "hash">): Promise<string> {
  const content = JSON.stringify({
    index: block.index,
    timestamp: block.timestamp,
    documentName: block.documentName,
    documentHash: block.documentHash,
    ownerAddress: block.ownerAddress,
    previousHash: block.previousHash,
    ...(block.version === 2 ? { version: 2, fileSize: block.fileSize, mimeType: block.mimeType, chatId: block.chatId } : {}),
  });
  return await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    content
  );
}

export async function createBlock(params: {
  index: number;
  documentName: string;
  documentHash: string;
  fileSize: number;
  mimeType: string;
  ownerAddress: string;
  chatId: string;
  previousHash: string;
}): Promise<Block> {
  const timestamp = Date.now();
  const blockData = {
    ...params,
    timestamp,
    version: 2 as const,
  };
  const hash = await computeBlockHash(blockData);
  return { ...blockData, hash };
}

export async function verifyDocumentInChain(
  documentHash: string,
  chain: Block[]
): Promise<{ verified: boolean; block: Block | null }> {
  const block = chain.find((b) => b.documentHash === documentHash && b.version === 2);
  if (!block) return { verified: false, block: null };
  for (let i = 0; i < chain.length; i++) {
    const current = chain[i];
    if (current.index !== i || current.previousHash !== (i ? chain[i - 1].hash : getGenesisHash()) || await computeBlockHash(current) !== current.hash) {
      return { verified: false, block: null };
    }
  }
  return { verified: true, block };
}

export function generateWalletAddress(): string {
  return "0x" + Array.from(Crypto.getRandomBytes(20), b => b.toString(16).padStart(2, "0")).join("");
}

export function shortAddress(address: string): string {
  if (address.length < 10) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function getGenesisHash(): string {
  return "0000000000000000000000000000000000000000000000000000000000000000";
}
