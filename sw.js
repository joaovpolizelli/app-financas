/* Nossas Finanças — offline support.
   Only used when the app is published at a web address (needed on iPhone).
   Strategy: always try the network first (so a new version of the app is picked up
   right away) and fall back to the saved copy when there is no connection.
   Your financial data never goes through here: it lives in the phone's own storage. */
var CACHE = 'nossas-financas-v1';

self.addEventListener('install', function(event){
  self.skipWaiting();
});

self.addEventListener('activate', function(event){
  event.waitUntil(
    caches.keys().then(function(keys){
      return Promise.all(keys.filter(function(k){ return k !== CACHE; }).map(function(k){ return caches.delete(k); }));
    }).then(function(){ return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function(event){
  var req = event.request;
  if (req.method !== 'GET') return;
  var url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // fonts etc.: straight to the network
  event.respondWith(
    fetch(req).then(function(res){
      if (res && res.ok){
        var copy = res.clone();
        caches.open(CACHE).then(function(c){ c.put(req, copy); });
      }
      return res;
    }).catch(function(){
      return caches.match(req, {ignoreSearch: true}).then(function(hit){
        if (hit) return hit;
        if (req.mode === 'navigate'){
          return caches.open(CACHE).then(function(c){
            return c.keys().then(function(keys){
              var page = keys.filter(function(k){ return /\.html?$|\/$/.test(new URL(k.url).pathname); })[0];
              return page ? c.match(page) : Response.error();
            });
          });
        }
        return Response.error();
      });
    })
  );
});
