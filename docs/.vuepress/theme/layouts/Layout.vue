<template>
  <ParentLayout>
    <template #page-bottom>
      <Sponsor />
    </template>
  </ParentLayout>
</template>

<script>
import ParentLayout from '@parent-theme/layouts/Layout.vue';
import Sponsor from '../../components/Sponsor.vue';

export default {
  name: 'Layout',
  components: {
    ParentLayout,
    Sponsor,
  }
}
</script>