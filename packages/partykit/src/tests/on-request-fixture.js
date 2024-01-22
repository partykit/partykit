export default {
  async onRequest(req, _room) {
    return new Response(`pong: ${req.url}`);
  }
};
