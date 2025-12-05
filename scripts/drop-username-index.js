const mongoose = require('mongoose');

async function main() {
  const uri = process.env.MONGODB_URI || process.argv[2];
  if (!uri) {
    console.error('Provide MONGODB_URI env var or pass as first arg:');
    console.error('  node scripts/drop-username-index.js "<mongodb-uri>"');
    process.exit(1);
  }

  try {
    console.log('Connecting to', uri.replace(/(:).*(@)/, ':****$2'));
    await mongoose.connect(uri, { bufferCommands: false });
    const coll = mongoose.connection.db.collection('users');

    console.log('\nIndexes before:');
    console.log(await coll.indexes());

    const idxName = 'username_1';
    const indexes = await coll.indexes();
    if (indexes.some((i) => i.name === idxName)) {
      console.log('\nDropping index:', idxName);
      await coll.dropIndex(idxName);
      console.log('Dropped index', idxName);
    } else {
      console.log('\nIndex', idxName, 'not found — nothing to do');
    }

    console.log('\nIndexes after:');
    console.log(await coll.indexes());

    await mongoose.disconnect();
    console.log('\nDone.');
    process.exit(0);
  } catch (err) {
    console.error('Error:', err && err.message ? err.message : err);
    try { await mongoose.disconnect(); } catch (e) {}
    process.exit(1);
  }
}

main();
