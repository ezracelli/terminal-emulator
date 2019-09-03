const { Docker } = require('node-docker-api');

const docker = new Docker({ socketPath: '/var/run/docker.sock' });

module.exports = function Container (name) {
  return docker.container
    .create({
      Image: 'alpine',
      // eslint-disable-next-line array-element-newline, array-bracket-newline
      Cmd: [ '/bin/sh', '-c', 'watch ps aux' ],
      name,
    })
    .then(container => container.start());
};
