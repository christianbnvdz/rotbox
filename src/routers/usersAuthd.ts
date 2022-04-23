import express from 'express';
import passport from 'passport';
import multer from 'multer';
import { promises as fs } from 'fs';

import User from '../models/user';
import File from '../models/file';

const hostURL = process.env.HOST_URL!;
const router = express.Router();
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, process.env.FILE_STORAGE_DIR!);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
    cb(null, `${file.fieldname}-${uniqueSuffix}`);
  },
});
const upload = multer({ storage });

router.use(passport.authenticate('jwt', { session: false }));

router.route('/:userid')
  // ensure that the user is accessing their own user resource
  .all((req, res, next): void => {
    // The user object will for sure exist. _id is always added to user
    // object by mongo
    if ((req.user! as any)._id.toString() !== req.params.userid) {
      res.status(403).json({ msg: 'unauthorized' });
    } else {
      next();
    }
  })
  .get((req, res): void => {
    const editProfile = {
      href: `${hostURL}/${(req.user! as any)._id.toString()}`,
      method: 'POST',
      value: [{ name: 'username' }],
    };
    res.json({ username: (req.user! as any).username, editProfile });
  })
  .post(async (req, res): Promise<void> => {
    const user = req.user! as any;
    await User.updateOne({ _id: user._id }, { username: req.body.username });
    res.json({ msg: 'username succesfully changed' });
  })
  .all((req, res): void => {
    res.status(405).json({ msg: 'invalid method' });
  });

router.route('/:userid/files')
  .all((req, res, next): void => {
    if ((req.user! as any)._id.toString() !== req.params.userid) {
      res.status(403).json({ msg: 'unauthorized' });
    } else {
      next();
    }
  })
  .get(async (req, res): Promise<void> => {
    const files = await File.find({ ownerId: (req.user! as any)._id });
    const filesJSON = files.map((file) => ({
      ...(file._doc),
      deleteFile: {
        href: `${hostURL}/${(req.user! as any)._id.toString()}/files/${(file as any)._id}`,
        method: 'DELETE',
      },
    }));
    res.json({ files: filesJSON });
  })
  .post(async (req, res): Promise<void> => {
    await upload.single('content')(req, res, async (): Promise<void> => {
      let content = '';
      if (req.body.isFile === 'true') {
        content = (req.file! as any).filename;
      } else {
        content = req.body.content;
      }
      const file = new File({
        ownerId: (req.user! as any)._id,
        name: req.body.name,
        isFile: (req.body.isFile === 'true'),
        content,
      });
      const storedFile = await file.save();
      res.status(201).json({
        getFile: {
          href: `${hostURL}/${(req.user! as any)._id.toString()}/files/${(storedFile! as any)._id}`,
          method: 'GET',
        },
        deleteFile: {
          href: `${hostURL}/${(req.user! as any)._id.toString()}/files/${(storedFile! as any)._id}`,
          method: 'DELETE',
        },
      });
    });
  })
  .all((req, res): void => {
    res.status(405).json({ msg: 'invalid method' });
  });

router.route('/:userid/files/:fileid')
  .all((req, res, next): void => {
    if ((req.user! as any)._id.toString() !== req.params.userid) {
      res.status(403).json({ msg: 'unauthorized' });
    } else {
      next();
    }
  })
  .get(async (req, res): Promise<void> => {
    const file = await File.findOne({ _id: req.params.fileid });
    if (file!.isFile) {
      res.attachment(`${process.cwd()}/files/${file.content}`);
      res.sendFile(`${process.cwd()}/files/${file.content}`);
    } else {
      res.json({ name: file.name, content: file.content });
    }
  })
  .delete(async (req, res): Promise<void> => {
    const file = await File.findOneAndDelete({ _id: req.params.fileid });
    if (file!.isFile) {
      (fs as any).rm(`${process.cwd()}/files/${file!.content}`);
    }
    res.json({ msg: 'successfully deleted the file' });
  })
  .all((req, res): void => {
    res.status(405).json({ msg: 'invalid method' });
  });

export default router;
