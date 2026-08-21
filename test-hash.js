const bcrypt = require('bcryptjs');

const password = 'oladeji';
const hash = '$2a$10$2kqaZFJTCFaUwKKVvPzJFuqOYJQFxXyPn1lEJXmLVHRTf3EqKaSHa';

bcrypt.compare(password, hash).then(match => {
  console.log('Hash matches "oladeji":', match);
  if (!match) {
    console.log('Generating correct hash for "oladeji"...');
    return bcrypt.hash(password, 10);
  }
}).then(newHash => {
  if (newHash) console.log('New hash:', newHash);
});
