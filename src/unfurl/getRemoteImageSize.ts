import * as https from 'https';
import { imageSize } from 'image-size';


const handleChunks = function (src, chunks, {resolve, reject}) {
  const buffer = Buffer.concat(chunks);
  try {
    const size = imageSize(buffer)
    resolve(size)
  } catch (e) {
    reject(e)
  }
}

type ImageSize = { width: number, height: number }

export default function (src: string, MAX_SIZE: number): Promise<ImageSize> {
  let resolve: (x: ImageSize) => void;
  let reject: (x: ImageSize | Error) => void;

  const promise = new Promise<ImageSize>((res, rej) => {
    resolve = res;
    reject = rej;
  });

  const req = https.get(src, (response) => {
    let chunksTotalSize = 0;
    const chunks: Uint8Array[][] = [];
    response.on('data', (chunk: Uint8Array[]) => {
      chunks.push(chunk);
      chunksTotalSize += chunk.length;
      if (MAX_SIZE !== -1 && chunksTotalSize > MAX_SIZE) {
        req.destroy();
      }
    }).on('abort', function() {
      handleChunks(src, chunks, {resolve, reject})
    }).on('end', function() {
      if (req.aborted) {
        return;
      }
      handleChunks(src, chunks, {resolve, reject})
    }).on('error', function (e) {
      reject(e);
    });
  });

  return promise;
}
