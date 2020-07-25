import knex from './db';
import * as hexoid from 'hexoid';
import * as express from 'express';
import { Storage } from '@google-cloud/storage';


const GS_UPLOADS_BUCKET = process.env.GS_UPLOADS_BUCKET || '';
const GOOGLE_CLOUD_PORJECT_ID = process.env.GOOGLE_CLOUD_PORJECT_ID || '';

const randomFileName = (hexoid as any as (x: number) => () => string)(25);

const uploadEndpoint = function (
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
): void {
  const storage = new Storage({
    projectId: GOOGLE_CLOUD_PORJECT_ID
  });

  const bucket = storage.bucket(GS_UPLOADS_BUCKET);
  const blob = bucket.file(`${randomFileName()}`);
  
  const stream = blob.createWriteStream({
		resumable: true,
		predefinedAcl: 'publicRead',
	});

	stream.on('error', err => {
		next(err);
	});

	stream.on('finish', async () => {
    const record = await knex('uploads')
    .insert({
      userId: req.user!.userId,
      name,
      path: blob.name,
    });
    res.status(200).json(record);
	});

	stream.end(req.file.buffer);
};

const downloadEndpoint = async function (req: express.Request, res: express.Response): Promise<void> {
  const file = await knex('uploads')
    .select('*')
    .where('id', req.params.id)
    .first();

  if (!file) {
    res.status(404).json({error: 'Not found'});
    return;
  }

  if (`${file.userId}` !== `${req.user!.userId}`) {
    res.status(403).json({error: 'Not authorized'});
    return;
  }

  throw new Error();

  res.download(file.path, file.name);
};

export default { uploadEndpoint, downloadEndpoint };