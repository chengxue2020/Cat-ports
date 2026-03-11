const API_URL = "https://source.shiqianjiang.cn/api/music";
const API_KEY = "";
const UPDATE_URL = "https://source.shiqianjiang.cn/script/mf/kg.js?key=.js";
const VERSION = "4.0.0";
const IS_PAID = "(公益版)";

("use strict");
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = require("axios");
const cheerio_1 = require("cheerio");
const CryptoJs = require("crypto-js");
const he = require("he");
const pageSize = 20;

const QUALITY_MAPPING = {
  low: "128k",
  standard: "320k",
  high: "flac",
  super: "flac24bit",
};

const SUPPORTED_QUALITIES = ["128k", "320k", "flac", "flac24bit"];

function signatureParams(params, platform = "android", body = "") {
  let keyparam = "OIlwieks28dk2k092lksi2UIkp";
  if (platform === "web") keyparam = "NVPh5oo715z5DIWAeQlhMDsWXXQV4hwt";
  const param_list = params.split("&");
  param_list.sort();
  const sign_params = `${keyparam}${param_list.join("")}${body}${keyparam}`;
  return CryptoJs.MD5(sign_params).toString();
}

function formatMusicItem(_) {
  var _a, _b, _c, _d, _e, _f, _g, _h, _i;

  const fileHash =
    (_d = _.FileHash) !== null && _d !== void 0 ? _d : _.Grp[0].FileHash;

  const qualities = {
    "128k": { hash: fileHash, bitrate: 128000 },
    "320k": { hash: _.HQFileHash || fileHash, bitrate: 320000 },
    flac: { hash: _.SQFileHash || fileHash, bitrate: 1411000 },
    flac24bit: { hash: _.SQFileHash || fileHash, bitrate: 2304000 },
  };

  const singers = _.Singers || [];
  const singerList = singers.map((s) => ({
    id: s.id,
    name: s.name,
    avatar: s.img || "",
  }));

  return {
    id: fileHash,
    title: (_a = _.SongName) !== null && _a !== void 0 ? _a : _.OriSongName,
    artist:
      (_b = _.SingerName) !== null && _b !== void 0
        ? _b
        : singers.map((s) => s.name).join(", "),
    singerList: singerList,
    album:
      (_c = _.AlbumName) !== null && _c !== void 0 ? _c : _.Grp[0].AlbumName,
    album_id:
      (_e = _.AlbumID) !== null && _e !== void 0 ? _e : _.Grp[0].AlbumID,
    album_audio_id: 0,
    duration: _.Duration,
    artwork: ((_f = _.Image) !== null && _f !== void 0
      ? _f
      : _.Grp[0].Image
    ).replace("{size}", "1080"),
    "320hash": (_i = _.HQFileHash) !== null && _i !== void 0 ? _i : undefined,
    sqhash: (_g = _.SQFileHash) !== null && _g !== void 0 ? _g : undefined,
    ResFileHash:
      (_h = _.ResFileHash) !== null && _h !== void 0 ? _h : undefined,
    qualities: qualities,
  };
}

function formatMusicItem2(_) {
  var _a, _b, _c, _d, _e, _f, _g;

  const qualities = {
    "128k": { hash: _.hash, bitrate: 128000 },
    "320k": { hash: _["320hash"] || _.hash, bitrate: 320000 },
    flac: { hash: _.sqhash || _.hash, bitrate: 1411000 },
    flac24bit: { hash: _.sqhash || _.hash, bitrate: 2304000 },
  };

  const authors = _.authors || [];
  const singerList = authors.map((a) => ({
    id: a.author_id,
    name: a.author_name,
    avatar: a.avatar || "",
  }));

  return {
    id: _.hash,
    title: _.songname,
    artist:
      (_a = _.singername) !== null && _a !== void 0
        ? _a
        : ((_c =
            (_b = _.authors) === null || _b === void 0
              ? void 0
              : _.authors.map((_) => {
                  var _a;
                  return (_a =
                    _ === null || _ === void 0 ? void 0 : _.author_name) !==
                    null && _a !== void 0
                    ? _a
                    : "";
                })) === null || _c === void 0
            ? void 0
            : _c.join(", ")) ||
          ((_f =
            (_e =
              (_d = _.filename) === null || _d === void 0
                ? void 0
                : _.filename.split("-")) === null || _e === void 0
              ? void 0
              : _e[0]) === null || _f === void 0
            ? void 0
            : _f.trim()),
    singerList: singerList,
    album: (_g = _.album_name) !== null && _g !== void 0 ? _g : _.remark,
    album_id: _.album_id,
    album_audio_id: _.album_audio_id,
    artwork: _.album_sizable_cover
      ? _.album_sizable_cover.replace("{size}", "400")
      : undefined,
    duration: _.duration,
    "320hash": _["320hash"],
    sqhash: _.sqhash,
    origin_hash: _.origin_hash,
    qualities: qualities,
  };
}

function formatImportMusicItem(_) {
  var _a, _b, _c, _d, _e, _f, _g;
  let title = _.name;
  const singerName = _.singername;
  if (singerName && title) {
    const index = title.indexOf(singerName);
    if (index !== -1) {
      title =
        (_a = title.substring(index + singerName.length + 2)) === null ||
        _a === void 0
          ? void 0
          : _a.trim();
    }
    if (!title) {
      title = singerName;
    }
  }
  const qualites = _.relate_goods;

  const qualities = {
    "128k": { hash: _.hash, bitrate: 128000 },
    "320k": { hash: _.hash, bitrate: 320000 },
    flac: { hash: _.hash, bitrate: 1411000 },
    flac24bit: { hash: _.hash, bitrate: 2304000 },
  };

  if (qualites && qualites[1] && qualites[1].hash) {
    qualities["320k"].hash = qualites[1].hash;
  }
  if (qualites && qualites[2] && qualites[2].hash) {
    qualities["flac"].hash = qualites[2].hash;
    qualities["flac24bit"].hash = qualites[2].hash;
  }

  return {
    id: _.hash,
    title,
    artist: singerName,
    album: (_b = _.albumname) !== null && _b !== void 0 ? _b : "",
    album_id: _.album_id,
    album_audio_id: _.album_audio_id,
    artwork:
      (_d =
        (_c = _ === null || _ === void 0 ? void 0 : _.info) === null ||
        _c === void 0
          ? void 0
          : _.info.image) === null || _d === void 0
        ? void 0
        : _d.replace("{size}", "400"),
    "320hash":
      (_e = qualites === null || qualites === void 0 ? void 0 : qualites[1]) ===
        null || _e === void 0
        ? void 0
        : _e.hash,
    sqhash:
      (_f = qualites === null || qualites === void 0 ? void 0 : qualites[2]) ===
        null || _f === void 0
        ? void 0
        : _f.hash,
    origin_hash:
      (_g = qualites === null || qualites === void 0 ? void 0 : qualites[3]) ===
        null || _g === void 0
        ? void 0
        : _g.hash,
    qualities: qualities,
  };
}

const headers = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/106.0.0.0 Safari/537.36",
  Accept: "*/*",
  "Accept-Encoding": "gzip, deflate",
  "Accept-Language": "zh-CN,zh;q=0.9",
};

async function searchMusic(query, page) {
  const res = (
    await axios_1.default.get("https://songsearch.kugou.com/song_search_v2", {
      headers,
      params: {
        keyword: query,
        page,
        pagesize: pageSize,
        userid: 0,
        clientver: "",
        platform: "WebFilter",
        filter: 2,
        iscorrection: 1,
        privilege_filter: 0,
        area_code: 1,
      },
    })
  ).data;

  const songs = res.data.lists.map(formatMusicItem);
  return {
    isEnd: page * pageSize >= res.data.total,
    data: songs,
  };
}

async function searchAlbum(query, page) {
  const res = (
    await axios_1.default.get("http://msearch.kugou.com/api/v3/search/album", {
      headers,
      params: {
        version: 9108,
        iscorrection: 1,
        highlight: "em",
        plat: 0,
        keyword: query,
        pagesize: 20,
        page,
        sver: 2,
        with_res_tag: 0,
      },
    })
  ).data;
  const albums = res.data.info.map((_) => {
    var _a, _b;
    return {
      id: _.albumid,
      artwork:
        (_a = _.imgurl) === null || _a === void 0
          ? void 0
          : _.imgurl.replace("{size}", "400"),
      artist: _.singername,
      title: (0, cheerio_1.load)(_.albumname).text(),
      description: _.intro,
      date:
        (_b = _.publishtime) === null || _b === void 0
          ? void 0
          : _.publishtime.slice(0, 10),
    };
  });
  return {
    isEnd: page * 20 >= res.data.total,
    data: albums,
  };
}

async function searchMusicSheet(query, page) {
  const res = (
    await axios_1.default.get(
      "http://mobilecdn.kugou.com/api/v3/search/special",
      {
        headers,
        params: {
          format: "json",
          keyword: query,
          page,
          pagesize: pageSize,
          showtype: 1,
          pagesize: 20,
        },
      },
    )
  ).data;

  const sheets = (res.data?.info || []).map((item) => ({
    id: item.specialid,
    title: item.specialname,
    description: item.intro || "",
    createAt: item.publishtime || "",
    artist: item.nickname || "",
    coverImg: item.imgurl ? item.imgurl.replace("{size}", "400") : "",
    artwork: item.imgurl ? item.imgurl.replace("{size}", "400") : "",
    gid: item.gid || "",
    playCount: item.playcount || 0,
    worksNum: item.songcount || 0,
  }));

  return {
    isEnd: page * pageSize >= (res.data?.total || 0),
    data: sheets,
  };
}

async function searchLyric(query, page) {
  const res = await searchMusic(query, page);
  return {
    isEnd: res.isEnd,
    data: res.data.map((item) => ({
      title: item.title,
      artist: item.artist,
      id: item.id,
      artwork: item.artwork,
      album: item.album,
      platform: "酷狗音乐",
    })),
  };
}

async function searchArtist(query, page) {
  try {
    const res = (
      await axios_1.default.get(
        "http://mobilecdn.kugou.com/api/v3/search/singer",
        {
          headers,
          params: {
            version: 9108,
            keyword: query,
            page,
            pagesize: pageSize,
            singingtype: -100,
            accuracy: 1,
            istag: 1,
            area_code: 1,
          },
        },
      )
    ).data;

    if (!res || res.status !== 1 || !res.data) {
      return {
        isEnd: true,
        data: [],
      };
    }

    const artistInfoPromises = res.data.map((_) =>
      axios_1.default
        .get("http://mobilecdn.kugou.com/api/v3/singer/info", {
          headers,
          params: {
            version: 9108,
            singerid: _.singerid,
            area_code: 1,
          },
          timeout: 5000,
        })
        .then((infoRes) => ({
          name: _.singername,
          id: _.singerid,
          avatar:
            infoRes.data && infoRes.data.data && infoRes.data.data.imgurl
              ? infoRes.data.data.imgurl.replace("{size}", "400")
              : undefined,
          description:
            infoRes.data && infoRes.data.data && infoRes.data.data.profile
              ? infoRes.data.data.profile
              : undefined,
          worksNum:
            infoRes.data && infoRes.data.data && infoRes.data.data.songcount
              ? infoRes.data.data.songcount
              : 0,
        }))
        .catch(() => ({
          name: _.singername,
          id: _.singerid,
          avatar: undefined,
          description: undefined,
          worksNum: 0,
        })),
    );

    const artists = await Promise.all(artistInfoPromises);

    return {
      isEnd: res.data.length < pageSize,
      data: artists,
    };
  } catch (error) {
    return {
      isEnd: true,
      data: [],
    };
  }
}

async function getMediaSource(musicItem, quality) {
  try {
    const apiQuality = QUALITY_MAPPING[quality] || quality;

    let hash;

    if (musicItem.qualities && musicItem.qualities[apiQuality]) {
      hash = musicItem.qualities[apiQuality].hash;
    } else {
      switch (apiQuality) {
        case "128k":
          hash = musicItem.id;
          break;
        case "320k":
          hash = musicItem["320hash"] || musicItem.id;
          break;
        case "flac":
        case "flac24bit":
          hash = musicItem.sqhash || musicItem.id;
          break;
        default:
          hash = musicItem.id;
      }
    }

    const requestUrl = `${API_URL}/url?source=kg&songId=${hash}&quality=${apiQuality}`;

    const requestHeaders = {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/106.0.0.0 Safari/537.36",
      "Content-Type": "application/json",
      Accept: "application/json",
      "X-API-Key": API_KEY,
    };

    const res = await axios_1.default.get(requestUrl, {
      headers: requestHeaders,
      timeout: 15000,
    });

    const data = res.data;

    if (data && data.code === 200 && data.url) {
      return {
        url: data.url,
        quality: apiQuality,
      };
    } else if (data && data.code === 403) {
      throw new Error("API密钥无效或已过期，请检查配置");
    } else if (data && data.code === 429) {
      throw new Error("请求过于频繁，请稍后再试");
    } else {
      throw new Error(
        `获取播放链接失败: ${data ? data.message || data.msg || "未知错误" : "无响应"}`,
      );
    }
  } catch (error) {
    if (error.response) {
      if (error.response.status === 403) {
        throw new Error("API密钥无效或已过期");
      } else if (error.response.status === 429) {
        throw new Error("请求过于频繁，请稍后再试");
      } else if (error.response.status === 404) {
        throw new Error("歌曲不存在或已被下架");
      } else if (error.response.status >= 500) {
        throw new Error("服务器错误，请稍后再试");
      }
    }

    throw new Error(`播放失败: ${error.message}`);
  }
}

async function getTopLists() {
  const lists = (
    await axios_1.default.get(
      "http://mobilecdnbj.kugou.com/api/v3/rank/list?version=9108&plat=0&showtype=2&parentid=0&apiver=6&area_code=1&withsong=0&with_res_tag=0",
      {
        headers: headers,
      },
    )
  ).data.data.info;
  const res = [
    {
      title: "热门榜单",
      data: [],
    },
    {
      title: "特色音乐榜",
      data: [],
    },
    {
      title: "全球榜",
      data: [],
    },
  ];
  const extra = {
    title: "其他",
    data: [],
  };
  lists.forEach((item) => {
    var _a, _b, _c, _d;
    if (item.classify === 1 || item.classify === 2) {
      res[0].data.push({
        id: item.rankid,
        description: item.intro,
        coverImg:
          (_a = item.imgurl) === null || _a === void 0
            ? void 0
            : item.imgurl.replace("{size}", "400"),
        title: item.rankname,
      });
    } else if (item.classify === 3 || item.classify === 5) {
      res[1].data.push({
        id: item.rankid,
        description: item.intro,
        coverImg:
          (_b = item.imgurl) === null || _b === void 0
            ? void 0
            : item.imgurl.replace("{size}", "400"),
        title: item.rankname,
      });
    } else if (item.classify === 4) {
      res[2].data.push({
        id: item.rankid,
        description: item.intro,
        coverImg:
          (_c = item.imgurl) === null || _c === void 0
            ? void 0
            : item.imgurl.replace("{size}", "400"),
        title: item.rankname,
      });
    } else {
      extra.data.push({
        id: item.rankid,
        description: item.intro,
        coverImg:
          (_d = item.imgurl) === null || _d === void 0
            ? void 0
            : item.imgurl.replace("{size}", "400"),
        title: item.rankname,
      });
    }
  });
  if (extra.data.length !== 0) {
    res.push(extra);
  }
  return res;
}

async function getTopListDetail(topListItem) {
  const res = await axios_1.default.get(
    `http://mobilecdnbj.kugou.com/api/v3/rank/song?version=9108&ranktype=0&plat=0&pagesize=100&area_code=1&page=1&volid=35050&rankid=${topListItem.id}`,
    {
      headers,
    },
  );
  return Object.assign(Object.assign({}, topListItem), {
    musicList: res.data.data.info.map(formatMusicItem2),
  });
}

async function getLyricDownload(lyrdata) {
  try {
    const result = (
      await (0, axios_1.default)({
        url: `http://lyrics.kugou.com/download?ver=1&client=pc&id=${lyrdata.id}&accesskey=${lyrdata.accessKey}&fmt=lrc&charset=utf8`,
        headers: {
          "KG-RC": 1,
          "KG-THash": "expand_search_manager.cpp:852736169:451",
          "User-Agent": "KuGou2012-9020-ExpandSearchManager",
        },
        method: "get",
        xsrfCookieName: "XSRF-TOKEN",
        withCredentials: true,
      })
    ).data;

    if (result && result.content) {
      const decodedLyric = he.decode(
        CryptoJs.enc.Base64.parse(result.content).toString(CryptoJs.enc.Utf8),
      );

      return {
        rawLrc: decodedLyric,
      };
    }
    return { rawLrc: "" };
  } catch (error) {
    return { rawLrc: "" };
  }
}

async function getLyric(musicItem) {
  try {
    const result = (
      await (0, axios_1.default)({
        url: `http://lyrics.kugou.com/search?ver=1&man=yes&client=pc&keyword=${encodeURIComponent(musicItem.title)}&hash=${musicItem.id}&timelength=${musicItem.duration || 0}`,
        headers: {
          "KG-RC": 1,
          "KG-THash": "expand_search_manager.cpp:852736169:451",
          "User-Agent": "KuGou2012-9020-ExpandSearchManager",
        },
        method: "get",
        xsrfCookieName: "XSRF-TOKEN",
        withCredentials: true,
      })
    ).data;

    if (result && result.candidates && result.candidates.length > 0) {
      const info = result.candidates[0];
      if (info && info.id && info.accesskey) {
        return await getLyricDownload({
          id: info.id,
          accessKey: info.accesskey,
        });
      }
    }

    return { rawLrc: "" };
  } catch (error) {
    return { rawLrc: "" };
  }
}

async function getAlbumInfo(albumItem, page = 1) {
  const res = (
    await axios_1.default.get("http://mobilecdn.kugou.com/api/v3/album/song", {
      params: {
        version: 9108,
        albumid: albumItem.id,
        plat: 0,
        pagesize: 100,
        area_code: 1,
        page,
        with_res_tag: 0,
      },
    })
  ).data;
  return {
    isEnd: page * 100 >= res.data.total,
    albumItem: {
      worksNum: res.data.total,
    },
    musicList: res.data.info.map((_) => {
      var _a;
      const [artist, songname] = _.filename.split("-");
      return {
        id: _.hash,
        title: songname.trim(),
        artist: artist.trim(),
        album: (_a = _.album_name) !== null && _a !== void 0 ? _a : _.remark,
        album_id: _.album_id,
        album_audio_id: _.album_audio_id,
        artwork: albumItem.artwork,
        "320hash": _.HQFileHash,
        sqhash: _.SQFileHash,
        origin_hash: _.id,
        qualities: {
          "128k": { hash: _.hash, bitrate: 128000 },
          "320k": { hash: _.HQFileHash || _.hash, bitrate: 320000 },
          flac: { hash: _.SQFileHash || _.hash, bitrate: 1411000 },
          flac24bit: { hash: _.SQFileHash || _.hash, bitrate: 2304000 },
        },
      };
    }),
  };
}

function formatArtistSongItem(_) {
  var _a;

  const qualities = {
    "128k": { hash: _.hash, bitrate: 128000 },
    "320k": { hash: _.HQFileHash || _["320hash"] || _.hash, bitrate: 320000 },
    flac: { hash: _.SQFileHash || _.sqhash || _.hash, bitrate: 1411000 },
    flac24bit: { hash: _.SQFileHash || _.sqhash || _.hash, bitrate: 2304000 },
  };

  let artist = "";
  let title = "";
  if (_.filename) {
    const parts = _.filename.split("-");
    if (parts.length >= 2) {
      artist = parts[0].trim();
      title = parts
        .slice(1)
        .join("-")
        .replace(/\.mp3$/i, "")
        .trim();
    } else {
      title = _.filename.replace(/\.mp3$/i, "").trim();
    }
  }

  return {
    id: _.hash,
    title: title || _.songname || "未知歌曲",
    artist: artist || _.singername || "未知歌手",
    album: (_a = _.album_name) !== null && _a !== void 0 ? _a : _.remark,
    album_id: _.album_id,
    album_audio_id: _.album_audio_id,
    artwork: _.trans_param?.union_cover
      ? _.trans_param.union_cover.replace("{size}", "400")
      : _.album_sizable_cover
        ? _.album_sizable_cover.replace("{size}", "400")
        : undefined,
    duration: _.duration,
    "320hash": _.HQFileHash || _["320hash"],
    sqhash: _.SQFileHash || _.sqhash,
    origin_hash: _.origin_hash,
    qualities: qualities,
  };
}

async function getArtistWorks(artistItem, page, type) {
  if (type === "music") {
    const res = (
      await axios_1.default.get(
        "http://mobilecdn.kugou.com/api/v3/singer/song",
        {
          headers,
          params: {
            version: 9108,
            singerid: artistItem.id,
            page,
            pagesize: 100,
            sorttype: 1,
            area_code: 1,
          },
        },
      )
    ).data;

    return {
      isEnd: page * 100 >= res.data.total,
      data: res.data.info.map(formatArtistSongItem),
    };
  } else if (type === "album") {
    const res = (
      await axios_1.default.get(
        "http://mobilecdn.kugou.com/api/v3/singer/album",
        {
          headers,
          params: {
            version: 9108,
            singerid: artistItem.id,
            page,
            pagesize: 20,
            area_code: 1,
          },
        },
      )
    ).data;
    return {
      isEnd: page * 20 >= res.data.total,
      data: res.data.info.map((_) => ({
        id: _.albumid,
        title: _.albumname,
        artwork: _.imgurl ? _.imgurl.replace("{size}", "400") : undefined,
        date: _.publishtime ? _.publishtime.slice(0, 10) : undefined,
        artist: artistItem.name,
      })),
    };
  }
}

async function importMusicSheet(urlLike) {
  var _a;
  let id =
    (_a = urlLike.match(/^(?:.*?)(\d+)(?:.*?)$/)) === null || _a === void 0
      ? void 0
      : _a[1];
  let musicList = [];

  if (!id) {
    return musicList;
  }

  try {
    let res = await axios_1.default.post(`http://t.kugou.com/command/`, {
      appid: 1001,
      clientver: 9020,
      mid: "21511157a05844bd085308bc76ef3343",
      clienttime: 640612895,
      key: "36164c4015e704673c588ee202b9ecb8",
      data: id,
    });

    if (res.status === 200 && res.data.status === 1) {
      let data = res.data.data;
      let response = await axios_1.default.post(
        `http://www2.kugou.kugou.com/apps/kucodeAndShare/app/`,
        {
          appid: 1001,
          clientver: 10112,
          mid: "70a02aad1ce4648e7dca77f2afa7b182",
          clienttime: 722219501,
          key: "381d7062030e8a5a94cfbe50bfe65433",
          data: {
            id: data.info.id,
            type: 3,
            userid: data.info.userid,
            collect_type: data.info.collect_type,
            page: 1,
            pagesize: data.info.count,
          },
        },
      );
      if (response.status === 200 && response.data.status === 1) {
        let resource = [];
        response.data.data.forEach((song) => {
          resource.push({
            album_audio_id: 0,
            album_id: "0",
            hash: song.hash,
            id: 0,
            name: song.filename.replace(".mp3", ""),
            page_id: 0,
            type: "audio",
          });
        });
        let postData = {
          appid: 1001,
          area_code: "1",
          behavior: "play",
          clientver: "10112",
          dfid: "2O3jKa20Gdks0LWojP3ly7ck",
          mid: "70a02aad1ce4648e7dca77f2afa7b182",
          need_hash_offset: 1,
          relate: 1,
          resource,
          token: "",
          userid: "0",
          vip: 0,
        };
        var result = await axios_1.default.post(
          `https://gateway.kugou.com/v2/get_res_privilege/lite?appid=1001&clienttime=1668883879&clientver=10112&dfid=2O3jKa20Gdks0LWojP3ly7ck&mid=70a02aad1ce4648e7dca77f2afa7b182&userid=390523108&uuid=92691C6246F86F28B149BAA1FD370DF1`,
          postData,
          {
            headers: {
              "x-router": "media.store.kugou.com",
            },
          },
        );
        if (response.status === 200 && response.data.status === 1) {
          musicList = result.data.data.map(formatImportMusicItem);
        }
      }
    }
  } catch (error) {}

  return musicList;
}

async function getMusicInfo(musicBase) {
  const hash = musicBase.hash || musicBase.id;
  if (!hash) {
    return null;
  }

  try {
    if (musicBase.artwork && musicBase.title && musicBase.artist) {
      return {
        id: hash,
        hash: hash,
        title: musicBase.title,
        artist: musicBase.artist,
        album: musicBase.album || "",
        album_id: musicBase.album_id || 0,
        artwork: musicBase.artwork,
        duration: musicBase.duration,
        qualities: musicBase.qualities || {
          "128k": { hash: hash, bitrate: 128000 },
          "320k": { hash: musicBase["320hash"] || hash, bitrate: 320000 },
          flac: { hash: musicBase.sqhash || hash, bitrate: 1411000 },
          flac24bit: { hash: musicBase.sqhash || hash, bitrate: 2304000 },
        },
        platform: "酷狗音乐",
      };
    }

    return {
      id: hash,
      hash: hash,
      title: musicBase.title || "未知歌曲",
      artist: musicBase.artist || "未知歌手",
      album: musicBase.album || "",
      album_id: musicBase.album_id || 0,
      artwork: musicBase.artwork || "",
      platform: "酷狗音乐",
    };
  } catch (error) {
    return null;
  }
}

function formatRecommendSheetItem(item) {
  return {
    id: item.specialid || item.rankid || item.albumid || item.AuthorId || "",
    title:
      item.specialname ||
      item.rankname ||
      item.albumname ||
      item.title ||
      item.AuthorName ||
      "",
    description: item.intro || "",
    createAt: item.publishtime || item.rank_id_publish_date || "",
    artist: item.nickname || item.username || "",
    coverImg:
      (item.img || item.flexible_cover || item.imgurl || item.Avatar)?.replace(
        "{size}",
        "480",
      ) || "",
    artwork:
      (item.img || item.flexible_cover || item.imgurl || item.Avatar)?.replace(
        "{size}",
        "480",
      ) || "",
    playCount: item.play_count || item.playcount || 0,
    worksNum:
      item.song_count || item.songcount || item.extra?.resp?.all_total || 0,
  };
}

async function getRecommendSheetTags() {
  let pinned = [
    { title: "推荐", id: "5" },
    { title: "最热", id: "6" },
    { title: "最新", id: "7" },
    { title: "热藏", id: "3" },
    { title: "飙升", id: "8" },
  ];

  let group = [];

  try {
    let res = (
      await axios_1.default.get(
        "http://www2.kugou.kugou.com/yueku/v9/special/getSpecial?is_smarty=1",
      )
    ).data;

    let tagids = res.data?.tagids || {};
    let index = 0;

    for (let name in tagids) {
      if (tagids.hasOwnProperty(name)) {
        group[index] = {
          title: name,
          data: [],
        };

        const tagData = tagids[name]?.data || [];
        tagData.forEach((tag) => {
          group[index].data.push({
            title: tag.name || "",
            id: String(tag.id || ""),
          });
        });
        index++;
      }
    }
  } catch (error) {}

  return {
    pinned: pinned,
    data: group,
  };
}

async function getRecommendSheetsByTag(tag, page) {
  let list = [];
  let tagId = tag?.id || "";

  let sortId = "5";
  let categoryId = "";

  if (["3", "5", "6", "7", "8"].includes(tagId)) {
    sortId = tagId;
    categoryId = "";
  } else if (tagId) {
    categoryId = tagId;
  }

  try {
    if (sortId === "5" && !categoryId && page === 1) {
      let [recRes, listRes] = await Promise.all([
        axios_1
          .default({
            url: "http://everydayrec.service.kugou.com/guess_special_recommend",
            method: "POST",
            data: {
              appid: 1001,
              clienttime: Date.now(),
              clientver: 8275,
              key: "f1f93580115bb106680d2375f8032d96",
              mid: "21511157a05844bd085308bc76ef3343",
              platform: "pc",
              userid: "262643156",
              return_min: 6,
              return_max: 15,
            },
            headers: {
              "User-Agent": "KuGou2012-8275-web_browser_event_handler",
            },
          })
          .catch(() => ({ data: {} })),
        axios_1.default
          .get(
            `http://www2.kugou.kugou.com/yueku/v9/special/getSpecial?is_ajax=1&cdn=cdn&t=${sortId}&c=${categoryId}&p=${page}&pagesize=${pageSize}`,
          )
          .catch(() => ({ data: {} })),
      ]);

      let recList = recRes.data?.data?.special_list || [];
      let normalList = listRes.data?.special_db || [];
      list = [...recList, ...normalList];
    } else {
      let res = await axios_1.default.get(
        `http://www2.kugou.kugou.com/yueku/v9/special/getSpecial?is_ajax=1&cdn=cdn&t=${sortId}&c=${categoryId}&p=${page}&pagesize=${pageSize}`,
      );
      list = res.data?.special_db || [];
    }
  } catch (error) {}

  return {
    isEnd: list.length < pageSize,
    data: list.map(formatRecommendSheetItem),
  };
}

async function getMusicSheetInfo(sheet, page = 1) {
  try {
    let sheetId = sheet.id || sheet;

    if (typeof sheetId === "string") {
      if (sheetId.startsWith("id_")) {
        sheetId = sheetId.replace("id_", "");
      }
      sheetId = sheetId.replace(/\D/g, "");
    }

    if (!sheetId) {
      return {
        isEnd: true,
        musicList: [],
      };
    }

    const pageSize = 100;

    const res = await axios_1.default.get(
      `http://mobilecdn.kugou.com/api/v3/special/song`,
      {
        headers: headers,
        params: {
          version: 9108,
          specialid: sheetId,
          page,
          pagesize: pageSize,
          plat: 0,
          area_code: 1,
          with_res_tag: 0,
        },
      },
    );

    if (!res.data || res.data.status !== 1 || !res.data.data) {
      return {
        isEnd: true,
        musicList: [],
      };
    }

    const data = res.data.data;
    const songs = data.info || [];

    const musicList = songs.map((song) => {
      let artist = "";
      let title = "";

      if (song.filename) {
        const parts = song.filename.split("-");
        if (parts.length >= 2) {
          artist = parts[0].trim();
          title = parts
            .slice(1)
            .join("-")
            .replace(/\.mp3$/i, "")
            .trim();
        } else {
          title = song.filename.replace(/\.mp3$/i, "").trim();
        }
      }

      let artwork = undefined;
      if (song.trans_param?.union_cover) {
        artwork = song.trans_param.union_cover.replace("{size}", "400");
      } else if (song.album_sizable_cover) {
        artwork = song.album_sizable_cover.replace("{size}", "400");
      }

      const qualities = {
        "128k": {
          hash: song.hash,
          bitrate: 128000,
        },
        "320k": {
          hash: song["320hash"] || song.hash,
          bitrate: 320000,
        },
        flac: {
          hash: song.sqhash || song.hash,
          bitrate: 1411000,
        },
        flac24bit: {
          hash: song.sqhash || song.hash,
          bitrate: 2304000,
        },
      };

      return {
        id: song.hash,
        title: title || song.songname || "未知歌曲",
        artist: artist || song.singername || "未知歌手",
        album: song.album_name || "",
        album_id: song.album_id,
        album_audio_id: song.album_audio_id,
        artwork: artwork,
        duration: song.duration,
        "320hash": song["320hash"],
        sqhash: song.sqhash,
        origin_hash: song.origin_hash,
        qualities: qualities,
      };
    });

    const total = data.total || 0;
    const isEnd = page * pageSize >= total;

    return {
      isEnd: isEnd,
      musicList: musicList,
    };
  } catch (error) {
    return {
      isEnd: true,
      musicList: [],
    };
  }
}

async function getMusicInfoRaw(hash) {
  try {
    const data = {
      area_code: "1",
      show_privilege: 1,
      show_album_info: "1",
      is_publish: "",
      appid: 1005,
      clientver: 11451,
      mid: "1",
      dfid: "-",
      clienttime: Date.now(),
      key: "OIlwieks28dk2k092lksi2UIkp",
      fields:
        "album_info,author_name,audio_info,ori_audio_name,base,songname,classification",
      data: [{ hash }],
    };

    const res = await axios_1.default.post(
      "http://gateway.kugou.com/v3/album_audio/audio",
      data,
      {
        headers: {
          "KG-THash": "13a3164",
          "KG-RC": "1",
          "KG-Fake": "0",
          "KG-RF": "00869891",
          "User-Agent":
            "Android712-AndroidPhone-11451-376-0-FeeCacheUpdate-wifi",
          "x-router": "kmr.service.kugou.com",
        },
      },
    );

    if (res.data && res.data.data && res.data.data.length > 0) {
      return res.data.data[0][0];
    }

    return null;
  } catch (error) {
    return null;
  }
}

async function getMusicComments(musicItem, page = 1) {
  const pageSize = 20;
  const timestamp = Date.now();
  const hash = musicItem.id || musicItem.hash;

  try {
    const musicInfo = await getMusicInfoRaw(hash);
    const res_id = musicInfo?.classification?.[0]?.res_id;

    if (!res_id) {
      return { isEnd: true, data: [] };
    }

    const params =
      `appid=1005&clienttime=${timestamp}&clienttoken=0&clientver=11409&` +
      `code=fc4be23b4e972707f36b8a828a93ba8a&dfid=0&extdata=${hash}&kugouid=0&` +
      `mid=16249512204336365674023395779019&mixsongid=${res_id}&p=${page}&pagesize=${pageSize}&` +
      `uuid=0&ver=10`;

    const signature = signatureParams(params, "android");
    const url = `http://m.comment.service.kugou.com/r/v1/rank/newest?${params}&signature=${signature}`;

    const res = await axios_1.default.get(url, {
      headers: {
        accept: "application/json",
        "user-agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/106.0.0.0 Safari/537.36",
      },
      timeout: 15000,
    });

    if (res.status !== 200 || !res.data || !res.data.list) {
      return { isEnd: true, data: [] };
    }

    const comments = (res.data.list || []).map((item) => {
      let timestamp = null;
      if (item.addtime) {
        try {
          timestamp = new Date(item.addtime).getTime();
        } catch (e) {
          timestamp = null;
        }
      }

      return {
        id: item.id?.toString() || "",
        nickName: item.user_name || "",
        avatar: item.user_pic || "",
        comment: item.content || "",
        like: item.like?.likenum || 0,
        createAt: timestamp,
        location: item.location || "",
        replies: [],
      };
    });

    const isEnd = !res.data.list || res.data.list.length < pageSize;

    return {
      isEnd: isEnd,
      data: comments,
    };
  } catch (error) {
    return { isEnd: true, data: [] };
  }
}

module.exports = {
  platform: "酷狗音乐" + (IS_PAID ? IS_PAID : ""),
  version: VERSION,
  author: "时迁酱",
  appVersion: ">0.1.0-alpha.0",
  srcUrl: UPDATE_URL,
  cacheControl: "no-cache",
  supportedQualities: SUPPORTED_QUALITIES,
  primaryKey: ["id", "album_id", "album_audio_id"],
  hints: {
    importMusicSheet: [
      "仅支持酷狗APP通过酷狗码导入，输入纯数字酷狗码即可。",
      "导入时间和歌单大小有关，请耐心等待",
      "播放需要有效的API密钥，请在设置中配置",
    ],
    config: [
      "请先在插件设置中配置API密钥，否则无法播放音乐",
      "API密钥需从官方渠道获取",
    ],
  },
  supportedSearchType: ["music", "album", "sheet", "artist", "lyric"],

  async search(query, page, type) {
    if (type === "music") {
      return await searchMusic(query, page);
    } else if (type === "album") {
      return await searchAlbum(query, page);
    } else if (type === "sheet") {
      return await searchMusicSheet(query, page);
    } else if (type === "artist") {
      return await searchArtist(query, page);
    } else if (type === "lyric") {
      return await searchLyric(query, page);
    }
  },

  getMediaSource,
  getMusicInfo,
  getTopLists,
  getLyric,
  getTopListDetail,
  getAlbumInfo,
  getArtistWorks,
  importMusicSheet,
  getMusicSheetInfo,
  getRecommendSheetTags,
  getRecommendSheetsByTag,
  getMusicComments,
};
