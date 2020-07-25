import {parse} from 'url';
import { strictEqual } from 'assert';
import normalizeImgSrc from './normalizeImgSrc';


describe('normalize image url correctly', function () {
  it('parse absolute url', function () {
    strictEqual(
      normalizeImgSrc(
        'https://hello.com/wow.png',
        parse('https://hello.com/page')
      ),
      'https://hello.com/wow.png'
    );
  });


  it('add missing scheme when src starts with //', function () {
    strictEqual(
      normalizeImgSrc(
        '//hello.com/wow.png',
        parse('https://hello.com/page')
      ),
      'https://hello.com/wow.png'
    );
  });

  it('add scheme and hostname when relative to website root', function () {
    strictEqual(
      normalizeImgSrc(
        '/wow.png',
        parse('https://hello.com/page')
      ),
      'https://hello.com/wow.png'
    );
  });

  it('removes page url part when relative to current page', function () {
    strictEqual(
      normalizeImgSrc(
        'wow.png',
        parse('https://hello.com/page/nested')
      ),
      'https://hello.com/page/wow.png'
    );
  });
});
