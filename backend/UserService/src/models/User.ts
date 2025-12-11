import mongoose, { Document, Schema } from 'mongoose';

export type Roles = 'Admin' | 'Éditeur' | 'Rédacteur' | 'Lecteur';

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  role: Roles;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema: Schema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: { type: String, required: true },
    role: {
      type: String,
      enum: ['Admin', 'Éditeur', 'Rédacteur', 'Lecteur'],
      default: 'Lecteur',
    },
  },
  { timestamps: true }
);

export default mongoose.model<IUser>('User', UserSchema);
