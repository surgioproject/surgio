<template>
  <div>
    <div id="codefund"></div>
  </div>
</template>

<script>
  export default {
    mounted() {
      this.load();
    },
    watch: {
      '$route'(to, from) {
        if (
          to.path !== from.path
        ) {
          this.$el.querySelector('#codefund').innerHTML = '';
          this.load();
        }
      },
    },
    methods: {
      load() {
        const s = document.createElement('script');
        s.id = 'codefund-js';
        s.src = `https://app.codefund.io/properties/702/funder.js`;
        s.async = 'async';
        this.$el.appendChild(s);
      },
    },
  };
</script>

<style scoped>
  .cf-wrapper {
    border-radius: 0 !important;
  }
</style>
