const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const mongoose = require('mongoose');
const User = require('../models/User');
const Student = require('../models/Student');
const Teacher = require('../models/Teacher');
const { getMongoUri } = require('../utils/mongoUri');

function toPlainObject(value) {
  return value?.toObject ? value.toObject() : value;
}

async function migrateProfilesSplit() {
  await mongoose.connect(getMongoUri());

  try {
    const users = await User.find().lean();
    const summary = {
      scanned: users.length,
      studentProfilesUpserted: 0,
      teacherProfilesUpserted: 0,
      userProfilesStripped: 0,
    };

    for (const user of users) {
      const baseUpdate = {
        $unset: {
          fullName: 1,
          phone: 1,
          department: 1,
          academicYear: 1,
        },
      };

      if (user.role === 'student') {
        await Student.updateOne(
          { _id: user._id },
          {
            $set: {
              _id: user._id,
              studentId: user.userId || user._id,
              fullName: user.fullName || user.userId || user._id,
              phone: user.phone,
              department: user.department,
              academicYear: user.academicYear,
            },
          },
          { upsert: true }
        );

        summary.studentProfilesUpserted += 1;
      }

      if (user.role === 'teacher') {
        await Teacher.updateOne(
          { _id: user._id },
          {
            $set: {
              _id: user._id,
              teacherId: user.userId || user._id,
              fullName: user.fullName || user.userId || user._id,
              department: user.department,
              phone: user.phone,
            },
          },
          { upsert: true }
        );

        summary.teacherProfilesUpserted += 1;
      }

      await User.collection.updateOne({ _id: user._id }, baseUpdate);
      summary.userProfilesStripped += 1;
    }

    console.log('[migrateProfilesSplit] completed', summary);
  } finally {
    await mongoose.disconnect();
  }
}

migrateProfilesSplit().catch((error) => {
  console.error('[migrateProfilesSplit] failed', error);
  process.exit(1);
});