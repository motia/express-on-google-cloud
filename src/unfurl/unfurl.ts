import * as htmlparser2 from 'htmlparser2';
import * as url from 'url';
import {http, https} from 'follow-redirects';
import normalizeImgSrc from './normalizeImgSrc';
import getRemoteImageSize from './getRemoteImageSize';
import { Handler as Htmlparser2Handler } from 'htmlparser2/lib/Parser';

const MAX_IMAGES_PROCESS = process.env.MAX_IMAGES_PROCESS || 10;

type UnfurlResult = {
  title: string | null,
  favicon: string | null,
  'large-image': string | null,
  snippet: string | null,
};

class TitleParser implements Partial<Htmlparser2Handler> {
  private shouldParseTitle = false;
  private found = false;

  constructor(private onTitle: (str: string) => void) {}

  onopentag(name: string) {
    if (!this.found && name === 'title') {
      this.shouldParseTitle = true;
    } 
  }

  ontext(text: string) {
    if (this.shouldParseTitle) {
      this.found = true;
      this.onTitle(text);
    }
  }

  onclosetag() {
    this.shouldParseTitle = false;
  }
}

class LargestImgParser implements Partial<Htmlparser2Handler> {
  private imagesCount = 0;
  private readonly imgProcessingPromises: {[src: string]: Promise<unknown>} = {};
  private largestImgSize = { width: 0, height: 0 };
  public largestImgSrc: string | null = null;

  private processingFinished?: Promise<void>;
  private onFinish?: () => void;

  constructor(
    private pageUrlObj: url.UrlWithStringQuery,
    private onSrcUpdate: (str: string) => void, 
    private onAsyncTak: (p: Promise<void>) => void,
  ) {}

  onopentag(name: string, attribs: {[k: string]: string}) {
    if (name !== 'img' || !attribs.src) {
      return;
    }
    if (this.imagesCount > MAX_IMAGES_PROCESS) {
      return;
    }
    const sanitizedSrc = normalizeImgSrc(attribs.src, this.pageUrlObj);
    if (!sanitizedSrc) {
      return;
    }

    if (sanitizedSrc in this.imgProcessingPromises) {
      return;
    }

    this.imagesCount += 1;
    this.imgProcessingPromises[sanitizedSrc] = this.asyncProcessImage(sanitizedSrc);

    if (Object.keys(this.imgProcessingPromises).length === 1) {
      this.processingFinished = new Promise<void>((resolve) => {
        this.onFinish = resolve;
      });
      this.onAsyncTak(this.processingFinished);
    }
  }

  async asyncProcessImage(sanitizedSrc: string) {
    const size = await getRemoteImageSize(sanitizedSrc, 15 * 1000)
      .catch(() => ({ width: 0, height: 0 }));

    const newArea = size.width * size.height;
    const oldArea = this.largestImgSize.width * this.largestImgSize.height;

    if (newArea > oldArea) {
      this.largestImgSize = size;
      this.largestImgSrc = sanitizedSrc;
      this.onSrcUpdate(this.largestImgSrc);
    }
  }

  onend() {
    if (this.onFinish) {
      Promise.all(Object.values(this.imgProcessingPromises))
        .then(() => { if (this.onFinish) this.onFinish(); });
    }
  }
}

class FaviconParser implements Partial<Htmlparser2Handler> {
  private found = false;
  constructor(private onFavicon: (str: string) => void) { }

  onopentag(name: string, attribs: { [k: string]: string }) {
    if (this.found) {
      return;
    }
    if (name === 'link' && attribs.rel === 'icon' && !!attribs.href) {
      this.found = true;
      this.onFavicon(attribs.href.trim());
    }
  }
}

class SnippetParser implements Partial<Htmlparser2Handler> {
  private found = false;
  constructor(private onSnippet: (str: string) => void) { }

  onopentag(name: string, attribs: { [k: string]: string }) {
    if (this.found) {
      return;
    }

    if (name === 'meta' && attribs.name === 'description' && !!attribs.content) {
      this.onSnippet(attribs.content.trim());
    }
  }
}


function createParser (pageUrl: string) {
  const pageUrlObj = url.parse(pageUrl);
  
  let allDoneResolve: () => void;
  const allDonePromise = new Promise<void>((res) => allDoneResolve = res);

  const unfurled: UnfurlResult = {
    title: null,
    favicon: null,
    'large-image': null,
    snippet: null,
  }; 

  const processingPromises: Promise<unknown>[] = [];

  const updateUnfurledProp = (prop: keyof UnfurlResult) => (v: string) => {
    // console.log(`---- Unfurled update ${prop} ${unfurled[prop]} to ${v}`);
    unfurled[prop] = v;
  };

  const partialHandlers: Partial<Htmlparser2Handler>[] = [
    new TitleParser(updateUnfurledProp('title')),
    new FaviconParser(updateUnfurledProp('favicon')),
    new SnippetParser(updateUnfurledProp('snippet')),
    new LargestImgParser(
      pageUrlObj,
      updateUnfurledProp('large-image'),
      (p) => { processingPromises.push(p); }
    ),
  ];

  const supportedHooks: (keyof Htmlparser2Handler)[] = ['onopentag', 'ontext', 'onclosetag', 'onend'];
  const mergedPartialHandlers: Partial<Htmlparser2Handler> = supportedHooks
    .reduce(((mergedPartialHandlers, h) => {
      mergedPartialHandlers[h] = function () {
        partialHandlers.forEach(u => {
          if (u[h]) {
            // eslint-disable-next-line @typescript-eslint/ban-types, prefer-rest-params
            (u[h] as Function).call(u, ...arguments);
          }
        });
      };
      return mergedPartialHandlers;    
    }), {});


  const parser = new htmlparser2.Parser(
    {
      ...mergedPartialHandlers,
      onend: async () => {
        if (typeof mergedPartialHandlers.onend === 'function') {
          mergedPartialHandlers.onend();
        }
        await Promise.all(processingPromises);
        allDoneResolve();
      }
    },
    { decodeEntities: true }
  );
    
  return { 
    done: allDonePromise.then(() => unfurled),
    write: (x: string) => {parser.write(x);},
    end: () => parser.end(),
  };
}
  
export default function unfurl(pageUrl: string): Promise<UnfurlResult> {
  const { done, write, end } = createParser(pageUrl);
  
  (pageUrl.startsWith('http://') ? http : https).get(pageUrl, function (response) {
    response.on('data', function(chunk) {
      write(chunk);
    }).on('end', () => {
      end();
    });
  });
  
  return done;
}
    