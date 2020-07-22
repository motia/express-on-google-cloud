const formidable = require('formidable');
const path = require('path');
const knex = require('./db');

const uploadEndpoint = function (req, res, next) {
    const form = formidable();

    form.on('fileBegin', function(name, file){
        // skip upload files other then `file`
        if (name === 'file') {
          file.path = `${os.tmpdir()}${path.sep}${randomFileName()}`;
        }
    })

    form.parse(req, async (err, fields, files) => {
      if (err) {
        next(err);
        return;
      }

      if (!files.file) {
        return res.status(400).json({ errors: {file: 'Missing file'} })
      }
      if (!files.file.path) {
        return next(new Error('Logic Error: file path is not set'));
      }

      let name;
      if (files.file.name > 255) {
        const ext = path.extname(files.file)
        name = files.file.name.substr(
          0,
          files.file.length - ext.length - 1
        ) + '.' + ext;
      } else {
        name = files.file.name;
      }

      const record = await knex('uploads')
        .insert({
          userId: req.user.id,
          name,
          path: file.path,
        })
      res.status(200).json(record);
    });
}

const downloadEndpoint = async function (req, res) {
  const file = await knex('uploads')
    .select('*')
    .where('id', req.params.id)
    .first();

  if (!file) {
    res.status(404);
    return;
  }

  if (`${file.userId}` !== `${req.user.id}`) {
    res.status(403);
    return;
  }

  res.donwload(file.path, file.name);
};

module.exports = { uploadEndpoint, downloadEndpoint };