export default `
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/purecss@1.0.1/build/pure-min.min.css" crossorigin="anonymous">
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/purecss@1.0.1/build/grids-responsive-min.css" crossorigin="anonymous">
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/modern-normalize@0.5.0/modern-normalize.min.css" crossorigin="anonymous">
  <script src="https://cdn.jsdelivr.net/npm/clipboard@2.0.4/dist/clipboard.min.js"></script>
  <title>Artifact 查看</title>
  <style>
    .container li,
    .container ul {
      margin: 0;
      padding: 0;
    }
    .container .artifact {
      list-style: none;
      padding: 20px 15px;
      border-bottom: 1px solid #eee;
    }
    .artifact .preview {
      background-color: #eee;
      padding: 15px 10px;
      -webkit-overflow-scrolling: touch;
    }
    .artifact .link {
    }
  </style>
</head>
<body>
<div class="container pure-g">
  <div class="pure-u-1 pure-u-md-1-2" style="margin: auto">
    <ul>
    {% for artifact in artifactList %}
      <li class="artifact">
        <div class="inner-wrapper">
          <div class="name">{{ artifact.name }}</div>
          <pre class="preview">{{ getDownloadUrl(artifact.name) }}</pre>
          <div class="link-group">
            <a class="link pure-button pure-button-primary" target="_blank" href="{{ getDownloadUrl(artifact.name) }}">Link</a>
            <button class="ctc link pure-button pure-button-primary" data-clipboard-text="{{ getDownloadUrl(artifact.name) }}">Copy Link</button>
            
            {% if artifact.name.toLowerCase().includes('surge') %}
              <a class="link pure-button" target="_blank" href="surge:///install-config?url={{ encodeURIComponent(getDownloadUrl(artifact.name)) }}">Surge</a>
            {% endif %}
          </div>
        </div>
      </li>
    {% endfor %}
    </ul>
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
