---
to: surgio.conf.js
inject: true
skip_if: "name: '<%= name %>'"
after: "artifacts\\:\\ \\["
---
    {
      name: '<%= name %>',
      template: '<%= template %>',
      provider: '<%= provider %>',
<% if (Array.isArray(combineProviders)) { -%>
      combineProviders: [
<% combineProviders.forEach(item => { -%>
        '<%= item %>',
<% }) -%>
      ],
<% } -%>
    },
