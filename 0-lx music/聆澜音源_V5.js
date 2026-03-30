/*!
 * @name 聆澜音源(公益版)
 * @description 支持所有平台最高 flac
 * @version v5
 * @author 时迁酱&guoyue2010
 */
const DEV_ENABLE = false;
const UPDATE_ENABLE = true;
const API_URL = "https://source.shiqianjiang.cn/api/music";
const API_KEY = "";
const SCRIPT_MD5 = "642a1ebc69d3665c5e4f07474470b14c";
const MUSIC_QUALITY = {"kw":["128k","320k","flac"],"mg":["128k","320k","flac"],"wy":["128k","320k","flac"]};
const MUSIC_SOURCE = Object.keys(MUSIC_QUALITY);
const { EVENT_NAMES, request, on, send, utils, env, version } = globalThis.lx;
const httpFetch = (url, options = { method: "GET" }) => {
  return new Promise((resolve, reject) => {
    request(url, options, (err, resp) => {
      if (err) return reject(err);
      resolve(resp);
    });
  });
};
const handleGetMusicUrl = async (source, musicInfo, quality) => {
  const songId = musicInfo.hash ?? musicInfo.songmid;
  const requestUrl = `${API_URL}/url?source=${source}&songId=${songId}&quality=${quality}`;
  const headers = {
    "Content-Type": "application/json",
    "User-Agent": `${env ? `lx-music-${env}/${version}` : `lx-music-request/${version}`}`
  };
  if (API_KEY) headers["X-API-Key"] = API_KEY;
  const requestRes = await httpFetch(requestUrl, { method: "GET", headers, follow_max: 5 });
  const { body } = requestRes;
  if (!body || isNaN(Number(body.code))) throw new Error("unknown error");
  switch (body.code) {
    case 200: return body.url;
    case 403: throw new Error("权限不足或Key失效");
    case 429: throw new Error("请求过速，请稍后再试");
    default: throw new Error(body.message ?? "未知错误");
  }
};
const checkUpdate = async () => {
  try {
    const requestRes = await httpFetch(`${API_URL.replace('/music','')}/script?checkUpdate=${SCRIPT_MD5}&key=${API_KEY}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": `${env ? `lx-music-${env}/${version}` : `lx-music-request/${version}`}`,
      },
    });
    const { body } = requestRes;
    if (body?.data) {
      globalThis.lx.send(lx.EVENT_NAMES.updateAlert, {
        log: body.data.updateMsg, updateUrl: body.data.updateUrl,
      });
    }
  } catch {}
};
const musicSources = {};
MUSIC_SOURCE.forEach((item) => {
  musicSources[item] = { name: item, type: "music", actions: ["musicUrl"], qualitys: MUSIC_QUALITY[item] };
});
on(EVENT_NAMES.request, ({ action, source, info }) => {
  switch (action) {
    case "musicUrl":
      return handleGetMusicUrl(source, info.musicInfo, info.type)
        .then((data) => Promise.resolve(data))
        .catch((err) => Promise.reject(err));
    default:
      return Promise.reject("action not support");
  }
});
if (UPDATE_ENABLE) checkUpdate();
send(EVENT_NAMES.inited, { status: true, openDevTools: false, sources: musicSources });