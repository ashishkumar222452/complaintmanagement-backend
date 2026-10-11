const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const getFilePath = (collection) => path.join(dataDir, `${collection}.json`);

const readCollection = (collection) => {
  const file = getFilePath(collection);
  if (!fs.existsSync(file)) {
    fs.writeFileSync(file, '[]', 'utf8');
    return [];
  }
  try {
    const content = fs.readFileSync(file, 'utf8');
    return JSON.parse(content || '[]');
  } catch (err) {
    return [];
  }
};

const writeCollection = (collection, data) => {
  const file = getFilePath(collection);
  fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf8');
};

const isMongooseConnected = () => {
  return mongoose.connection && mongoose.connection.readyState === 1;
};

module.exports = {
  isMongooseConnected,
  readCollection,
  writeCollection
};
