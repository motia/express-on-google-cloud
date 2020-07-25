import { UrlWithStringQuery } from 'url';


export default function (src: string, pageUrlObj: UrlWithStringQuery) {
  let sanitizedSrc = (src || '').trim();
  if (!sanitizedSrc) return;

  if (sanitizedSrc.includes('://')) {
    return sanitizedSrc;
  } else if (sanitizedSrc.startsWith('//')) {
    sanitizedSrc = pageUrlObj.protocol + sanitizedSrc;
  } else {
    const domain = pageUrlObj.protocol + '//' + pageUrlObj.hostname +
      `${pageUrlObj.port ? ':'+pageUrlObj.port : ''}`;
    if(sanitizedSrc.startsWith('/')) {
      // url is relative to website root
      sanitizedSrc = domain + sanitizedSrc;
    } else {
      // url is relative to the page parent
      sanitizedSrc = domain +
        (pageUrlObj.path || '').substring(0, (pageUrlObj.path || '').lastIndexOf('/')) +
        '/' + sanitizedSrc;
    }
  }

  return sanitizedSrc;
}