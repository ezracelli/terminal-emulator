const Container = require('./Container');
const express = require('express');
const path = require('path');

const { Builder, Nuxt } = require('nuxt');

// eslint-disable-next-line no-undef
const containers = new Map();

const app = express();
app.use(require('cors')());

require('express-ws')(app);

function send (ws, { id }, data) {
  ws.send(JSON.stringify({
    id,
    data: data.toString('utf8', 8),
  }));
}

app.ws('/', async (ws) => {
  console.log('creating', ws.id);

  const container = await new Container(ws.id);
  container.wd = '/';
  containers.set(ws.id, container);

  ws.on('message', async command => {
    console.log('executing', command, 'on', ws.id);

    if (!containers.has(ws.id)) return;
    const container = await containers.get(ws.id);

    // matches "cd xx"
    const cds = command.match(/\bcd\b\s+[^\s]+/g);
    if (cds) {
      container.wd = path.join(container.wd, ...cds.map(dir => dir.replace('cd ', '')));
    }

    // matches "cd xx( && )?"
    command = command.replace(/\bcd\b\s+[^\s]+(\s+&&\s+)?/g, '');
    if (!command.trim()) return;

    const exec = await container.exec.create({
      AttachStderr: true,
      AttachStdout: true,
      // eslint-disable-next-line array-element-newline, array-bracket-newline
      Cmd: [ '/bin/sh', '-c', `cd ${container.wd} && ${command}` ],
    });

    const stream = await exec.start({ Detach: false });

    stream.on('data', data => send(ws, exec, data));
    stream.on('error', error => send(ws, exec, error));
  });

  ws.on('close', async () => {
    console.log('releasing', ws.id);
    if (!containers.has(ws.id)) return;

    const container = await containers.get(ws.id);
    await container.kill();
  });
});

// Use Nuxt.js for remaining routes

const config = require('../nuxt.config.js');
config.dev = process.env.NODE_ENV !== 'production';

const nuxt = new Nuxt(config);
app.get('*', nuxt.render);

if (config.dev) new Builder(nuxt).build();

app.listen(3000, (err) => {
  if (err) throw err;

  console.log('listening on http://127.0.0.1:3000');
});
