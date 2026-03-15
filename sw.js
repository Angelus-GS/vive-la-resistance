/**
 * Copyright 2018 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *     http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// If the loader is already loaded, just stop.
if (!self.define) {
  let registry = {};

  // Used for `eval` and `importScripts` where we can't get script URL by other means.
  // In both cases, it's safe to use a global var because those functions are synchronous.
  let nextDefineUri;

  const singleRequire = (uri, parentUri) => {
    uri = new URL(uri + ".js", parentUri).href;
    return registry[uri] || (
      
        new Promise(resolve => {
          if ("document" in self) {
            const script = document.createElement("script");
            script.src = uri;
            script.onload = resolve;
            document.head.appendChild(script);
          } else {
            nextDefineUri = uri;
            importScripts(uri);
            resolve();
          }
        })
      
      .then(() => {
        let promise = registry[uri];
        if (!promise) {
          throw new Error(`Module ${uri} didn’t register its module`);
        }
        return promise;
      })
    );
  };

  self.define = (depsNames, factory) => {
    const uri = nextDefineUri || ("document" in self ? document.currentScript.src : "") || location.href;
    if (registry[uri]) {
      // Module is already loading or loaded.
      return;
    }
    let exports = {};
    const require = depUri => singleRequire(depUri, uri);
    const specialDeps = {
      module: { uri },
      exports,
      require
    };
    registry[uri] = Promise.all(depsNames.map(
      depName => specialDeps[depName] || require(depName)
    )).then(deps => {
      factory(...deps);
      return exports;
    });
  };
}
define(['./workbox-35c88359'], (function (workbox) { 'use strict';

  self.skipWaiting();
  workbox.clientsClaim();

  /**
   * The precacheAndRoute() method efficiently caches and responds to
   * requests for URLs in the manifest.
   * See https://goo.gl/S9QRab
   */
  workbox.precacheAndRoute([{
    "url": "registerSW.js",
    "revision": "c694130ee8c53e677405ffbaefab1bca"
  }, {
    "url": "maskable-icon-512x512.png",
    "revision": "a1329a6bb9d63f77107164bce59da7f9"
  }, {
    "url": "index.html",
    "revision": "838bb9f2172a3984763a53d2f9dc92c7"
  }, {
    "url": "icon-512x512.png",
    "revision": "cf6fdaf634d6b14dea4551499eb86e2e"
  }, {
    "url": "icon-192x192.png",
    "revision": "b0ae12b153801fc9503a35369bd9d4d6"
  }, {
    "url": "favicon.ico",
    "revision": "b71f577c77ad97f795825ca543674158"
  }, {
    "url": "apple-touch-icon.png",
    "revision": "c0dce7a4e4b6afdd35453d23a2a0e989"
  }, {
    "url": "404.html",
    "revision": "c9f6b505778d5f82433f33fca068913a"
  }, {
    "url": "assets/index-Cxli96P1.css",
    "revision": null
  }, {
    "url": "assets/index-C17SrDvY.js",
    "revision": null
  }, {
    "url": "apple-touch-icon.png",
    "revision": "c0dce7a4e4b6afdd35453d23a2a0e989"
  }, {
    "url": "favicon.ico",
    "revision": "b71f577c77ad97f795825ca543674158"
  }, {
    "url": "icon-192x192.png",
    "revision": "b0ae12b153801fc9503a35369bd9d4d6"
  }, {
    "url": "icon-512x512.png",
    "revision": "cf6fdaf634d6b14dea4551499eb86e2e"
  }, {
    "url": "maskable-icon-512x512.png",
    "revision": "a1329a6bb9d63f77107164bce59da7f9"
  }, {
    "url": "manifest.webmanifest",
    "revision": "4e900fb531f48f34484512c97959e532"
  }], {});
  workbox.cleanupOutdatedCaches();
  workbox.registerRoute(new workbox.NavigationRoute(workbox.createHandlerBoundToURL("index.html")));
  workbox.registerRoute(/^https:\/\/fonts\.googleapis\.com\/.*/i, new workbox.CacheFirst({
    "cacheName": "google-fonts-cache",
    plugins: [new workbox.ExpirationPlugin({
      maxEntries: 10,
      maxAgeSeconds: 31536000
    }), new workbox.CacheableResponsePlugin({
      statuses: [0, 200]
    })]
  }), 'GET');
  workbox.registerRoute(/^https:\/\/fonts\.gstatic\.com\/.*/i, new workbox.CacheFirst({
    "cacheName": "gstatic-fonts-cache",
    plugins: [new workbox.ExpirationPlugin({
      maxEntries: 10,
      maxAgeSeconds: 31536000
    }), new workbox.CacheableResponsePlugin({
      statuses: [0, 200]
    })]
  }), 'GET');
  workbox.registerRoute(/^https:\/\/.*\.manus\.storage\..*/i, new workbox.CacheFirst({
    "cacheName": "image-cache",
    plugins: [new workbox.ExpirationPlugin({
      maxEntries: 20,
      maxAgeSeconds: 2592000
    }), new workbox.CacheableResponsePlugin({
      statuses: [0, 200]
    })]
  }), 'GET');

}));
