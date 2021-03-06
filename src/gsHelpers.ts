import { Storage, Bucket } from '@google-cloud/storage';
import Completer from 'promise-completer';
import * as hexoid from 'hexoid';

export const randomFileName = (hexoid as any as (x: number) => () => string)(36);

export const downloadFileFromGs = async (bucketCode: string, name: string): Promise<Buffer> => {
  const bucket = getGSBucket(bucketCode);
  const res = await bucket.file(name).download();
  return res[0];
};

export const uploadFileToGS = function(bucketCode: string, fileName: string, buffer: Buffer): Promise<void> {
    const completer = new Completer<void>();
    const blob = getGSBucket(bucketCode).file(fileName);
  
    const stream = blob.createWriteStream({
          resumable: true,
          predefinedAcl: 'publicRead',
    });
    
    let uploadError: Error | null = null;
  
      stream.on('error', err => {
      uploadError = err;
      completer.reject(err);
    });
    
    stream.on('finish', () => {
      if (uploadError) {
        return;
      }
      completer.resolve();
    });
  
    stream.end(buffer);
  
    return completer.promise;
};

export const getBucketName = function (bucketCode: string): string {
  const bucketName = process.env[`GS_${bucketCode.toUpperCase()}_BUCKET`] || '';
  if (!bucketName) {
    throw new Error(`Bucket with code ${bucketCode} is not configured`);
  }
  return bucketName;
};


let _storage: Storage | null = null;
const _buckets : {[name: string]: Bucket} = {};
const getGSBucket = function(bucketCode: string): Bucket {
  if (_buckets[bucketCode]) {
    return _buckets[bucketCode];
  }

  if (!_storage) {
    _storage = new Storage({
      projectId: process.env.PROJECT_ID || '',
    });
  }
  
  return _buckets[bucketCode] = _storage.bucket(getBucketName(bucketCode));
};

