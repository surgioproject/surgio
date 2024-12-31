<template>
    <div class="sponsor">
        <a href="https://zeabur.com?referralCode=geekdada&utm_source=geekdada&utm_campaign=oss" target="_blank">
            <div><img src="https://zeabur.com/deployed-on-zeabur-dark.svg" alt="Deployed on Zeabur"></div>
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
        margin: 0;
        margin-bottom: 1em;
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