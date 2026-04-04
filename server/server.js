const app = require('./src/app');
const config = require('./src/config/env');

const PORT = config.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Environment: ${config.NODE_ENV}`);
});
