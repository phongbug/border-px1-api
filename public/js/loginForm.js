﻿Ext.onReady(() => {
  var loginForm = Ext.create('Ext.Panel', {
    id: 'loginForm',
    layout: 'center',
    border: false,
    bodyStyle: 'background:transparent',
    bodyPadding: '50%',
    renderTo: 'app',
    items: [
      {
        xtype: 'form',
        bodyStyle: 'background:transparent',
        title: 'Type Password',
        bodyPadding: 15,
        width: 190,
        url: borderPx1ApiHost + '/user/login',
        layout: 'anchor',
        frame: true,
        defaults: {
          anchor: '100%',
        },
        icon:
          'https://icons.iconarchive.com/icons/hopstarter/soft-scraps/16/Lock-Unlock-icon.png',
        listeners: {
          afterrender: () => {
            var loading = document.getElementById('loading');
            loading.classList.remove('spinner');
          },
        },
        defaultType: 'textfield',
        items: [
          {
            xtype: 'textfield',
            inputType: 'password',
            placeholder: 'password',
            name: 'password',
            allowBlank: false,
            enableKeyEvents: true,
            listeners: {
              keydown: (tf, e) => {
                if (e.getKey() == e.ENTER)
                  Ext.getCmp('btnLogin').fireEvent('click');
              },
              // keypress: () => log('keypress'),
              // keyup: () => log('keyup'),
            },
          },
        ],
        buttons: [
          {
            text: 'Reset',
            icon:
              'https://icons.iconarchive.com/icons/double-j-design/ravenna-3d/16/Reload-icon.png',
            handler: function () {
              this.up('form').getForm().reset();
            },
          },
          {
            text: 'Login',
            id: 'btnLogin',
            formBind: true,
            disabled: true,
            icon:
              'https://icons.iconarchive.com/icons/custom-icon-design/flatastic-8/16/Keys-icon.png',
            listeners: {
              click: () => {
                let loginButton = Ext.getCmp('btnLogin');
                var form = loginButton.up('form').getForm();
                loginButton.setIconCls('spinner');
                loginButton.disable();
                if (form.isValid()) {
                  form.submit({
                    success: function (form, action) {
                      if (!action.result.success)
                        Ext.Msg.alert('Login Failed', action.result.message);
                      else {
                        token = action.result.token;
                        localStorage.setItem('token', token);
                        saveBorderPx1ApiCookie(token)
                        document.getElementById('app').innerHTML = '';
                        loginButton.setIconCls('');
                        loginButton.enable();
                        loadScript('js/whitelabelGrid.js');
                      }
                    },
                    failure: function (form, action) {
                      loginButton.setIconCls('');
                      loginButton.enable();
                      Ext.Msg.alert('Failed', action.result.message);
                    },
                  });
                }
              },
            },
          },
        ],
      },
    ],
  });
});
function saveBorderPx1ApiCookie(cookie) {
  var ifrm = document.createElement('iframe');
  ifrm.setAttribute('style', 'width:0;height:0;border:0; border:none');
  ifrm.setAttribute(
    'src',
    borderPx1ApiHost + '/user/login?cookie=' + cookie
  );
  document.body.appendChild(ifrm);
}
