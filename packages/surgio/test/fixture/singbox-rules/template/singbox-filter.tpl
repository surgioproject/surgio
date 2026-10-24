{
  "route": {
    "rules": [
      {{ remoteSnippets.telegram.main('proxy') | singbox }},
      {{ snippet('snippet/direct.tpl').main('direct') | singbox }}
    ]
  }
}
