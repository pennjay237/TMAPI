const bcrypt = require('bcryptjs');
const saltRounds = Number(process.env.BCRYPT_SALT_ROUNDS || 10);

async function hashPassword(plain) {
  const salt = await bcrypt.genSalt(saltRounds);
  return bcrypt.hash(plain, salt);
}

async function comparePassword(plain, hash) {
  return bcrypt.compare(plain, hash);
}

module.exports = { hashPassword, comparePassword };
