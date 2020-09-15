<template>
    <div class="sponsor">
        <a href="https://vercel.com/?utm_source=surgio&utm_campaign=oss" target="_blank" rel="noopener">
            <img src="/powered-by-vercel.svg" alt="powered by vercel">
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
        width: 11rem;
        margin: 2rem auto 0;
    }
    .sponsor img {
        width: 100%;
    }
</style>