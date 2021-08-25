<template>
    <div class="sponsor">
        <a href="https://vx.link/?rel=geekdada" target="_blank" rel="noopener">
            <div><img src="/vxtrans.png" alt="vxtrans"></div>
            <div class="text">有效地降低延迟，改善传输性能</div>
        </a>
    </div>
</template>

<script>
export default {
    name: 'Sponsor',
}
</script>

<style lang="css">
    .sponsor {
        display: flex;
        justify-content: center;
        width: auto;
        margin: 2rem 0 0;
    }
    .sponsor img {
        width: 180px;
    }
    .sponsor .text {
      font-size: 0.8em;
      color: #2c3e50;
      text-align: center;
      margin-top: 0.5em;
    }
</style>