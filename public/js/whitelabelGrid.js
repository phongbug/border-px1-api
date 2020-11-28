﻿// Global Data
let serverStores = {
    '101-102-103': [['10.168.106.101'], ['10.168.106.102'], ['10.168.106.103']],
    '106-107-108': [['10.168.106.106'], ['10.168.106.107'], ['10.168.106.108']],
    '110-114-115': [['10.168.106.110'], ['10.168.106.114'], ['10.168.106.115']],
    '111-112-113': [['10.168.106.111'], ['10.168.106.112'], ['10.168.106.113']],
    '116-117-118': [['10.168.106.116'], ['10.168.106.117'], ['10.168.106.118']],
    '119-120-121': [['10.168.106.119'], ['10.168.106.120'], ['10.168.106.121']],
    '122-123-124': [['10.168.106.122'], ['10.168.106.123'], ['10.168.106.124']],
    '125-126-105': [['10.168.106.125'], ['10.168.106.126'], ['10.168.106.105']],
    '167-168-169': [['10.168.106.167'], ['10.168.106.168'], ['10.168.106.169']],
    '170-171-172': [['10.168.106.170'], ['10.168.106.171'], ['10.168.106.172']],
    '173-174-175': [['10.168.106.173'], ['10.168.106.174'], ['10.168.106.175']],
    '177-178-179': [['10.168.106.177'], ['10.168.106.178'], ['10.168.106.179']],
    '67-68-69': [['10.168.106.67'], ['10.168.106.68'], ['10.168.106.69']],
    '70-80-90': [['10.168.106.70'], ['10.168.106.80'], ['10.168.106.90']],
    '72-73-74': [['10.168.106.72'], ['10.168.106.73'], ['10.168.106.74']],
    '76-85-89': [['10.168.106.76'], ['10.168.106.85'], ['10.168.106.89']],
    '77-78-79': [['10.168.106.77'], ['10.168.106.78'], ['10.168.106.79']],
    '82-83-84': [['10.168.106.82'], ['10.168.106.83'], ['10.168.106.84']],
    '92-96-104': [['10.168.106.92'], ['10.168.106.96'], ['10.168.106.104']],
  },
  selectedServerGroupStore = Ext.create('Ext.data.ArrayStore', {
    fields: ['name'],
    data: [[]],
  }),
  sortAndToList = (array) => {
    let strWLs = array
      .map((record) => record.name)
      .sort()
      .toString();
    console.log(strWLs);
    return strWLs.split(',').map((e) => [e, e]);
  };
// Global Variables
let Groups,
  data = [],
  listNameWLs = [],
  cellClickCount = 1,
  featureGrouping = Ext.create('Ext.grid.feature.GroupingSummary', {
    startCollapsed: true,
    showSummaryRow: false,
    groupHeaderTpl: [
      '<div style="color:#d14836; font-weight: bold">{name:this.formatName}<span style="color:green; font-weight: normal"> ({rows.length} {[values.rows.length > 1 ? "White Labels" : "White Label"]})</span></div>',
      {
        formatName: (name) => {
          for (let i = 0; i < Groups.items.length; i++) {
            if (name.toString() === Groups.items[i]._groupKey.toString()) {
              switch (name) {
                case '177-178-179':
                  name = name + ' [Meta Service]';
                  break;
                case '109-109-109':
                  name = name + ' [Cache Service]';
                  break;
                case '10.168.109.6':
                  name = name + ' [Test Server]';
                  break;
                //case "77-78-79":
                case '110-114-115':
                  name = name + ' [Failed CMD(D)]';
                  break;
                case '116-117-118':
                  name = name + ' [Failed Touchcan]';
                  break;
                case '119-120-121':
                case '173-174-175':
                  name = name + ' [Failed Touchcan & CMD]';
                  break;
                case '67-68-69':
                case '92-96-104':
                  name = name + ' [Failed CMD(B)]';
                  break;
              }
              return (
                '<span style="color:green">[' + (i + 1) + ']</span> ' + name
              );
            }
          }
        },
      },
    ],
  });
Ext.onReady(function () {
  // prevent browser call loadScript('js/gridWL.js') at console log
  if (!isAuthenticated()) return;
  Ext.tip.QuickTipManager.init();
  Ext.define('WL', {
    extend: 'Ext.data.Model',
    fields: [
      'name',
      'compType',
      'prefix',
      'defaultNumber',
      'headerNumber',
      'referredWL',
      'mainColor',
      'servers',
      'hasTogel',
      'closedPlaytech',
      'closedMail',
      'referralFunction',
      'oldNames',
      'mobileRedirect',
      'dynamicFooter',
      'securityQuestion',
    ],
  });
  var storeWLs = Ext.create('Ext.data.Store', {
    model: 'WL',
    proxy: {
      type: 'ajax',
      url: 'WLs.json',
      reader: {
        type: 'json',
      },
    },
    listeners: {
      load: function (_, records, successful, operation, eOpts) {
        let whiteLabels = records[0].data;
        delete whiteLabels['id'];
        for (var whitelabelName in whiteLabels) {
          let record = whiteLabels[whitelabelName];
          record['name'] = whitelabelName;
          if (!record['servers']) record['servers'] = '10.168.109.6';
          if (!record['status']) record['status'] = 'live';
          record['isResponsive'] = record['isResponsive']
            ? 'Responsive'
            : 'Non-Responsive';
          if (record['servers']) {
            let servers = record['servers'];
            record['specificServer'] =
              servers !== '10.168.109.6'
                ? servers
                  ? '10.168.106.' + servers.split('-')[0]
                  : undefined
                : servers;
          }
          // icon spniner cols
          record['specificServerSpinner'] = false;
          record['remoteDesktopSpinner'] = false;
          data.push(record);
        }
        Groups = storeWLs.getGroups();
        log(Groups);
        storeWLs.loadData(data);
        listNameWLs = sortAndToList(data);
        Ext.getCmp('txtNameWLs').getStore().loadData(listNameWLs);
      },
    },
    autoLoad: true,
  });

  var girdWLs = Ext.create('Ext.grid.Panel', {
    renderTo: 'app',
    store: storeWLs,
    width: Ext.getBody().getViewSize().width,
    height: Ext.getBody().getViewSize().height,
    title: 'Summary LIGA White Labels',
    plugins: ['gridfilters', 'cellediting'],
    // Can not open href
    plugins: [
      {
        ptype: 'cellediting',
        clicksToEdit: 1,
      },
    ],
    //selModel: 'cellmodel',
    features: [
      //{ ftype: 'grouping' },
      featureGrouping,
    ],
    listeners: {
      beforeedit: function (editor, context) {
        selectedServerGroupStore.loadData(
          serverStores[context.record.get('servers')]
        );
        //log(context.value);
        //log(selectedServerGroupStore.getData());
      },
      cellclick: (gridview, td, cellIndex, record, tr, rowIndex, e, eOpts) => {
        if (cellIndex === 0) {
          if (cellClickCount === 1) {
            cellClickCount = 2;
            Ext.getCmp('txtStartIndex').setValue(td.innerText);
          } else {
            cellClickCount = 1;
            Ext.getCmp('txtEndIndex').setValue(td.innerText);
          }
        } else if (cellIndex < 13) {
          let domainGrid = Ext.getCmp('domainGrid'),
            domainStore = domainGrid.getStore(),
            siteType = Ext.getCmp('cbbSiteType').getRawValue();

          switch (siteType) {
            case 'Mobile':
              siteType = 'mo';
              break;
            case 'Member':
              siteType = '';
              break;
            case 'Agent':
              siteType = 'ag';
              break;
          }
          let whiteLabelName = record.get('name');
          let siteName = siteType + whiteLabelName.toLowerCase() + '.bpx';
          domainGrid.show();
          domainGrid.setTitle('All domains of ' + whiteLabelName);
          domainStore.loadData([]);
          let proxy = domainStore.getProxy();
          // proxy.extraParams = {
          //   'border-px1-cookie': localStorage.getItem('border-px1-cookie'),
          // };
          proxy.setConfig('url', [
            borderPx1ApiHost + '/info/domain/' + siteName,
          ]);
          // show loadMask purpose
          domainStore.load();
        }
      },
      viewready: (grid) => {
        loadScript('js/authForm.js?v=4');
        loadScript('js/domainGrid.js');
      },
    },
    tbar: [
      {
        xtype: 'combo',
        width: 65,
        store: new Ext.data.ArrayStore({
          fields: ['id', 'name'],
          data: [
            ['https', 'https'],
            ['http', 'http'],
          ],
        }),
        displayField: 'name',
        valueField: 'id',
        name: 'cbbProtocol',
        id: 'cbbProtocol',
        value: 'https',
        editable: false,
        listeners: {
          change: (_, val) => Ext.getCmp('btnRefresh').fireEvent('click'),
        },
      },
      {
        xtype: 'combo',
        width: 90,
        store: new Ext.data.ArrayStore({
          fields: ['id', 'name'],
          data: [
            ['mobile.', 'Mobile'],
            ['member', 'Member'],
            ['ag.', 'Agent'],
          ],
        }),
        displayField: 'name',
        valueField: 'id',
        name: 'cbbSiteType',
        id: 'cbbSiteType',
        value: 'member',
        editable: false,
        listeners: {
          change: (_, val) => Ext.getCmp('btnRefresh').fireEvent('click'),
        },
      },
      {
        xtype: 'button',
        id: 'btnRefresh',
        icon:
          'https://icons.iconarchive.com/icons/graphicloads/100-flat/16/reload-icon.png',
        text: 'Refresh',
        // other component can not fireEvent to
        // handler: () => { storeWLs.clearFilter(); storeWLs.loadData(data) },
        listeners: {
          click: () => {
            storeWLs.clearFilter();
            storeWLs.loadData(data);
          },
        },
      },
      {
        xtype: 'combo',
        width: 120,
        store: new Ext.data.ArrayStore({
          fields: ['id', 'name'],
          data: [
            ['default', 'Select Group'],
            ['servers', 'Server'],
            ['mainColor', 'Color'],
            ['referredWL', 'Referred WL'],
            ['status', 'Status'],
            ['isResponsive', 'Responsive'],
            ['closedMail', 'Closed Mail'],
            ['referralFunction', 'Referral Function'],
            ['mobileRedirect', 'Mobile Redirect'],
            ['dynamicFooter', 'Dynamic Footer'],
            ['securityQuestion', 'Security Question'],
          ],
        }),
        queryMode: 'local',
        displayField: 'name',
        valueField: 'id',
        name: 'cbbGrouping',
        id: 'cbbGrouping',
        value: 'default',
        editable: false,
        listeners: {
          change: (_, val) => {
            if (val !== 'default') {
              storeWLs.setGroupField(val);
              Groups = storeWLs.getGroups();
              log('Group By: %s', val);
              for (let i = 0; i < Groups.getCount(); i++) {
                let group = Groups.getAt(i),
                  groupKey = Groups.getAt(i)._groupKey,
                  list = [];
                log('%s: ', groupKey);
                for (let j = 0; j < group.getCount(); j++) {
                  let whiteLabelName = group.getAt(j).getData().name;
                  list.push(whiteLabelName);
                }
                log(list.toString());
              }
              storeWLs.loadData(data);
              featureGrouping.collapseAll();
            } else storeWLs.setGroupField(undefined);
          },
        },
      },
      {
        xtype: 'combo',
        width: 150,
        store: new Ext.data.ArrayStore({
          fields: ['id', 'name'],
          data: listNameWLs,
        }),
        displayField: 'name',
        valueField: 'id',
        queryMode: 'local',
        value: '',
        id: 'txtNameWLs',
        itemId: 'txtNameWLs',
        multiSelect: true,
        enableKeyEvents: true,
        doQuery: function (queryString, forceAll) {
          this.expand();
          this.store.clearFilter(!forceAll);

          if (!forceAll) {
            this.store.filter(
              this.displayField,
              new RegExp(Ext.String.escapeRegex(queryString), 'i')
            );
          }
        },
        listeners: {
          keypress: function (cb, e) {
            console.log(cb.getRawValue());
            storeWLs.filter('name', cb.getRawValue());
          },
        },
      },
      {
        xtype: 'button',
        text: 'Find',
        id: 'btnFind',
        icon:
          'https://icons.iconarchive.com/icons/zerode/plump/16/Search-icon.png',
        handler: () =>
          storeWLs.getFilters().add({
            property: 'name',
            value: Ext.getCmp('txtNameWLs')
              .getRawValue()
              .split(',')
              .map((e) => e.trim().toUpperCase()),
            operator: 'in',
          }),
      },
      {
        xtype: 'button',
        text: 'Start RD Service',
        icon:
          'https://icons.iconarchive.com/icons/oxygen-icons.org/oxygen/16/Actions-system-run-icon.png',
        handler: () =>
          Ext.Ajax.request({
            method: 'GET',
            url:
              window.location.href.substr(0, window.location.href.length - 13) +
              '/Public/GetDateModifiedOfFiles.aspx?cmd=StartRDService',
            //url: 'http://localhost:19459/Public/GetDateModifiedOfFiles.aspx?cmd=StartRDService',
            success: function (response) {
              log(response);
            },
            failure: function (response) {
              log(response);
            },
          }),
        disabled: true,
        hidden: true,
      },
      {
        xtype: 'combo',
        width: 115,
        store: new Ext.data.ArrayStore({
          fields: ['id', 'name'],
          data: [
            ['default', 'Select Col'],
            ['Robots.txt', 'Robots.txt'],
            ['defaultDomain', 'Default.aspx'],
            ['Main.aspx', 'Main.aspx'],
            ['_Bet/Panel.aspx', 'Panel.aspx'],
            ['Google.html', 'Google.html'],
            ['Sitemap.xml', 'Sitemap.xml'],
            ['Header.aspx', 'Header.aspx'],
            ['_View/Register.aspx', 'Register.aspx'],
            ['_View/Odds4.aspx', 'Odd4.aspx'],
            ['_View/Odds10.aspx', 'Odd10.aspx'],
            ['public/temp.aspx', 'temp.aspx'],
          ],
        }),
        displayField: 'name',
        valueField: 'id',
        name: 'cbbColumn',
        id: 'cbbColumn',
        value: 'default',
        editable: false,
      },
      {
        xtype: 'numberfield',
        id: 'txtStartIndex',
        value: 0,
        width: 30,
        hideTrigger: true,
        listeners: {
          focus: function (tf, e) {
            tf.setValue('');
          },
        },
      },
      {
        xtype: 'numberfield',
        width: 40,
        id: 'txtEndIndex',
        value: 0,
        hideTrigger: true,
        maxValue: 165,
        minValue: 0,
        listeners: {
          focus: function (tf, e) {
            tf.setValue('');
          },
        },
      },
      {
        xtype: 'button',
        text: 'Open new tabs',
        icon:
          'https://icons.iconarchive.com/icons/icons8/windows-8/16/Programming-External-Link-icon.png',
        handler: () => {
          let startIndex = +Ext.getCmp('txtStartIndex').getValue() - 1,
            endIndex = +Ext.getCmp('txtEndIndex').getValue() - 1;
          for (let i = startIndex; i <= endIndex; i++) {
            let record = storeWLs.getAt(i),
              defaultDomain = record.get('defaultDomain') || undefined,
              name = record.get('name'),
              siteType = Ext.getCmp('cbbSiteType').getValue();
            if (!defaultDomain) defaultDomain = name + '.com';
            defaultDomain =
              siteType === 'member' ? defaultDomain : siteType + defaultDomain;
            let url =
                Ext.getCmp('cbbProtocol').getValue() +
                '://' +
                defaultDomain +
                '/',
              columnName = Ext.getCmp('cbbColumn').getValue();

            switch (columnName) {
              case 'default':
              case 'defaultDomain':
                break;
              default:
                url += columnName;
                break;
            }
            window.open(url, '_blank');
          }
        },
      },
      {
        xtype: 'button',
        id: 'btnOpenAuthForm',
        text: 'Open Auth Form',
        dock: 'right',
        listeners: {
          click: () => authForm.setHidden(false),
        },
      },
      '->',
      {
        xtype: 'button',
        id: 'btnLogout',
        icon:
          'https://icons.iconarchive.com/icons/saki/nuoveXT-2/16/Apps-session-logout-icon.png',
        text: 'Logout',
        dock: 'right',
        listeners: {
          click: () => {
            localStorage.removeItem('token');
            location.reload();
          },
        },
      },
    ],
    columns: [
      new Ext.grid.RowNumberer({ dataIndex: 'no', text: 'No.', width: 60 }),
      {
        text: 'Name',
        width: 180,
        dataIndex: 'name',
        renderer: (val, _, record) => {
          let defaultDomain = record.get('defaultDomain'),
            dynamicFooter = record.get('dynamicFooter') ? '🦶' : '',
            mobileRedirect = !record.get('mobileRedirect') ? '📵' : '',
            securityQuestion = record.get('securityQuestion') ? '🔒' : '',
            status = record.get('status'),
            protocol = Ext.getCmp('cbbProtocol').getValue(),
            siteType = Ext.getCmp('cbbSiteType').getValue();
          if (!defaultDomain) defaultDomain = val + '.com';
          defaultDomain =
            siteType === 'member' ? defaultDomain : siteType + defaultDomain;
          if (status === 'testing') {
            defaultDomain =
              val +
              (siteType === 'member' ? 'main.' : siteType) +
              'playliga.com';
            protocol = 'http';
          }
          let oldNames = '';
          // reverse oldNames - must use slice(0) to overwirte memory array oldNames in Ext Store
          for (let name of record.get('oldNames').slice(0).reverse())
            oldNames +=
              '<del style="color:#fb4848; font-style:italic">' +
              name +
              '</del><br/>';
          //log('defaultDomain: %s', defaultDomain);
          return (
            Ext.String.format(
              '<a target="_blank" href="{0}://{1}">{2}</a> {3} {4} {5} {6}<br />',
              protocol,
              defaultDomain.toLowerCase(),
              val,
              mobileRedirect,
              dynamicFooter,
              securityQuestion
            ) + oldNames
          );
        },
      },
      {
        text: 'CT',
        width: 50,
        dataIndex: 'compType',
        tooltip: 'Comptype',
      },
      {
        text: 'Prefix',
        width: 90,
        dataIndex: 'prefix',
        hidden: true,
      },

      {
        text: 'Status',
        width: 80,
        dataIndex: 'status',
        hidden: true,
      },
      {
        text: 'panel',
        width: 150,
        dataIndex: 'defaultDomain',
        hidden: true,
        renderer: (v, _, r) =>
          Ext.String.format(
            '<a target="_blank" href="https://{0}">{0}</a>',
            v ? v : r.get('name').toLowerCase() + '.com' + '/_Bet/Panel.aspx'
          ),
      },
      {
        text: 'Robots',
        width: 150,
        dataIndex: 'defaultDomain',
        hidden: true,
        renderer: (v, _, r) =>
          Ext.String.format(
            '<a target="_blank" href="https://{0}">{0}</a>',
            (v ? v : r.get('name').toLowerCase() + '.com') + '/robots.txt'
          ),
      },
      {
        text: 'Sitemap',
        width: 150,
        dataIndex: 'defaultDomain',
        hidden: true,
        renderer: (v, _, r) =>
          Ext.String.format(
            '<a target="_blank" href="https://{0}">{0}</a>',
            v ? v : r.get('name').toLowerCase() + '.com' + '/sitemap.xml'
          ),
      },
      {
        text: 'Google',
        width: 150,
        dataIndex: 'defaultDomain',
        hidden: true,
        renderer: (v, _, r) =>
          Ext.String.format(
            '<a target="_blank" href="https://{0}">{0}</a>',
            v
              ? v
              : r.get('name').toLowerCase() +
                  '.com' +
                  '/googleae669996542f22e8.html'
          ),
      },
      {
        text: 'referredWL',
        width: 150,
        dataIndex: 'referredWL',
        hidden: true,
      },
      {
        text: 'mainColor',
        width: 150,
        dataIndex: 'mainColor',
        hidden: true,
      },
      {
        text: 'Servers',
        width: 120,
        dataIndex: 'servers',
      },
      {
        text: 'H/D Number',
        width: 100,
        dataIndex: 'headerNumber',
        tooltip: 'Header/Default number',
        renderer: (val, _, record) => val + '/' + record.get('defaultNumber'),
        hidden: false,
      },
      {
        text: 'Specific Server',
        width: 130,
        dataIndex: 'specificServer',
        editor: {
          xtype: 'combo',
          store: selectedServerGroupStore,
          //serverStores['101-102-103'],
          displayField: 'name',
          valueField: 'name',
          queryMode: 'local',
        },
      },
      {
        xtype: 'actioncolumn',
        width: 30,
        tooltip: 'Open link by specific server',
        text: 'O',
        items: [
          {
            iconCls: 'openLink',
            getClass: function (value, meta, record, rowIndex, colIndex) {
              var isSpinning = record.get('specificServerSpinner');
              return isSpinning ? 'spinner' : 'openLink';
            },
            handler: function (grid, rowIndex, colIndex, item, e, record) {
              rowIndex = grid.getStore().indexOf(record);
              record = grid.getStore().getAt(rowIndex);
              var ip = record.get('specificServer');
              record.set('specificServerSpinner', true);
              Ext.Ajax.request({
                method: 'POST',
                url: borderPx1ApiHost + '/info/backendId/' + ip,
                // params: {
                //   'border-px1-cookie': localStorage.getItem(
                //     'border-px1-cookie'
                //   ),
                // },
                cors: true,
                useDefaultXhrHeader: false,
                withCredentials: true,
                success: function (response) {
                  //log(response);
                  record.set('specificServerSpinner', false);
                  let result = JSON.parse(response.responseText);
                  if (result.success) {
                    let defaultDomain = record.get('defaultDomain'),
                      whiteLabelName = record.get('name'),
                      status = record.get('status'),
                      protocol = Ext.getCmp('cbbProtocol').getValue(),
                      backendId = result.backendId,
                      siteType = Ext.getCmp('cbbSiteType').getValue();
                    if (!defaultDomain) defaultDomain = whiteLabelName + '.com';
                    defaultDomain =
                      siteType === 'member'
                        ? defaultDomain
                        : siteType + defaultDomain;
                    if (status === 'testing') {
                      defaultDomain = whiteLabelName + 'main.playliga.com';
                      protocol = 'http';
                    }
                    let columnName = Ext.getCmp('cbbColumn').getValue();
                    let url = protocol + '://' + defaultDomain + '/';
                    switch (columnName) {
                      case 'default':
                      case 'defaultDomain':
                        break;
                      default:
                        url += columnName;
                        break;
                    }
                    url += '?bpx-backend-id=' + backendId;
                    window.open(url, '_blank');
                  } else alert(result.message);
                },
                failure: function (response) {
                  alert(JSON.stringify(response));
                },
              });
            },
          },
        ],
      },
      {
        xtype: 'actioncolumn',
        width: 30,
        tooltip: 'Open Remote Desktop Connection',
        text: 'R',
        dataIndex: 'servers',
        items: [
          {
            getClass: function (value, meta, record, rowIndex, colIndex) {
              var isSpinning = record.get('remoteDesktopSpinner');
              return isSpinning ? 'spinner' : 'remoteDesktop';
            },
            handler: function (grid, rowIndex, colIndex, item, e, record) {
              rowIndex = grid.getStore().indexOf(record);
              record = grid.getStore().getAt(rowIndex);
              var ip = record.get('specificServer');
              record.set('remoteDesktopSpinner', true);
              Ext.Ajax.request({
                method: 'GET',
                url: 'http://localhost:3000/remote/' + ip,
                success: function (response) {
                  record.set('remoteDesktopSpinner', false);
                },
                failure: function (response) {
                  Ext.Msg.alert(
                    'Failure',
                    "Remote Desktop Cli Service doesn't start"
                  );
                  record.set('remoteDesktopSpinner', false);
                },
              });
            },
          },
        ],
      },
      {
        text: '📵',
        width: 50,
        dataIndex: 'mobileRedirect',
        renderer: (value) => (!value ? '✅' : '❌'),
        hidden: true,
      },
      {
        text: '🦶',
        width: 50,
        dataIndex: 'dynamicFooter',
        renderer: (value) => (value ? '✅' : '❌'),
        hidden: true,
      },
      {
        text: '🔒',
        width: 50,
        dataIndex: 'securityQuestion',
        renderer: (value) => (value ? '✅' : '❌'),
        hidden: true,
      },
      {
        text: '✉',
        width: 50,
        dataIndex: 'closedMail',
        renderer: (value) => (!value ? '✉' : '❌'),
        hidden: true,
      },
      {
        text: '▶',
        tooltip: 'Has Playtech',
        width: 50,
        dataIndex: 'closedPlaytech',
        renderer: (value) => (!value ? '▶' : '❌'),
        hidden: true,
      },
    ],
  });
});
