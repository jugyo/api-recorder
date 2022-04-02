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

interface CachePath {
  dir: string;
  filePath: string;
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
    fs.writeFileSync(_path.filePath, data);
  }

  makePath(key: Key): CachePath {
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

function extractMetaData(data: string): {
  data: string;
  metadata?: { [key: string]: string };
} {
  const match = data.match(/^__.*/g);
  if (match) {
    const metadata = {};
    for (const i of match) {
      const [key, value] = i.split(/:\s+/);
      metadata[key.replace(/^__/, "")] = value;
    }
    const _data = data.replace(/^__.*\n/g, "");
    return { data: _data, metadata };
  } else {
    return { data };
  }
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
      res._cacheFilePath = store.makePath(key).filePath;

      const meta = extractMetaData(data);

      res.status(meta.metadata?.status || 200);
      res.send(meta.data);
      return;
    } else {
      next();
    }
  };

  const set = (req, data) => {
    const key = genKey(req);
    try {
      store.set(key, data);
      return store.makePath(key);
    } catch (error: any) {
      console.error(`Failed to cache data for key: ${key}`, error.message);
    }
  };

  return { get, set };
};
