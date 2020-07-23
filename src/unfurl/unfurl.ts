import * as htmlparser2 from "htmlparser2";
import * as url from 'url';
import * as https from 'https';
import normalizeImgSrc from './normalizeImgSrc';
import getRemoteImageSize from './getRemoteImageSize';

const MAX_IMAGES_PROCESS = process.env.MAX_IMAGES_PROCESS || 8;

type UnfurlResult = {
  title: string | null,
  favicon: string | null,
  'large-image': string | null,
  snippet: string | null,
};

function createParser (pageUrl) {
  const pageUrlObj = url.parse(pageUrl);
  
  let allDoneResolve: () => void;
  const allDonePromise = new Promise<void>((res) => allDoneResolve = res);

  const unfurled: UnfurlResult = {
    title: null,
    favicon: null,
    'large-image': null,
    snippet: null,
  }; 

  let imagesCount = 0;
  const processingPromises = {};
  let largestImgSize = {width: 0, height: 0};
  let shouldParseTitle: boolean = false;
  
  const parser = new htmlparser2.Parser(
    {
      async onopentag(name, attribs) {
        if (!unfurled.title && name === "title") {
          shouldParseTitle = true;
        } 
        
        if (!unfurled.snippet) {
          if (name === 'meta' && attribs.name === 'description' && !!attribs.content) {
            unfurled.snippet = attribs.content.trim();
          }
        }
        
        if (!unfurled.favicon) {
          if (name === 'link' && attribs.rel === 'icon' && !!attribs.href) {
            unfurled.favicon = attribs.href.trim();
          }
        }
        
        if (name === 'img' && attribs.src) {
          if (imagesCount > MAX_IMAGES_PROCESS) {
            return;
          }
          const sanitizedSrc = normalizeImgSrc(attribs.src, pageUrlObj);
          if (!sanitizedSrc) {
            return;
          }
          
          if ('img-'+sanitizedSrc in processingPromises) {
            return;
          }
          imagesCount += 1;
          processingPromises[sanitizedSrc] = getRemoteImageSize(sanitizedSrc, 15 * 1000)
           .catch(e => ({width: 0, height: 0}));
          const size = await processingPromises[sanitizedSrc];
          const newArea = size.width * size.height;
          const oldArea = largestImgSize.width * largestImgSize.height;
          
          if (newArea > oldArea) {
            largestImgSize = size;
            unfurled['large-image'] = sanitizedSrc;
          }
        }
      },
      
      ontext(text) {
        if (shouldParseTitle) {
          unfurled.title = text;
        }
      },
      
      onclosetag(tagname) {
        shouldParseTitle = false;
      },
      
      async onend() {
        await Promise.all(Object.values(processingPromises));
        allDoneResolve();
      }
    },
    { decodeEntities: true }
    );
    
    return { 
      done: allDonePromise.then(() => unfurled),
      write: (x) => parser.write(x),
      end: () => parser.end(),
    };
}
  
export default function unfurl(pageUrl: string) {
  const { done, write, end } = createParser(pageUrl);
  
  https.get(pageUrl, function (response) {
    response.on('data', function(chunk) {
      write(chunk);
    }).on('end', () => {
      end()
    });
  });
  
  return done
}
    