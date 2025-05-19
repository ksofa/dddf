const YAML = require('yamljs');
const path = require('path');

// Загружаем YAML файл
const swaggerSpec = YAML.load(path.join(__dirname, '../openapi.yaml'));

module.exports = swaggerSpec; 