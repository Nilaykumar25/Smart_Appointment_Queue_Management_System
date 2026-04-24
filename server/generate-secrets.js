const crypto = require('crypto');

console.log('🔐 Production Secrets for Railway Deployment');
console.log('='.repeat(50));
console.log();

console.log('JWT_SECRET=');
console.log(crypto.randomBytes(64).toString('hex'));
console.log();

console.log('REFRESH_TOKEN_SECRET=');
console.log(crypto.randomBytes(64).toString('hex'));
console.log();

console.log('ENCRYPTION_KEY=');
console.log(crypto.randomBytes(32).toString('hex'));
console.log();

console.log('⚠️  IMPORTANT: Use these secrets in Railway, not in your local .env file!');
console.log('⚠️  Keep these secrets secure and never commit them to git!');