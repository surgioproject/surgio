const Benchmark = require('benchmark');
const { loadRemoteSnippetList } = require('../../build/utils/remote-snippet');
const suite = new Benchmark.Suite();

loadRemoteSnippetList([
  {
    url: 'https://raw.githubusercontent.com/DivineEngine/Profiles/master/Surge/Ruleset/Extra/ChinaIP.list',
    name: 'chinaip',
  },
]).then((res) => {
  const snippet = res[0];

  // add tests
  suite
    .add('snippet.main', () => {
      snippet.main('PROXY');
    })
    // add listeners
    .on('cycle', function (event) {
      console.log(String(event.target));
    })
    .on('complete', function () {
      console.log('Fastest is ' + this.filter('fastest').map('name'));
    })
    // run async
    .run({ async: true });
});
