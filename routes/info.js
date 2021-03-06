const express = require('express'),
  router = express.Router(),
  infoHandler = require('../handlers/infoHandler');
router.post('/backendId/:domainType/:serverIp', infoHandler.fetchBackendId);
router.get('/domain/:domainType/:siteName', infoHandler.fetchDomains);
router.get('/valid-domain/:client/:domainType/:whitelabelName', infoHandler.getValidDomain);
router.post('/valid-domain/:client/:domainType', infoHandler.updateValidDomains);
router.get('/server/:domainType/:siteName', infoHandler.fetchServers);
router.get('/folder', infoHandler.fetchFolderPath);
router.get('/mobile/', infoHandler.fetchMobileJson);
router.get('/server/', infoHandler.getServerInfo);
router.get('/', (_, res) => res.send('info root page'));
module.exports = router;
