import fs from "fs";
import path from "path";

function debug(...args) {
  if (process.env.DEBUG) {
    console.log(...args);
  }
}

interface Key {
  session: string;
  method: string;
  url: string;
  fileExtension?: string;
}

class CacheStore {
  constructor(private dir: string) {
    if (!fs.existsSync(this.dir)) {
      fs.mkdirSync(this.dir, { recursive: true });
    }
  }

  get(key: Key) {
    const _path = this.makePath(key);
    return fs.readFileSync(_path.filePath, "utf8");
  }

  exists(key: Key) {
    return fs.existsSync(this.makePath(key).filePath);
  }

  set(key: Key, data: string | Buffer) {
    const _path = this.makePath(key);
    if (!fs.existsSync(_path.dir)) {
      fs.mkdirSync(_path.dir, { recursive: true });
    }
    debug(`Storing a cache into ${_path.filePath}`);
    fs.writeFileSync(_path.filePath, data, { flag: "a" });
  }

  makePath(key: Key) {
    const dir = path.join(
      this.dir,
      encodeURIComponent(key.session),
      key.method.toUpperCase()
    );
    const file =
      encodeURIComponent(key.url) + `.${key.fileExtension || "json"}`;
    const filePath = path.join(dir, file);
    return { dir, filePath };
  }
}

function genKey(req) {
  const session = req.headers.authorization
    ? req.headers.authorization.slice(0, 100)
    : "anonymous";
  const method = req.method;
  const url = req.originalUrl;
  const fileExtension = String(req.headers["accept"]).match(/application\/json/)
    ? "json"
    : undefined;
  return { session, method, url, fileExtension };
}

export default (options) => {
  const store = new CacheStore(options.dir);

  const get = (req, res, next) => {
    const key = genKey(req);

    if (store.exists(key)) {
      const data = store.get(key);
      debug(
        `Found a cache for key: ${JSON.stringify(key)}, data.length: ${
          data.length
        }`
      );
      res._cacheHit = true;
      res.status(200);
      res.send(data);
      return;
    } else {
      next();
    }
  };

  const set = (req, data) => {
    const key = genKey(req);
    store.set(key, data);
  };

  return { get, set };
};
