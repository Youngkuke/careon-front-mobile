import { type Href, router } from 'expo-router';

function href(pathname: string) {
  return pathname as Href;
}

export function pushRoute(pathname: string) {
  router.push(href(pathname));
}

export function replaceRoute(pathname: string) {
  router.replace(href(pathname));
}

export function goBackOrReplace(pathname: string) {
  if (router.canGoBack()) {
    router.back();
    return;
  }

  replaceRoute(pathname);
}
