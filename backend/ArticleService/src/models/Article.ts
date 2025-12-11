import mongoose, { Document, Schema } from 'mongoose';

export interface IArticle extends Document {
  title: string;
  content: string;
  image?: string;
  tags: string[];
  author: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const ArticleSchema = new Schema<IArticle>(
  {
    title: { type: String, required: true, index: true },
    content: { type: String, required: true },
    image: { type: String },
    tags: { type: [String], default: [], index: true },
    author: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
  },
  { timestamps: true }
);

// Full-text index for search across title and content
ArticleSchema.index({ title: 'text', content: 'text' });

export default mongoose.model<IArticle>('Article', ArticleSchema);
