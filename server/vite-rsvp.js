import { createRsvpHandler } from './rsvp-api.js';

export default function rsvpPlugin(config) {
  return {
    name: 'wedding-rsvp',
    configureServer(server) {
      server.middlewares.use(createRsvpHandler(config));
    },
    configurePreviewServer(server) {
      server.middlewares.use(createRsvpHandler(config));
    },
  };
}
