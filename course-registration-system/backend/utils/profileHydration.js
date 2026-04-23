const User = require('../models/User');

function toPlainObject(value) {
  if (!value) {
    return null;
  }

  return value.toObject ? value.toObject() : value;
}

function mergeProfileWithAccount(profile, account) {
  const profileObject = toPlainObject(profile) || {};
  const accountObject = toPlainObject(account) || {};

  return {
    ...accountObject,
    ...profileObject,
    _id: profileObject._id ?? accountObject._id,
    userId: profileObject.userId ?? accountObject.userId ?? profileObject._id ?? accountObject._id,
    email: accountObject.email ?? profileObject.email,
    role: accountObject.role ?? profileObject.role,
    isActive: accountObject.isActive ?? profileObject.isActive,
  };
}

async function hydrateProfilesWithAccounts(profiles, accountRole) {
  const profileList = (profiles || []).map(toPlainObject).filter(Boolean);

  if (profileList.length === 0) {
    return [];
  }

  const ids = profileList.map((profile) => profile._id).filter(Boolean);
  const accounts = await User.find({ _id: { $in: ids }, ...(accountRole ? { role: accountRole } : {}) }).select('-password');
  const accountMap = new Map(accounts.map((account) => [account._id, account]));

  return profileList.map((profile) => mergeProfileWithAccount(profile, accountMap.get(profile._id)));
}

async function hydrateProfileWithAccount(profile, accountRole) {
  const profileObject = toPlainObject(profile);
  if (!profileObject?._id) {
    return null;
  }

  const account = await User.findOne({ _id: profileObject._id, ...(accountRole ? { role: accountRole } : {}) }).select('-password');
  return mergeProfileWithAccount(profileObject, account);
}

module.exports = {
  hydrateProfilesWithAccounts,
  hydrateProfileWithAccount,
  mergeProfileWithAccount,
};