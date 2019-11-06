export default `
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="robots" content="noindex">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/purecss@1.0.1/build/pure-min.min.css" crossorigin="anonymous">
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/purecss@1.0.1/build/grids-responsive-min.css" crossorigin="anonymous">
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/modern-normalize@0.5.0/modern-normalize.min.css" crossorigin="anonymous">
  <script src="https://cdn.jsdelivr.net/npm/clipboard@2.0.4/dist/clipboard.min.js"></script>
  <title>所有 Artifact</title>
  <style>
    .clearfix::after {
      display: block;
      content: "";
      clear: both;
    }
    .container {
      padding: 0 15px;
    }
    .container li,
    .container ul {
      margin: 0;
      padding: 0;
    }
    .container .artifact {
      list-style: none;
      padding: 20px 0 10px;
      border-bottom: 1px solid #eee;
    }
    .artifact .preview {
      background-color: #eee;
      padding: 15px 10px;
      -webkit-overflow-scrolling: touch;
      font-size: 0.85em;
    }
    .artifact .link {
      margin-bottom: 10px;
    }
    .artifact .tag-list {
      vertical-align: top;
      padding: 5px 0 15px;
    }
    .artifact .tag-list > a {
      text-decoration: none;
    }
    .artifact .tag {
      float: left;
      font-size: 70%;
      background-color: #353535;
      color: #fff;
      padding: 0 9px;
      margin: 0 5px 8px 0;
      height: 26px;
      line-height: 26px;
      border-radius: 13px;
    }
    footer {
      text-align: center;
      margin-bottom: 10px;
      padding: 14px 0;
      color: #999;
      font-size: 13px;
      font-family: monospace;
    }
  </style>
</head>
<body>
<div class="pure-g">
  <div class="container pure-u-1 pure-u-md-1-2" style="margin: auto">
    <h1>所有 Artifact</h1>
    <ul>
    {% for artifact in artifactList %}
      <li class="artifact">
        <div class="inner-wrapper">
          <div class="name">{{ artifact.name }}</div>
          <pre class="preview">{{ getPreviewUrl(artifact.name) }}</pre>
          <div class="tag-list clearfix">
            {% if supportEdit %}
            <a rel="nofollow" target="_blank" 
               href="{{ getEditUrl('blob/master/provider/' + artifact.provider + '.js') }}">
              <div class="tag">Provider: {{ artifact.provider }}</div>
            </a>
            {% else %}
            <div class="tag">Provider: {{ artifact.provider }}</div>
            {% endif %}
            
            {% if artifact.combineProviders %}
              {% for provider in artifact.combineProviders %}
                {% if supportEdit %}
                <a rel="nofollow" target="_blank" 
                   href="{{ getEditUrl('blob/master/provider/' + provider + '.js') }}">
                  <div class="tag">Provider: {{ provider }}</div>
                </a>
                {% else %}
                <div class="tag">Provider: {{ provider }}</div>
                {% endif %}
              {% endfor %}
            {% endif %}
          </div>
          <div class="link-group">
            {% if supportEdit %}
            <a rel="nofollow" class="link pure-button pure-button-primary" target="_blank" href="{{ getEditUrl('blob/master/surgio.conf.js') }}">编辑</a>
            {% endif %}
            
            <a rel="nofollow" class="link pure-button pure-button-primary" target="_blank" href="{{ getDownloadUrl(artifact.name) }}">下载</a>
            <a rel="nofollow" class="link pure-button pure-button-primary" target="_blank" href="{{ getPreviewUrl(artifact.name) }}">预览</a>
            <button class="ctc link pure-button pure-button-primary" data-clipboard-text="{{ getPreviewUrl(artifact.name) }}">复制地址</button>
            
            {% if artifact.name.toLowerCase().includes('surge') %}
            <a rel="nofollow" class="link pure-button" target="_blank" href="surge:///install-config?url={{ encodeURIComponent(getPreviewUrl(artifact.name)) }}">Surge</a>
            {% endif %}

            {% if artifact.name.toLowerCase().includes('clash') %}
            <a rel="nofollow" class="link pure-button" target="_blank" href="clash://install-config?url={{ encodeURIComponent(getPreviewUrl(artifact.name)) }}">ClashX/CFW</a>
            {% endif %}
          </div>
        </div>
      </li>
    {% endfor %}
    </ul>
    <footer>
      surgio@v{{ surgioVersion }}
    </footer>
  </div>
</div>
<script>
const clipboard = new ClipboardJS('.ctc');

clipboard.on('success', function(e) {
  alert('复制成功');
});
clipboard.on('error', function() {
  alert('该浏览器不支持复制');
});
</script>
</body>
</html>
`;
