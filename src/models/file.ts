import { Schema, model } from 'mongoose';

const fileSchema = new Schema({
  ownerId: Schema.Types.ObjectId,
  name: String,
  isFile: Boolean,
  content: String
});

const File = model('File', fileSchema);

export default File;
