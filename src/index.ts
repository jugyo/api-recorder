#!/usr/bin/env node

const [host, port, dir] = process.argv.slice(2);

if (!(host && port && dir)) {
  console.warn(`Usage: api-recorder host port dir`);
  process.exit(1);
}

import express from "express";
import proxy from "express-http-proxy";
import logger from "./logger";
import recorder from "./recorder";

const app = express();

const { get, set } = recorder({ dir });

app.use(logger);
app.use(get);
app.use(
  "/",
  proxy(host, {
    userResDecorator: function (proxyRes, proxyResData, userReq, userRes) {
      const data = proxyResData.toString("utf8");
      set(userReq, data);
      return proxyResData;
    },
  })
);

app.listen(port, () => {
  console.log(`api-recorder listening at http://localhost:${port}`);
});
