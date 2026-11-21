// omni-agent-bus-autonomy.js
// Starts OmniAgentBus autonomy ticker (system:autonomy:tick every 60 s)

const { omniBus } = require('./omni-agent-bus');
omniBus.startAutonomy();
console.debug('[OmniAgentBus Autonomy] started with default 60 s interval');
// Keep the process alive so the ticker continues running
process.stdin.resume();
