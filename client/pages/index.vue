<template>
  <div id="page-index">
    <div>
      <pre
        v-for="(message, key) in messages"
        :key="key"
      >{{ message }}</pre>
    </div>

    <input
      v-if="ws"
      v-model="command"
      type="text"
      @keyup.enter="exec"
    >

    <button
      :disabled="releasing || !ws"
      type="button"
      @click="() => ws.close()"
    >
      {{ ws ? 'Release' : 'Released' }}
    </button>
  </div>
</template>

<script>
export default {
  data () {
    return {
      command: '',
      releasing: false,
      messages: {},
      ws: null,
    };
  },
  mounted () {
    if (!('WebSocket' in window)) return;

    const ws = new WebSocket(window.location.origin.replace(/https?/, 'ws'));
    window.ws = ws;

    ws.onmessage = ({ data: message }) => {
      const { id, data } = JSON.parse(message);
      console.log(id, data);
      this.$set(this.messages, id, `${this.messages[id] || ''}${data}`);
    };
    ws.onclose = () => this.ws = null;

    this.ws = ws;
  },
  beforeDestroy () {
    this.ws && 'close' in this.ws && this.ws.close();
  },
  methods: {
    exec () {
      this.ws && 'send' in this.ws && this.ws.send(this.command);
      this.command = '';
    },
  },
};
</script>

<style lang="scss" scoped>
code {
  display: block;
}
</style>
