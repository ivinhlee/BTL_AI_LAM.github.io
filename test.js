import fs from 'fs';
const data = JSON.parse(fs.readFileSync('./data_snippet.json', 'utf8'));
console.log(data.data[1].category);
