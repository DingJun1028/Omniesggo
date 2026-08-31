module.exports = {
  apps: [{
    name: 'oa-swarm',
    script: 'dist/index.js',
    cwd: '/var/www/esggo/apps/oa-swarm',
    env: {
      PORT: 8800,
      OLLAMA_BASE: 'http://127.0.0.1:11434',
      OLLAMA_MODEL: 'qwen2.5:3b',
    },
  }],
};
