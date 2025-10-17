const fs = require('fs');
const path = require('path');

const targetPath = path.join(__dirname, 'src/environments/environment.ts');

const envConfigFile = `
export const environment = {
  production: '${process.env.PRODUCTION || ''}',
  apiUrl: '${process.env.API_URL || ''}',
};
`;

fs.mkdirSync(path.dirname(targetPath), { recursive: true });
fs.writeFileSync(targetPath, envConfigFile);