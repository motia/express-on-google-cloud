import unfurl from './unfurl';

unfurl('https://medium.com/jlouage/flutter-row-column-cheat-sheet-78c38d242041')
    .then((a) => console.log(a))
    .catch(e => console.error(e));
