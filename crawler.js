let rp = require('request-promise'),
  cheerio = require('cheerio'),
  cfg = require('./config.js'),
  Utils = require('./Utils.js'),
  Message = null,
  authenticatedCookies = '',
  socket = null,
  socketMethod = null,
  newConsole = (function (originalConsole) {
    return {
      log: function (text) {
        originalConsole.log(text);
        // Your code
        if (socket && socketMethod) {
          originalConsole.log(socketMethod);
          //originalConsole.log(socket);
          socket.emit(socketMethod, text);
        }
      },
      info: function (text) {
        originalConsole.info(text);
        // Your code
      },
      warn: function (text) {
        originalConsole.warn(text);
        // Your code
      },
      error: function (text) {
        originalConsole.error(text);
        // Your code
      },
    };
  })(console),
  log = newConsole.log;

function setSocket(socketClient) {
  socket = socketClient;
}

function setSocketMethod(methodName) {
  socketMethod = methodName;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function createJar(cookies, rp, url) {
  let jar = rp.jar();
  cookies.forEach((e, i) => {
    e.split(';').forEach((cookie) => {
      //log(cookie);
      if (cookie.indexOf('HttpOnly,') > -1)
        cookie = cookie.substr(10, cookie.length);
      jar.setCookie(rp.cookie(cookie.trim()), url);
    });
  });
  return jar;
}

async function login(username, password, hostBorderPx1, domainType) {
  log(`|==> Login: ${hostBorderPx1}`);
  //log(username);
  //log(password);
  try {
    //log('getPKey(): %s', getPKey());
    Message = Utils.Http.Message({ pemKey: cfg.pKey, domainType: domainType });
    let encryptedForm = Message.encryptParams({
      username: username,
      password: password,
    });
    //log(encryptedForm)
    cfg.hostBorderPx1 = hostBorderPx1;
    let options = {
      method: 'POST',
      url: cfg.hostBorderPx1 + cfg.loginPath,
      headers: cfg.headers,
      form: encryptedForm,
      resolveWithFullResponse: true,
      transform: (body, res) => {
        return {
          body,
          headers: res.headers,
        };
      },
    };
    let res = await rp(options);

    log(res.body);
    //log(res.headers);
    let body = JSON.parse(res.body);
    if (body.ErrCode === 0) {
      let cookies = res.headers['set-cookie'];
      //log(await Utils.File.saveTextFile(__dirname + cfg.fileCookies, cookies));
      //log(cookies)
      return { success: true, cookie: cookies };
    }
    return { success: false, message: body.ErrText };
  } catch (error) {
    return { success: false, message: error.message };
  }
}

async function isAuthenticatedCookies(authenticatedCookie, domainType) {
  log('|==> Authenticate cookies');
  // cookies is in memory
  try {
    let url =
      (domainType === 'ip'
        ? global.hostBorderPx1Ip
        : global.hostBorderPx1Name) + cfg.adminPath;
    log(`|==> Send authentication request: ${url}`);
    let options = {
      method: 'GET',
      url: url,
      headers: cfg.headers,
      // note : use loginUrl will fetch
      jar: createJar(authenticatedCookie, rp, url),
      resolveWithFullResponse: true,
      transform: (body, res) => {
        return {
          body: body,
          headers: res.headers,
        };
      },
    };
    //log(options);
    let res = await rp(options);
    log(res.headers);
    //await Utils.File.saveTextFile('admin' + new Date().getTime() + '.html', res.body)
    let isAuthenticated =
      cheerio.load(res.body)('#container-admin-account').attr('data-name') ===
      'admin-account';
    log(`|==> Authencitated: ${isAuthenticated}`);
    return isAuthenticated;
  } catch (error) {
    log(error);
    return false;
  }
}

// common method to skip validation cookies for three fetching functions
async function skipValidationCookies(isSkippedValidationCookies) {
  if (!isSkippedValidationCookies) {
    if (!(await isAuthenticatedCookies())) {
      log('|==> Cookie is expried');
      authenticatedCookies = await login();
    } else {
      log('|==> Cookie is available. Use AES key');
      Message = Utils.Http.Message();
      await sleep(1000);
    }
  } else {
    log(
      '|==> Skip Authentication Cookie (Ensure cookies is available). Use AES key'
    );
    Message = Utils.Http.Message();
    await sleep(1000);
  }
}
/**
 *
 * @param {*} nameWhiteLabel hanaha
 * @param {*} siteData [{ID:123, Host:"hanaha.bpx"},{}....]
 * @param {*} type [mo: mobile , mb : membersite, ag: agent site]
 */
function getSiteId(nameWhiteLabel, siteData, type) {
  let sites = siteData;
  let siteId = 0,
    siteName = '';
  switch (type) {
    case 'ag':
      siteName = type + '.' + nameWhiteLabel + '.bpx';
      break;
    case 'mb':
      siteName = nameWhiteLabel + '.bpx';
      break;
    case 'mo':
      siteName = 'mobile.' + nameWhiteLabel + '.bpx';
      break;
  }
  for (var site of sites) {
    if (site.Host === siteName) {
      siteId = site.ID;
      break;
    }
  }
  return siteId;
}

function decrypt(body) {
  let json = JSON.parse(body);
  try {
    var result = JSON.parse(json.Result);
    //log(`result.Data: {%s}`| result.IV: {%s}`, result.Data, result.IV)
    var plainText = Message.Decrypt(result.Data, result.IV);
    try {
      json.Result = JSON.parse(plainText);
    } catch (e) {
      json.Result = plainText;
    }
    //log(`Result: {%s}`, json.Result)
  } catch (e) {
    log(e);
  }
  return json.Result;
}

/**
 *
 * @param {*} url
 * @param {*} nameWhiteLabel hanaha -> fetch one, "" -> fetch all
 * @param {*} isSkippedValidationCookies
 */
async function fetchSites(nameWhiteLabel, authenticatedCookie, domainType) {
  try {
    Message = Utils.Http.Message({ domainType });
    //await sleep(1000);
    let url =
      (domainType === 'ip'
        ? global.hostBorderPx1Ip
        : global.hostBorderPx1Name) + cfg.listWLSitePath;
    log(`|==> Fetch Sites: ${url}`);
    let data = {
      CNAMEID: 0,
      group: '0',
      keyword: nameWhiteLabel,
      pageNum: 1,
      pageSize: 1000,
      proxyID: 0,
    };
    let options = {
      method: 'POST',
      url: url,
      headers: cfg.headers,
      form: Message.encryptParams(data),
      jar: createJar(authenticatedCookie, rp, url),
      transform: (body, res) => {
        return {
          body: body,
          headers: res.headers,
        };
      },
    };
    //log(options);
    let res = await rp(options);
    //log(`body:{%s}`, res.body)
    //log(res.headers)
    let sites = decrypt(res.body).Sites;
    log(`sites.length = ${sites.length}`);
    //log(JSON.stringify(sites))
    return { success: true, sites: sites };
  } catch (error) {
    return { success: false, message: error.message };
  }
}
async function fetchDomainsBySiteId(siteId, authenticatedCookie, domainType) {
  try {
    Message = Utils.Http.Message({ domainType });
    let data = {
      siteId: siteId,
    };
    let url =
      (domainType === 'ip'
        ? global.hostBorderPx1Ip
        : global.hostBorderPx1Name) + cfg.listWLDomainPath;
    log(`|==> Fetch Domains: ${url}`);
    let options = {
      method: 'POST',
      url: url,
      headers: cfg.headers,
      form: Message.encryptParams(data),
      jar: createJar(authenticatedCookie, rp, url),
      resolveWithFullResponse: true,
      transform: (body, res) => {
        return {
          body: body,
          headers: res.headers,
        };
      },
    };
    let res = await rp(options);
    //log(res.body);
    let domains = decrypt(res.body);
    log(`domains.length = ${domains.length}`);
    //log(domains)
    return { success: true, domains: domains };
  } catch (error) {
    //log(error);
    return { success: false, message: error.message };
  }
}

async function fetchServerBySiteId(siteId, authenticatedCookie, domainType) {
  Message = Utils.Http.Message({ domainType });
  let data = {
    siteId: siteId,
  };
  let url =
    (domainType === 'ip' ? global.hostBorderPx1Ip : global.hostBorderPx1Name) +
    cfg.listWLServerBySitePath;
  log(`|==> Fetch Site Addrs: ${url}`);
  let options = {
    method: 'POST',
    url: url,
    headers: cfg.headers,
    form: Message.encryptParams(data),
    jar: createJar(authenticatedCookie, rp, url),
    resolveWithFullResponse: true,
    transform: (body, res) => {
      return {
        body: body,
        headers: res.headers,
      };
    },
  };
  let res = await rp(options);
  let servers = decrypt(res.body);
  log(`servers.length = ${servers.length}`);
  return { success: true, servers: servers };
}

async function fetchAllServers(isSkippedValidationCookies) {
  await skipValidationCookies(isSkippedValidationCookies);
  // let data = {
  //     siteId: siteId
  // }
  let url = cfg.listWLServerUrl;
  log(`|==> Fetch Site Addrs: ${url}`);
  let options = {
    method: 'POST',
    url: url,
    headers: cfg.headers,
    form: Message.encryptParams(undefined),
    jar: createJar(authenticatedCookies, rp, url),
    resolveWithFullResponse: true,
    transform: (body, res) => {
      return {
        body: body,
        headers: res.headers,
      };
    },
  };
  let res = await rp(options);
  let servers = decrypt(res.body);
  log(`servers.length = ${servers.length}`);
  //log(servers)
  return servers;
}

//http://prntscr.com/pngy17
async function fetchBackendId(serverId, authenticatedCookie, domainType) {
  // cookie is available, use ase file
  Message = Utils.Http.Message({ domainType });
  //await sleep(1000);
  let data = {
    backend_id: +serverId,
  };
  let url =
    (domainType === 'ip' ? global.hostBorderPx1Ip : global.hostBorderPx1Name) +
    cfg.backendIdPath;
  log(`|==> Fetch BackendId: ${url}`);
  let options = {
    method: 'POST',
    url: url,
    headers: cfg.headers,
    form: Message.encryptParams(data),
    jar: createJar(authenticatedCookie, rp, url),
    resolveWithFullResponse: true,
    transform: (body, res) => {
      return {
        body: body,
        headers: res.headers,
      };
    },
  };
  let res = await rp(options);
  let bpxBackendId = decrypt(res.body);
  log(`bpxBackendId = ${bpxBackendId}`);
  return { success: true, backendId: bpxBackendId };
}
async function fetchAllWhiteLabelsName(isSkippedValidationCookies) {
  await skipValidationCookies(isSkippedValidationCookies);
  let url = cfg.listWhiteLabelsName;
  log(`|==> Fetch WL Names: ${url}`);
  let options = {
    method: 'POST',
    dataType: 'json',
    url: url,
    headers: cfg.headers,
    form: Message.encryptParams(undefined),
    jar: createJar(authenticatedCookies, rp, url),
    resolveWithFullResponse: true,
    transform: (body, res) => {
      return {
        body: body,
        headers: res.headers,
      };
    },
  };
  //log(options)
  let res = await rp(options);
  //log(res.headers)
  //log(res.body)
  let listWhiteLabelsName = decrypt(res.body);
  log(`listWhiteLabelsName.length = ${listWhiteLabelsName.length}`);
  log(listWhiteLabelsName);
  return listWhiteLabelsName;
}
function setPKey(key) {
  cfg.pKey = key;
}
module.exports = {
  fetchSites: fetchSites,
  fetchDomainsBySiteId: fetchDomainsBySiteId,
  //fetchServerBySiteId: fetchServerBySiteId,
  //fetchAllServers: fetchAllServers,
  //fetchAllWhiteLabelsName: fetchAllWhiteLabelsName,
  //setSocketMethod: setSocketMethod,
  //setSocket: setSocket,
  //getSiteId: getSiteId,
  fetchBackendId: fetchBackendId,
  login: login,
  isAuthenticatedCookies: isAuthenticatedCookies,
  cfg: cfg,
  setPKey: setPKey,
  fetchServerBySiteId: fetchServerBySiteId,
};
