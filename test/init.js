require("babel-register")({
  sourceMaps: true
});

const logFactory = require('../src/log-factory');
logFactory.init(process.env.LOG_LEVEL || 'info');

global.testLogger = logFactory.getLogger('TEST');

global.logSpy = (s) => {
  for(var i = 0; i < s.callCount; i++){
    global.testLogger.info('call: ', i, ': ', s.getCall(i).args);
  }
}