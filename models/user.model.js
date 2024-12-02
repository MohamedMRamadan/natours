import { Schema, model } from 'mongoose';
import bcrypt from 'bcryptjs';
import validator from 'validator';
import crypto from 'crypto';

const userSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, 'A user must have a name'],
    },
    email: {
      type: String,
      required: [true, 'A user must have an email'],
      unique: true,
      lowercase: true,
      validate: [validator.isEmail, 'Please provide a valid email'],
    },
    photo: {
      type: String,
      default: 'default.jpg',
    },
    password: {
      type: String,
      required: [true, 'A user must have a password'],
      minlength: [8, 'password should be at least 8 characters'],
      select: false,
    },
    passwordConfirm: {
      type: String,
      required: [true, 'Please confirm your password'],
      // This only works on save with CREATE and SAVE methods
      validate: {
        validator: function (value) {
          return value === this.password;
        },
        message: 'Passwords are not the same',
      },
    },
    gender: {
      type: String,
      enum: ['male', 'female'],
    },
    passwordUpdatedAt: Date,
    role: {
      type: String,
      enum: ['user', 'guide', 'lead-guide', 'admin'],
      default: 'user',
    },
    passwordResetToken: String,
    passwordResetExpires: Date,
    isActive: {
      type: Boolean,
      default: true,
      select: false,
    },
  },
  { timestamps: true },
);
// userSchema.path('password').select(false);

userSchema.pre(/^find/, function (next) {
  this.find({ isActive: { $ne: false } });
  next();
});

// in case we use create or save
userSchema.pre('save', async function (next) {
  // Only RUN this function if password was modified
  if (!this.isModified('password')) return next();
  // hashing password
  this.password = await bcrypt.hash(this.password, 12);
  // Delete password confirm
  this.passwordConfirm = undefined;
  next();
});
userSchema.pre('save', function (next) {
  if (!this.isModified('password') || this.isNew) return next();

  this.passwordUpdatedAt = Date.now() - 1000;
  // this 1s because sometimes the time it takes to set or update the passwordUpdateAt into database happens  after the JWT created, so the protected middleware(protect) will ignore any token was built before updating password
  next();
});

// Instance method
// as it gonna be available in all User documents
userSchema.methods.correctPassword = async function (
  candidatePassword,
  userPassword,
) {
  return await bcrypt.compare(candidatePassword, userPassword);
};
userSchema.methods.isPasswordUpdatedAfter = function (JWTTimestamp) {
  // as the time in passwordUpdatedAt in millisecond and JWTTimestamp in seconds
  if (this.passwordUpdatedAt) {
    const updatedTimespatmp = parseInt(
      this.passwordUpdatedAt.getTime() / 1000,
      10,
    );
    return updatedTimespatmp > JWTTimestamp;
  }
  return false;
};
userSchema.methods.createPasswordResetToken = function () {
  // create Token
  const resetToken = crypto.randomBytes(32).toString('hex');

  // saving the hashed token into database
  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;

  return resetToken;
};
const User = model('User', userSchema);

export default User;
