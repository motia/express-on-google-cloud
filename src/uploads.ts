import knex from './db';
import * as express from 'express';
import { uploadFileToGS, randomFileName, downloadFileFromGs } from './gsHelpers';


const uploadEndpoint = async function (
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
): Promise<void> {
  const buffer = req.file.buffer;
  const fileName = `${randomFileName()}`;

  try {
    await uploadFileToGS('uploads', fileName, buffer);
  } catch (e) {
    next(e);
  }
  
  const record = {
    userId: req.user!.userId,
    name: req.file.originalname,
    path: fileName,
  };

  try {
    const [id] = await knex('uploads')
      .insert(record);
    res.status(200).json({
      id,
      userId: req.user!.userId,
      name: req.file.originalname,
    });
  } catch (e) {
    next(e);
  }
};

const downloadEndpoint = async function (req: express.Request, res: express.Response, next): Promise<void> {
  const file = await knex<UploadRecord>('uploads')
    .select('*')
    .where('id', req.params.identifier)
    .first()
    .catch((e) => { next(e); });

  if (!file) {
    res.status(404).json({error: 'Not found'});
    return;
  }

  if (`${file.userId}` !== `${req.user!.userId}`) {
    res.status(403).json({error: 'Not authorized'});
    return;
  }

  const buffer = await downloadFileFromGs('uploads', file.path)
    .catch(e => {next(e);});
  if (!buffer || buffer.length) {
    res.status(404).json({error: 'File is empty'});
    return;
  }

  res.status(200);
  res.header('content-type', 'application/octet-stream');
  res.header('content-disposition', `inline; filename="${file.name}"`);
  res.end(buffer);
};

interface UploadRecord {id: string, userId: string, path: string, name: string}

export default { uploadEndpoint, downloadEndpoint };