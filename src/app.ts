import { ApolloServerPlugin } from "apollo-server-plugin-base";
import express from "express";
import path from "path";
import WebSocket from "ws";
import debug from "debug";

const debugPlugin = debug("cloudchamber:plugin");
const debugServer = debug("cloudchamber:server");
const debugError = debug("cloudchamber:error");

interface SendDataOptions {
  label: string;
  sessionId: string;
  data: any;
}

/**
 * Start the cloudchamber server
 *
 * @param port
 */
function startServer(port = 8090) {
  const app = express();

  app.use("/", express.static(path.join(__dirname, "public")));

  const server = app.listen(port, () => {
    debugServer(`Cloudchamber is running on port '${port}'`);
  });

  const wss = new WebSocket.Server({
    server,
  });

  wss.on("connection", function connection(ws) {
    debugServer("Someone connected over the socket");
  });

  function sendData({ data, label, sessionId }: SendDataOptions) {
    try {
      wss.clients.forEach(function each(client) {
        if (client.readyState === WebSocket.OPEN) {
          client.send(
            JSON.stringify({
              label,
              data,
              sessionId,
            })
          );
        }
      });
    } catch (err) {
      debugError("Error while sending data", err);
    }
  }

  return { sendData };
}

interface InitChamberOptions {
  getSessionId?: (context: any) => string;
  port?: number;
}

/**
 * Returns an apollo server plugin
 */
export const initChamber: (
  options?: InitChamberOptions
) => ApolloServerPlugin = (options) => {
  if (process.env.NODE_ENV !== "development") {
    return;
  }

  // Start the server
  const { sendData } = startServer(options?.port);

  return {
    requestDidStart(ctx) {
      return {
        didResolveOperation() {
          debugPlugin("didResolveOperation");
        },

        didResolveSource() {
          debugPlugin("didResolveSource");
        },

        executionDidStart() {
          debugPlugin("executionDidStart");
        },

        parsingDidStart() {
          debugPlugin("parsingDidStart");
        },

        validationDidStart() {
          debugPlugin("validationDidStart");
        },

        willSendResponse(ctx) {
          debugPlugin("Will send response");

          let sessionId = "_empty";
          if (options?.getSessionId) {
            sessionId = options?.getSessionId(ctx.context);
          }

          if (ctx.response.extensions?.tracing) {
            sendData({
              label: "trace",
              data: ctx.response.extensions?.tracing,
              sessionId,
            });
          }
        },

        didEncounterErrors(ctx) {
          debugPlugin("Did encounter errors");
        },
      };
    },
  };
};
