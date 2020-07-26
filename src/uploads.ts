import knex from './db';
import * as hexoid from 'hexoid';
import * as express from 'express';
import { Storage, Bucket } from '@google-cloud/storage';

const randomFileName = (hexoid as any as (x: number) => () => string)(25);


let _bucket: Bucket | null = null;
const getUploadsBucket = function() {
  if (_bucket) {
    return _bucket;
  }
  const googleCreds = (process.env.IS_LOCAL || '') ? require('../google.json')  : undefined;
  const storage = new Storage({
    projectId: process.env.GOOGLE_CLOUD_PROJECT_ID || '',
    credentials: googleCreds
  });

  _bucket = storage.bucket(process.env.GS_UPLOADS_BUCKET || '');
  return _bucket;
};

const uploadEndpoint = function (
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
): void {
  const bucket = getUploadsBucket();
  const blob = bucket.file(`${randomFileName()}`);
  

  let uploadError: Error;

  const stream = blob.createWriteStream({
		resumable: true,
		predefinedAcl: 'publicRead',
	});

	stream.on('error', err => {
    uploadError = err;
    next(err);
  });
  
  stream.on('finish', () => {
    if (uploadError) {
      return;
    }

    const record = {
      userId: req.user!.userId,
      name: req.file.originalname,
      path: blob.name,
    };
    knex('uploads')
      .insert(record).then(id => {
        res.status(200).json({
          id,
          userId: req.user!.userId,
          name: req.file.originalname,
        });
      }).catch(next);
  });

	stream.end(req.file.buffer);
};

const downloadEndpoint = async function (req: express.Request, res: express.Response): Promise<void> {
  const file = await knex('uploads')
    .select('*')
    .where('id', req.params.identifier)
    .first();

  if (!file) {
    res.status(404).json({error: 'Not found'});
    return;
  }

  if (`${file.userId}` !== `${req.user!.userId}`) {
    res.status(403).json({error: 'Not authorized'});
    return;
  }

  const bucket = getUploadsBucket();
  const [buffer] = await bucket.file(file.path).download();

  res.status(200);
  res.header('content-type', 'application/octet-stream');
  res.header('content-disposition', `inline; filename="${file.name}"`);

  res.end(buffer);
};

export default { uploadEndpoint, downloadEndpoint };