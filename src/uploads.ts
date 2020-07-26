import * as express from 'express';
import { uploadFileToGS, randomFileName, downloadFileFromGs } from './gsHelpers';
import { findUploadRecord, createUploadRecord } from './db';


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
  
  const username = req.user!.username;

  try {
    const doc = await createUploadRecord(username, {
      name: req.file.originalname || randomFileName(),
      path: fileName,
    });

    res.status(200)
      .json(doc);
  } catch (e) {
    next(e);
  }
};

const downloadEndpoint = async function (req: express.Request, res: express.Response,
  next: express.NextFunction): Promise<void> {
  const identifier = req.params.identifier;
  const username = req.user!.username;

  const file = await findUploadRecord({username, identifier});
  if (!file) {
    res.status(404)
      .json({erorr: 'File not found'});
  }
  if (!file) {
    res.status(404).json({error: 'Not found'});
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


export default { uploadEndpoint, downloadEndpoint };