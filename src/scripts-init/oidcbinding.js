import { oidcAppRouter, attachAuthEvent } from './oidcAppRouter.js'

$(document).ready(() => {
  
  //env defaults
  if (!window.vv_process) {
    if (window.location.hostname.toLowerCase() == "localhost") {
      window.vv_process = { env: {
       "VV_ISSUER": 'https://dev-.vvkey.io',
       "VV_CLIENT_ID": 'get_from_admin_panel',
       "VV_TENANT_ID": 'get_from_admin_panel',
       "VV_CALLBACK_URI": window.location.origin + "/#auth_callback",
       "VV_POST_LOGOUT_URI": window.location.origin + "/#auth_logout",    
      }};
    } else {
      window.vv_process = { env: {}};
    }
  }

  const manageHost = window.localStorage.getItem('manageHost');

  //logo get and display
  const logoEl = document.querySelector('.app-header__logo .logo-src');
  const tenant_settings = document.createElement('script');
  tenant_settings.setAttribute('src', window.vv_process.env.VV_ISSUER + '/tenant.js');
  
  document.head.appendChild(tenant_settings);
  tenant_settings.addEventListener('load', function() {
    if (window.vv_tenant_data && window.vv_tenant_data.logo_image_url) {
      logoEl.style.backgroundImage = 'url("' + window.vv_tenant_data.logo_image_url + '")';
    } else if (window.vv_tenant_data && window.vv_tenant_data.logo_image_text) {
      logoEl.classList.add("logo-text");
      logoEl.innerText = window.vv_tenant_data.logo_image_text;
    }
  });


  //Custom --------------------

  function fixedEncodeURIComponent (str) {
    return encodeURIComponent(str).replace(/[!'()]/g, escape).replace(/\*/g, "%2A");
  }

  function tlink(link) {
    let tenantRegEx = new RegExp("(/tenants/)([^/]*)(/?.*)");

    if (link.match(tenantRegEx)) {
      return link.replace(tenantRegEx, "$1" + fixedEncodeURIComponent(window.vv_process.env.VV_TENANT_ID) + "$3");
    } else {
      return link;
    }
  }

  function alink(link) {
    let authRegEx = new RegExp("(authority)");

    if (link.match(authRegEx)) {
      return link.replace(authRegEx, window.vv_process.env.VV_ISSUER);
    } else {
      return link;
    }
  }


  const urlparams = new URLSearchParams(window.location.search);
  const is_vv_tenant_query = urlparams.get("is_vv_tenant");
  let is_vv_tenant = false;

  if (is_vv_tenant_query === 'true') {
    is_vv_tenant = true;
    window.localStorage.setItem('is_vv_tenant', 'true');
  } else {
    const is_vv_tenant_storage = window.localStorage.getItem('is_vv_tenant');
    if (is_vv_tenant_storage === 'true') {
      is_vv_tenant = true;
    }
  }

  const manageLinkList = document.querySelectorAll(".manageLink");
  if (manageLinkList && manageLinkList.length > 0 ) {
    manageLinkList.forEach(node => {
      node.addEventListener("click", (event) => {
        let link = node.dataset.thref;
        if (manageHost) {
          link = link.replace("manage.vaultvision.com", manageHost);
        }
        window.open(tlink(link), "manage");
      })
    })
  }    

  const authorityLinkList = document.querySelectorAll(".authorityLink");
  if (authorityLinkList && authorityLinkList.length > 0 ) {
    authorityLinkList.forEach(node => {
      node.addEventListener("click", (event) => {
        window.location.assign(alink(node.dataset.authhref));
      })
    })
  }    

  //dynamic devdash name
  const devdashList = document.querySelectorAll(".devdash");
  if (devdashList && devdashList.length > 0 ) {
    devdashList.forEach(node => {
      node.innerText = window.location.hostname.split(".")[0];
    })
  }   


  //Generic and Class based --------------------

  //assign click handlers for all login, logout, signup buttons
  const authEvents = ["login", "logout", "signup"];
  authEvents.forEach(authevent => {
    const elList = document.querySelectorAll(".btn-" + authevent);
    if (elList && elList.length > 0 ) {
      elList.forEach(node => {
        attachAuthEvent(node, authevent);
      })
    }    
  })

  function userRepaint(user){
    const rowElList = document.querySelectorAll(".unauthed, .authed, .manage");
    const nameEl = document.querySelector(".app-header .header-user-info > .widget-heading");
    const titleEl = document.querySelector(".app-header .header-user-info > .widget-subheading");     

    if (rowElList && rowElList.length > 0 ) {
      Object.values(rowElList).forEach(function(node) {
        //check manage first this is higher display priority
        if (node.classList.contains('manage') && !is_vv_tenant) {
          node.classList.add('d-none');
        //check auth next
        } else {          
          if (node.classList.contains('authed') && user) {
            node.classList.remove('d-none');
          } else if (node.classList.contains('unauthed') && !user) {
            node.classList.remove('d-none');
          } else if (!node.classList.contains('unauthed') && !node.classList.contains('authed')) {
            node.classList.remove('d-none');
          }
        }
      })
    }

    //The authenticated case
    if (user) {
      nameEl.innerText = user.profile.name;
      titleEl.innerText = user.profile.email;
    //The unauthenticated case
    } else {
      nameEl.innerText = "Login";
      titleEl.innerText = "Signup";
    }
  }

  function userClear(){
    userRepaint(null);
    sessionStorage.setItem("currentUser", "");
  }

  oidcAppRouter(window.vv_process.env, userRepaint, userClear, null, userRepaint, userClear, null, userRepaint);

});      
