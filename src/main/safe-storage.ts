/**
 * 안전한 데이터 저장 모듈
 * 
 * Electron의 safeStorage API와 추가 암호화를 사용하여
 * 민감한 데이터를 안전하게 저장하고 관리합니다.
 */

import { safeStorage, app } from 'electron';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

// 타입 정의
interface SecureStorageEntry {
  callback?: () => void;
  description?: string;
  timestamp: number;
}

interface EncryptionConfig {
  algorithm: string;
  keyLength: number;
  ivLength: number;
}

// 암호화 Setup
const ENCRYPTION_CONFIG: EncryptionConfig = {
  algorithm: 'aes-256-gcm',
  keyLength: 32, // 256비트
  ivLength: 16   // 128비트
};

// 저장소 Setup
const STORAGE_DIR = path.join(app.getPath('userData'), 'secure-storage');
const KEY_FILE = 'secure-key';
const BACKUP_DIR = path.join(STORAGE_DIR, 'backups');

// 내부 상태
let encryptionKey: string | null = null;
let isInitialized = false;
const storageMetadata = new Map<string, SecureStorageEntry>();

/**
 * 안전한 저장소 초기화
 */
export async function initializeSecureStorage(): Promise<boolean> {
  try {
    // 이미 초기화된 경우
    if (isInitialized) {
      return true;
    }

    // 디렉토리 생성
    await ensureDirectoriesExist();

    // safeStorage 사용 가능성 확인
    if (!safeStorage.isEncryptionAvailable()) {
      console.warn('시스템에서 안전한 저장소 암호화를 사용할 수 없습니다.');
      return false;
    }

    // 암호화 키 로드 또는 생성
    await loadOrCreateEncryptionKey();

    // 메타데이터 로드
    await loadStorageMetadata();

    isInitialized = true;
    console.log('안전한 저장소가 초기화되었습니다.');
    return true;

  } catch (error) {
    console.error('안전한 저장소 초기화 Error:', error);
    return false;
  }
}

/**
 * 필요한 디렉토리들 생성
 */
async function ensureDirectoriesExist(): Promise<void> {
  const directories = [STORAGE_DIR, BACKUP_DIR];
  
  for (const dir of directories) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }
}

/**
 * 암호화 키 로드 또는 생성
 */
async function loadOrCreateEncryptionKey(): Promise<void> {
  const keyFilePath = path.join(STORAGE_DIR, KEY_FILE);

  try {
    if (fs.existsSync(keyFilePath)) {
      // 기존 키 파일 로드
      const encryptedKey = fs.readFileSync(keyFilePath);
      encryptionKey = safeStorage.decryptString(encryptedKey);
      console.log('기존 암호화 키를 로드했습니다.');
    } else {
      // 새 키 생성
      encryptionKey = crypto.randomBytes(ENCRYPTION_CONFIG.keyLength).toString('hex');
      
      // 암호화하여 저장
      const encryptedKey = safeStorage.encryptString(encryptionKey);
      fs.writeFileSync(keyFilePath, encryptedKey);
      console.log('새 암호화 키를 생성했습니다.');
    }
  } catch (error) {
    console.error('암호화 키 로드/생성 Error:', error);
    throw error;
  }
}

/**
 * 저장소 메타데이터 로드
 */
async function loadStorageMetadata(): Promise<void> {
  try {
    const metadataPath = path.join(STORAGE_DIR, 'metadata.json');
    
    if (fs.existsSync(metadataPath)) {
      const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
      
      for (const [key, value] of Object.entries(metadata)) {
        storageMetadata.set(key, value as SecureStorageEntry);
      }
    }
  } catch (error) {
    console.error('메타데이터 로드 Error:', error);
  }
}

/**
 * 저장소 메타데이터 저장
 */
async function saveStorageMetadata(): Promise<void> {
  try {
    const metadataPath = path.join(STORAGE_DIR, 'metadata.json');
    const metadata = Object.fromEntries(storageMetadata);
    
    fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));
  } catch (error) {
    console.error('메타데이터 저장 Error:', error);
  }
}

/**
 * 데이터 암호화
 */
function encryptData(data: any): Buffer {
  if (!encryptionKey) {
    throw new Error('암호화 키가 초기화되지 않았습니다.');
  }

  try {
    // 데이터를 문자열로 변환
    const dataStr = typeof data === 'object' ? JSON.stringify(data) : String(data);
    
    // IV 생성
    const iv = crypto.randomBytes(ENCRYPTION_CONFIG.ivLength);
    
    // 암호화
    const cipher = crypto.createCipheriv(
      ENCRYPTION_CONFIG.algorithm,
      Buffer.from(encryptionKey, 'hex'),
      iv
    );

    let encrypted = cipher.update(dataStr, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    // 인증 태그 가져오기
    const authTag = (cipher as any).getAuthTag();

    // IV + 암호화된 데이터 + 인증 태그 결합
    return Buffer.concat([
      iv,
      Buffer.from(encrypted, 'hex'),
      authTag
    ]);

  } catch (error) {
    console.error('데이터 암호화 Error:', error);
    throw error;
  }
}

/**
 * 데이터 복호화
 */
function decryptData(encryptedData: Buffer, parseJson = true): any {
  if (!encryptionKey) {
    throw new Error('암호화 키가 초기화되지 않았습니다.');
  }

  try {
    // IV 추출
    const iv = encryptedData.slice(0, ENCRYPTION_CONFIG.ivLength);
    
    // 인증 태그 추출 (마지막 16바이트)
    const authTag = encryptedData.slice(-16);
    
    // 암호화된 데이터 추출
    const encryptedContent = encryptedData.slice(
      ENCRYPTION_CONFIG.ivLength,
      encryptedData.length - 16
    );

    // 복호화
    const decipher = crypto.createDecipheriv(
      ENCRYPTION_CONFIG.algorithm,
      Buffer.from(encryptionKey, 'hex'),
      iv
    );

    (decipher as any).setAuthTag(authTag);

    let decrypted = decipher.update(encryptedContent.toString('hex'), 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    // JSON 파싱
    if (parseJson) {
      try {
        return JSON.parse(decrypted);
      } catch {
        return decrypted; // JSON이 아닌 경우 문자열 그대로 반환
      }
    }

    return decrypted;

  } catch (error) {
    console.error('데이터 복호화 Error:', error);
    throw error;
  }
}

/**
 * 안전한 키 이름 생성
 */
function sanitizeKey(key: string): string {
  return key.replace(/[^a-zA-Z0-9_-]/g, '_');
}

/**
 * 데이터 안전하게 저장
 */
export async function storeSecureData(key: string, data: any): Promise<boolean> {
  if (!key || typeof key !== 'string') {
    throw new Error('유효한 키가 필요합니다.');
  }

  if (!isInitialized) {
    throw new Error('안전한 저장소가 초기화되지 않았습니다.');
  }

  try {
    const safeKey = sanitizeKey(key);
    const filePath = path.join(STORAGE_DIR, `${safeKey}.secure`);

    // 기존 파일 백업
    if (fs.existsSync(filePath)) {
      await createBackup(safeKey);
    }

    // 데이터 암호화 및 저장
    const encryptedData = encryptData(data);
    fs.writeFileSync(filePath, encryptedData);

    // 메타데이터 업데이트
    storageMetadata.set(safeKey, {
      timestamp: Date.now(),
      description: `Secure data for key: ${key}`
    });

    await saveStorageMetadata();

    console.log('데이터 저장 Completed: ${key}');
    return true;

  } catch (error) {
    console.error('데이터 저장 Error (${key}):', error);
    return false;
  }
}

/**
 * 안전하게 저장된 데이터 로드
 */
export async function loadSecureData(key: string, asJson = true): Promise<any> {
  if (!key || typeof key !== 'string') {
    throw new Error('유효한 키가 필요합니다.');
  }

  if (!isInitialized) {
    throw new Error('안전한 저장소가 초기화되지 않았습니다.');
  }

  try {
    const safeKey = sanitizeKey(key);
    const filePath = path.join(STORAGE_DIR, `${safeKey}.secure`);

    if (!fs.existsSync(filePath)) {
      return null;
    }

    // 암호화된 데이터 읽기 및 복호화
    const encryptedData = fs.readFileSync(filePath);
    const decryptedData = decryptData(encryptedData, asJson);

    console.log('데이터 로드 Completed: ${key}');
    return decryptedData;

  } catch (error) {
    console.error('데이터 로드 Error (${key}):', error);
    return null;
  }
}

/**
 * 안전하게 저장된 데이터 삭제
 */
export async function deleteSecureData(key: string): Promise<boolean> {
  if (!key || typeof key !== 'string') {
    throw new Error('유효한 키가 필요합니다.');
  }

  if (!isInitialized) {
    throw new Error('안전한 저장소가 초기화되지 않았습니다.');
  }

  try {
    const safeKey = sanitizeKey(key);
    const filePath = path.join(STORAGE_DIR, `${safeKey}.secure`);

    if (!fs.existsSync(filePath)) {
      return true; // 이미 존재하지 않음
    }

    // 삭제 전 백업
    await createBackup(safeKey);

    // 파일 삭제
    fs.unlinkSync(filePath);

    // 메타데이터에서 제거
    storageMetadata.delete(safeKey);
    await saveStorageMetadata();

    console.log('데이터 삭제 Completed: ${key}');
    return true;

  } catch (error) {
    console.error('데이터 삭제 Error (${key}):', error);
    return false;
  }
}

/**
 * 백업 생성
 */
async function createBackup(safeKey: string): Promise<void> {
  try {
    const sourceFile = path.join(STORAGE_DIR, `${safeKey}.secure`);
    const backupFile = path.join(BACKUP_DIR, `${safeKey}_${Date.now()}.secure.bak`);

    if (fs.existsSync(sourceFile)) {
      fs.copyFileSync(sourceFile, backupFile);
    }
  } catch (error) {
    console.error('백업 생성 Error (${safeKey}):', error);
  }
}

/**
 * 저장된 데이터 키 목록 조회
 */
export async function listSecureDataKeys(): Promise<string[]> {
  if (!isInitialized) {
    return [];
  }

  try {
    if (!fs.existsSync(STORAGE_DIR)) {
      return [];
    }

    const files = fs.readdirSync(STORAGE_DIR);
    return files
      .filter(file => file.endsWith('.secure'))
      .map(file => file.replace('.secure', ''));

  } catch (error) {
    console.error('데이터 키 목록 조회 Error:', error);
    return [];
  }
}

/**
 * 저장소 상태 조회
 */
export async function getStorageStats(): Promise<{
  isInitialized: boolean;
  totalKeys: number;
  storageSize: number;
  backupCount: number;
}> {
  const keys = await listSecureDataKeys();
  let storageSize = 0;
  let backupCount = 0;

  try {
    // 스토리지 크기 계산
    if (fs.existsSync(STORAGE_DIR)) {
      const files = fs.readdirSync(STORAGE_DIR);
      for (const file of files) {
        if (file.endsWith('.secure')) {
          const filePath = path.join(STORAGE_DIR, file);
          const stats = fs.statSync(filePath);
          storageSize += stats.size;
        }
      }
    }

    // 백업 개수 계산
    if (fs.existsSync(BACKUP_DIR)) {
      const backupFiles = fs.readdirSync(BACKUP_DIR);
      backupCount = backupFiles.filter(file => file.endsWith('.bak')).length;
    }
  } catch (error) {
    console.error('저장소 통계 조회 Error:', error);
  }

  return {
    isInitialized,
    totalKeys: keys.length,
    storageSize,
    backupCount
  };
}

/**
 * 저장소 Cleanup (오래된 백업 파일 삭제)
 */
export async function cleanupStorage(maxAge = 30 * 24 * 60 * 60 * 1000): Promise<number> {
  let cleanedCount = 0;

  try {
    if (!fs.existsSync(BACKUP_DIR)) {
      return 0;
    }

    const backupFiles = fs.readdirSync(BACKUP_DIR);
    const now = Date.now();

    for (const file of backupFiles) {
      if (file.endsWith('.bak')) {
        const filePath = path.join(BACKUP_DIR, file);
        const stats = fs.statSync(filePath);

        if (now - stats.mtime.getTime() > maxAge) {
          fs.unlinkSync(filePath);
          cleanedCount++;
        }
      }
    }

    console.log('저장소 Cleanup Completed: ${cleanedCount}개 파일 삭제');
  } catch (error) {
    console.error('저장소 Cleanup Error:', error);
  }

  return cleanedCount;
}

// 앱 종료 시 Cleanup
app.on('before-quit', async () => {
  try {
    await cleanupStorage();
  } catch (error) {
    console.error('종료 시 저장소 Cleanup Error:', error);
  }
});
