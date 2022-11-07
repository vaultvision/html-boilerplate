// oidcAppRouter

import { UserManager, Log } from 'oidc-client';

/*!
 * routie - a tiny hash router
 * v0.3.2
 * http://projects.jga.me/routie
 * copyright Greg Allen 2016
 * MIT License
*/
var Routie = function(w, isModule) {

  var routes = [];
  var map = {};
  var reference = "routie";
  var oldReference = w[reference];

  var Route = function(path, name) {
    this.name = name;
    this.path = path;
    this.keys = [];
    this.fns = [];
    this.params = {};
    this.regex = pathToRegexp(this.path, this.keys, false, false);

  };

  Route.prototype.addHandler = function(fn) {
    this.fns.push(fn);
  };

  Route.prototype.removeHandler = function(fn) {
    for (var i = 0, c = this.fns.length; i < c; i++) {
      var f = this.fns[i];
      if (fn == f) {
        this.fns.splice(i, 1);
        return;
      }
    }
  };

  Route.prototype.run = function(params) {
    for (var i = 0, c = this.fns.length; i < c; i++) {
      this.fns[i].apply(this, params);
    }
  };

  Route.prototype.match = function(path, params){
    var m = this.regex.exec(path);

    if (!m) return false;


    for (var i = 1, len = m.length; i < len; ++i) {
      var key = this.keys[i - 1];

      var val = ('string' == typeof m[i]) ? decodeURIComponent(m[i]) : m[i];

      if (key) {
        this.params[key.name] = val;
      }
      params.push(val);
    }

    return true;
  };

  Route.prototype.toURL = function(params) {
    var path = this.path;
    for (var param in params) {
      path = path.replace('/:'+param, '/'+params[param]);
    }
    path = path.replace(/\/:.*\?/g, '/').replace(/\?/g, '');
    if (path.indexOf(':') != -1) {
      throw new Error('missing parameters for url: '+path);
    }
    return path;
  };

  var pathToRegexp = function(path, keys, sensitive, strict) {
    if (path instanceof RegExp) return path;
    if (path instanceof Array) path = '(' + path.join('|') + ')';
    path = path
      .concat(strict ? '' : '/?')
      .replace(/\/\(/g, '(?:/')
      .replace(/\+/g, '__plus__')
      .replace(/(\/)?(\.)?:(\w+)(?:(\(.*?\)))?(\?)?/g, function(_, slash, format, key, capture, optional){
        keys.push({ name: key, optional: !! optional });
        slash = slash || '';
        return '' + (optional ? '' : slash) + '(?:' + (optional ? slash : '') + (format || '') + (capture || (format && '([^/.]+?)' || '([^/]+?)')) + ')' + (optional || '');
      })
      .replace(/([\/.])/g, '\\$1')
      .replace(/__plus__/g, '(.+)')
      .replace(/\*/g, '(.*)');
    return new RegExp('^' + path + '$', sensitive ? '' : 'i');
  };

  var addHandler = function(path, fn) {
    var s = path.split(' ');
    var name = (s.length == 2) ? s[0] : null;
    path = (s.length == 2) ? s[1] : s[0];

    if (!map[path]) {
      map[path] = new Route(path, name);
      routes.push(map[path]);
    }
    map[path].addHandler(fn);
  };

  var routie = function(path, fn) {
    if (typeof fn == 'function') {
      addHandler(path, fn);
      routie.reload();
    } else if (typeof path == 'object') {
      for (var p in path) {
        addHandler(p, path[p]);
      }
      routie.reload();
    } else if (typeof fn === 'undefined') {
      routie.navigate(path);
    }
  };

  routie.lookup = function(name, obj) {
    for (var i = 0, c = routes.length; i < c; i++) {
      var route = routes[i];
      if (route.name == name) {
        return route.toURL(obj);
      }
    }
  };

  routie.remove = function(path, fn) {
    var route = map[path];
    if (!route)
      return;
    route.removeHandler(fn);
  };

  routie.removeAll = function() {
    map = {};
    routes = [];
  };

  routie.navigate = function(path, options) {
    options = options || {};
    var silent = options.silent || false;

    if (silent) {
      removeListener();
    }
    setTimeout(function() {
      window.location.hash = path;

      if (silent) {
        setTimeout(function() { 
          addListener();
        }, 1);
      }

    }, 1);
  };

  routie.noConflict = function() {
    w[reference] = oldReference;
    return routie;
  };

  var getHash = function() {
    return window.location.hash.substring(1);
  };

  var checkRoute = function(hash, route) {
    var params = [];
    if (route.match(hash, params)) {
      route.run(params);
      return true;
    }
    return false;
  };

  var hashChanged = routie.reload = function() {
    var hash = getHash();
    for (var i = 0, c = routes.length; i < c; i++) {
      var route = routes[i];
      if (checkRoute(hash, route)) {
        return;
      }
    }
  };

  var addListener = function() {
    if (w.addEventListener) {
      w.addEventListener('hashchange', hashChanged, false);
    } else {
      w.attachEvent('onhashchange', hashChanged);
    }
  };

  var removeListener = function() {
    if (w.removeEventListener) {
      w.removeEventListener('hashchange', hashChanged);
    } else {
      w.detachEvent('onhashchange', hashChanged);
    }
  };
  addListener();

  if (isModule){
    return routie;
  } else {
    w[reference] = routie;
  }
   
};

Routie(window);


/* ----------end routie lib ---------- */

export function attachAuthEvent(element, authEvent) {
  element.addEventListener("click", (event) => {
    routie(authEvent);    
  })
}

export function oidcAppRouter(env, userLoaded, userUnloaded, silentRenewError, 
                       userSignedIn, userSignedOut, userSessionChanged, userRepaint ){


  const process = {
    "env" : {
     "VV_ISSUER": 'https://dev-.vvkey.io',
     "VV_CLIENT_ID": 'get_from_admin_panel',
     "VV_CALLBACK_URI": window.location.origin + "/#auth_callback",
     "VV_POST_LOGOUT_URI": window.location.origin + "/#auth_logout",
    }
  };

  //override and env with the incoming variables
  Object.assign(process.env, env);

  const oidcConfig = {
    authority: process.env.VV_ISSUER,
    client_id: process.env.VV_CLIENT_ID,
    response_type: 'code',
    scope: 'openid email profile',
    redirect_uri: process.env.VV_CALLBACK_URI,
    loadUserInfo: 'true',
    post_logout_redirect_uri: process.env.VV_POST_LOGOUT_URI,
    automaticSilentRenew: false,
    monitorSession: false,
  };  

  let userManager = {};

  try {
    /**
     * Create the UserManager and attach events
     */

    //Log.logger = console;
    //Log.level = Log.DEBUG;

    userManager = new UserManager(oidcConfig);

    if (userLoaded){
      userManager.events.addUserLoaded(userLoaded);
    }
    if (userUnloaded){
      userManager.events.addUserUnloaded(userUnloaded);
    }
    if (silentRenewError){
      userManager.events.addSilentRenewError(silentRenewError);
    }
    if (userSignedIn){
      userManager.events.addUserSignedIn(userSignedIn);
    }
    if (userSignedOut){
      userManager.events.addUserSignedOut(userSignedOut);
    }
    if (userSessionChanged){
      userManager.events.addUserSessionChanged(userSessionChanged);
    }

    console.log("oidcAppRouter Created");

  } catch(error) {
    throw new Error("oidc-client not found - " + error.message);
  }

  function getUser(next){
    userManager.getUser().then((user) => {
      console.log("getUser");
      console.log(JSON.stringify(user, null, 2));
      next(user);
    });    
  }

  //auth_ functions are callback handlers from the oidc server, this route is for post login authentication
  //by default we want to process the codes/tokens returned for the user and create a user session.
  //This is what the userManager.signinCallback function does.
  function auth_callback(){

    const path = document.location.path ? document.location.path : "";
    userManager.signinCallback().then((user) => {    
        window.history.pushState({}, null, document.location.origin + path);
        userRepaint(user);
    }).catch((error) => {
        console.log("oidce error");
        console.log(error);
        window.history.pushState({}, null, document.location.origin + path);    
    })    
  }

  //auth_ functions are callback handlers from the oidc server, this route is for post logout
  //by default we just want to go back to the home page, but if there was any left over session clean
  //that was needed, this is where that would happen
  function auth_logout(){
    catchall()
  }

  //auth_ functions are callback handlers from the oidc server, this route is where an UNauthenticated
  //vistor is sent when the oidc server did not get a proper signinRequest.  This auth_login endpoint
  //should allow a user to trigger another login request that will create a user.siginRequest.  Usually,
  //this means this auth_login endpoint just need to show a proper 'Login' button.
  function auth_login(){
    catchall()
  }

  function signup(){
    window.history.pushState({}, null, document.location.href.split("#")[0] );    
    userManager.settings.extraQueryParams= { vv_action: 'register' };
    userManager.signinRedirect();
  }

  function logout(){
    window.history.pushState({}, null, document.location.href.split("#")[0] );    
    userManager.settings.extraQueryParams= { vv_action: '' };
    userManager.signoutRedirect();
  }

  function login(){
    window.history.pushState({}, null, document.location.href.split("#")[0] );   
    userManager.settings.extraQueryParams= { vv_action: '' };
    userManager.signinRedirect();
  }

  function profile(){
    getUser(userRepaint);
  }


  function catchall(){
    window.history.pushState({}, null, document.location.href.split("#")[0] ); 
    getUser(userRepaint);
  }

  routie({
    'auth_callback': auth_callback,
    'auth_logout': auth_logout,
    'auth_login': auth_login,
    'signup': signup,
    'logout':logout,
    'login': login,
    'profile': profile,
    '*': catchall
  });

  return {};
}


