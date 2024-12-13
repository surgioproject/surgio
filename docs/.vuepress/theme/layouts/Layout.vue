<template>
  <ParentLayout>
    <template #sidebar-bottom>
      <Sponsor />
    </template>
  </ParentLayout>
</template>

<script setup>
import ParentLayout from '@vuepress/theme-default/layouts/Layout.vue'
import Sponsor from '../../components/Sponsor.vue';
</script>
