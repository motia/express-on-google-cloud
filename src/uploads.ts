import {IncomingForm} from 'formidable';
import * as path from 'path';
import knex from './db';
import * as hexoid from 'hexoid';
import * as express from 'express';


const randomFileName = (hexoid as any as (x: number) => () => string)(25);

const uploadEndpoint = function (
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) {
    const form = new IncomingForm();

    form.on('fileBegin', function(name, file){
      // skip upload files other then `file`
      if (name === 'file') {
        file.path = path.join(
          __dirname,
          '..',
          'uploads',
          randomFileName()
        );
      }
    });

    form.parse(req, async (err, fields, files) => {
      if (err) {
        next(err);
        return;
      }

      if (!files.file) {
        return res.status(400).json({ errors: {file: 'Missing file'} });
      }
      if (!files.file.path) {
        return next(new Error('Logic Error: file path is not set'));
      }

      let name: string;
      if (files.file.name.length > 255) {
        const ext = path.extname(files.file.name);
        name = files.file.name.substr(
          0,
          files.file.name.length - ext.length - 1
        ) + '.' + ext;
      } else {
        name = files.file.name;
      }

      const record = await knex('uploads')
        .insert({
          userId: req.user!.userId,
          name,
          path: files.file.path,
        });
      res.status(200).json(record);
    });
};

const downloadEndpoint = async function (req: express.Request, res: express.Response) {
  const file = await knex('uploads')
    .select('*')
    .where('id', req.params.id)
    .first();

  if (!file) {
    res.status(404);
    return;
  }

  if (`${file.userId}` !== `${req.user!.userId}`) {
    res.status(403);
    return;
  }

  res.download(file.path, file.name);
};

export default { uploadEndpoint, downloadEndpoint };