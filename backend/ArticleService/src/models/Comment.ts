import mongoose, { Schema, Document } from 'mongoose';

export interface IComment extends Document {
  content: string;
  article: mongoose.Types.ObjectId;
  author: mongoose.Types.ObjectId;
  authorName?: string;
  parentComment?: mongoose.Types.ObjectId; // For nested replies
  createdAt: Date;
  updatedAt: Date;
}

const CommentSchema = new Schema<IComment>(
  {
    content: { type: String, required: true },
    article: { type: Schema.Types.ObjectId, ref: 'Article', required: true, index: true },
    author: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    authorName: { type: String }, // Store name directly
    parentComment: { type: Schema.Types.ObjectId, ref: 'Comment', default: null, index: true },
  },
  { timestamps: true }
);

// Virtual for replies (if we want to populate them)
CommentSchema.virtual('replies', {
  ref: 'Comment',
  localField: '_id',
  foreignField: 'parentComment',
});

// Ensure virtuals are included in JSON
CommentSchema.set('toObject', { virtuals: true });
CommentSchema.set('toJSON', { virtuals: true });

export default mongoose.model<IComment>('Comment', CommentSchema);
