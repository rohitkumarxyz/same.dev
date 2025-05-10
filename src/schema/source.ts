import { Schema, model } from 'mongoose';

const FileNodeSchema = new Schema({
  name: { type: String, required: true },
  projectName: { type: String },
  type: { type: String, enum: ['file', 'folder'], required: true },
  content: { type: String },
  isBinary: { type: Boolean },
  children: []
}, { _id: false });

FileNodeSchema.add({
  children: [FileNodeSchema]
});

const FileTreeSchema = new Schema({
  projectName: { type: String, required: true },
  files: [FileNodeSchema]
});

export const SourceCode = model('projects', FileTreeSchema);